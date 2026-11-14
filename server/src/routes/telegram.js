// "Log in with Telegram" via Telegram's OpenID Connect (authorization code + PKCE).
// Docs: https://core.telegram.org/bots/telegram-login
import crypto from 'node:crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { one } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();
const env = () => ({
  base: process.env.TELEGRAM_OAUTH_URL || 'https://oauth.telegram.org',
  id: process.env.TELEGRAM_CLIENT_ID,
  secret: process.env.TELEGRAM_CLIENT_SECRET,
  site: process.env.PUBLIC_URL,
});
export const telegramEnabled = () => { const e = env(); return !!(e.id && e.secret && e.site); };

let jwks;
const keys = () => (jwks ??= createRemoteJWKSet(new URL(`${env().base}/.well-known/jwks.json`)));
const b64url = (buf) => buf.toString('base64url');
const cookieName = 'tg_oauth';
const readCookie = (req) => req.headers.cookie?.split(/;\s*/).find((c) => c.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
const safeNext = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard');

// A logged-in user asks to connect Telegram: hand out a short-lived ticket for the redirect
router.post('/link', requireAuth, (req, res) => {
  res.json({ ticket: jwt.sign({ link: req.userId }, process.env.JWT_SECRET, { expiresIn: '10m' }) });
});

// Step 1: send the browser to Telegram
router.get('/start', (req, res) => {
  const e = env();
  if (!telegramEnabled()) return res.redirect('/login?error=telegram_off');
  let link = null;
  if (req.query.ticket) {
    try { link = jwt.verify(String(req.query.ticket), process.env.JWT_SECRET).link; } catch { return res.redirect('/dashboard?error=telegram'); }
  }
  const state = b64url(crypto.randomBytes(24));
  const verifier = b64url(crypto.randomBytes(48));
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
  const cookie = jwt.sign({ state, verifier, next: safeNext(req.query.next), link }, process.env.JWT_SECRET, { expiresIn: '10m' });
  res.setHeader('Set-Cookie', `${cookieName}=${cookie}; Path=/api/auth/telegram; HttpOnly; SameSite=Lax; Max-Age=600${e.site.startsWith('https') ? '; Secure' : ''}`);
  const params = new URLSearchParams({
    client_id: e.id, redirect_uri: `${e.site}/api/auth/telegram/callback`, response_type: 'code',
    scope: 'openid profile', state, code_challenge: challenge, code_challenge_method: 'S256',
  });
  res.redirect(`${e.base}/auth?${params}`);
});

// Step 2: Telegram sends the browser back with a code; trade it for a signed id_token
router.get('/callback', async (req, res) => {
  const e = env();
  res.setHeader('Set-Cookie', `${cookieName}=; Path=/api/auth/telegram; Max-Age=0`);
  let saved;
  try { saved = jwt.verify(readCookie(req) || '', process.env.JWT_SECRET); } catch { return res.redirect('/login?error=telegram'); }
  const back = saved.link ? '/dashboard' : '/login';
  if (!req.query.code || req.query.state !== saved.state) return res.redirect(`${back}?error=telegram`);

  try {
    const r = await fetch(`${e.base}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + Buffer.from(`${e.id}:${e.secret}`).toString('base64') },
      body: new URLSearchParams({ grant_type: 'authorization_code', code: String(req.query.code), redirect_uri: `${e.site}/api/auth/telegram/callback`, client_id: e.id, code_verifier: saved.verifier }),
    });
    const { id_token } = await r.json();
    const { payload: tg } = await jwtVerify(id_token, keys(), { issuer: e.base, audience: String(e.id) });
    const telegramId = String(tg.sub);
    const name = tg.name || [tg.given_name, tg.family_name].filter(Boolean).join(' ') || tg.preferred_username || 'Telegram user';

    let user;
    if (saved.link) {
      // Connect Telegram to the logged-in account, unless another account already uses it
      user = await one('UPDATE users SET telegram_id = $2, avatar_url = coalesce(avatar_url, $3) WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM users WHERE telegram_id = $2 AND id <> $1) RETURNING id', [saved.link, telegramId, tg.picture || null]);
      if (!user) return res.redirect('/dashboard?error=telegram_taken');
    } else {
      user = await one(
        `INSERT INTO users (name, telegram_id, avatar_url) VALUES ($1, $2, $3)
         ON CONFLICT (telegram_id) DO UPDATE SET avatar_url = coalesce(EXCLUDED.avatar_url, users.avatar_url) RETURNING id`,
        [name, telegramId, tg.picture || null]
      );
    }
    // Token goes in the URL fragment, which browsers never send to servers or log
    res.redirect(`/auth/telegram#token=${signToken(user.id)}&next=${encodeURIComponent(saved.link ? '/dashboard' : saved.next)}`);
  } catch (err) {
    console.error('Telegram login failed:', err.message);
    res.redirect(`${back}?error=telegram`);
  }
});

export default router;
