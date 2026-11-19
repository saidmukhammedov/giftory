import { Router } from 'express';
import { one } from '../db.js';
import { text } from '../texts.js';

const router = Router();
let shell;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function page(site) {
  if (!shell) {
    const r = await fetch(`${site}/index.html`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) throw new Error('index.html unavailable');
    shell = await r.text();
  }
  return shell;
}

router.get('/w/:slug', async (req, res) => {
  const site = process.env.PUBLIC_URL || `https://${req.get('host')}`;
  let html = await page(site);
  const list = await one(
    `SELECT w.title, u.name AS owner, (SELECT image FROM items WHERE wishlist_id = w.id AND image IS NOT NULL ORDER BY created_at LIMIT 1) AS image
     FROM wishlists w JOIN users u ON u.id = w.owner_id WHERE w.slug = $1`,
    [req.params.slug]
  ).catch(() => null);
  if (list) {
    const image = list.image ? new URL(list.image, site).href : `${site}/og.png`;
    const tags = {
      'og:title': list.title,
      'og:description': text('uz', 'previewText', { owner: list.owner }),
      'og:image': image,
      'og:url': `${site}/w/${req.params.slug}`,
    };
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(list.title)} · Giftory</title>`)
      .replace(/<meta (property|name)="(og:title|og:description|og:image|og:url|description|twitter:card)"[^>]*>\s*/g, '')
      .replace(
        '</head>',
        `${Object.entries(tags).map(([k, v]) => `<meta property="${k}" content="${esc(v)}" />`).join('')}<meta name="description" content="${esc(tags['og:description'])}" /><meta name="twitter:card" content="${list.image ? 'summary' : 'summary_large_image'}" /></head>`
      );
  }
  res.set({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=60' }).send(html);
});

export default router;
