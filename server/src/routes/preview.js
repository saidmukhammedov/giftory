import dns from 'node:dns/promises';
import net from 'node:net';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { fail } from './wishlists.js';

const router = Router();
const MAX_BYTES = 1_500_000;

const privateIp = (ip) => {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b < 128) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b < 32) || (a === 192 && b === 168) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith('::ffff:')) return privateIp(v.slice(7));
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
};

async function safeUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
  if (url.port && !['80', '443'].includes(url.port)) return null;
  const addrs = await dns.lookup(url.hostname, { all: true }).catch(() => []);
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) return null;
  return url;
}

async function fetchPage(raw) {
  let url = await safeUrl(raw);
  for (let hop = 0; url && hop < 4; hop++) {
    const r = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GiftoryBot/1.0; +https://giftory.uz)', Accept: 'text/html', 'Accept-Language': 'uz,ru;q=0.9,en;q=0.8' },
    });
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
      url = await safeUrl(new URL(r.headers.get('location'), url).href);
      continue;
    }
    if (!r.ok || !(r.headers.get('content-type') || '').includes('html')) return null;
    const reader = r.body.getReader();
    let html = '';
    const decoder = new TextDecoder();
    while (html.length < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});
    return { html, url };
  }
  return null;
}

const decode = (s) => s?.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

function meta(html, names) {
  for (const name of names) {
    const re = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${name}["'][^>]*>`, 'i');
    const tag = html.match(re)?.[0];
    const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
    if (content) return decode(content);
  }
  return null;
}

function jsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  for (const block of blocks) {
    let data;
    try { data = JSON.parse(block); } catch { continue; }
    const nodes = [data].flat().flatMap((d) => d?.['@graph'] || [d]);
    const product = nodes.find((n) => [n?.['@type']].flat().includes('Product'));
    if (product) {
      const offer = [product.offers].flat()[0] || {};
      return { name: product.name, image: [product.image].flat()[0]?.url || [product.image].flat()[0], price: offer.price ?? offer.lowPrice };
    }
  }
  return {};
}

const toPrice = (v) => {
  if (v == null) return null;
  const n = Number(String(v).replace(/[^\d.,]/g, '').replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.'));
  return n > 0 ? Math.round(n) : null;
};

router.post('/', requireAuth, async (req, res) => {
  const page = await fetchPage(String(req.body.url || '')).catch(() => null);
  if (!page) throw fail(422, "Couldn't read that page. Fill in the details yourself.");
  const ld = jsonLd(page.html);
  const name = decode(ld.name) || meta(page.html, ['og:title', 'twitter:title']) || decode(page.html.match(/<title[^>]*>([^<]*)/i)?.[1]);
  const image = ld.image || meta(page.html, ['og:image', 'og:image:url', 'twitter:image']);
  const price = toPrice(ld.price) || toPrice(meta(page.html, ['product:price:amount', 'og:price:amount', 'price']));
  if (!name && !image && !price) throw fail(422, "Couldn't read that page. Fill in the details yourself.");
  res.json({
    name: name?.slice(0, 120) || null,
    price,
    image: image ? new URL(image, page.url).href : null,
  });
});

export default router;
