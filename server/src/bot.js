import crypto from 'node:crypto';
import { query, one } from './db.js';
import { text } from './texts.js';

const api = () => process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
const token = () => process.env.TELEGRAM_BOT_TOKEN;
const site = () => process.env.PUBLIC_URL || '';
export const botEnabled = () => !!token();

export async function call(method, body) {
  if (!botEnabled()) return null;
  try {
    const r = await fetch(`${api()}/bot${token()}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    return await r.json();
  } catch {
    return null;
  }
}

export async function sendTo(user, key, vars, path = '/') {
  if (!user?.telegram_id || !user.bot_ok || !botEnabled()) return false;
  const lang = user.lang || 'en';
  const r = await call('sendMessage', {
    chat_id: user.telegram_id,
    text: text(lang, key, vars),
    reply_markup: { inline_keyboard: [[{ text: text(lang, path === '/' ? 'open' : 'openList'), url: site() + path }]] },
  });
  if (r?.error_code === 403) await query('UPDATE users SET bot_ok = false WHERE id = $1', [user.id]);
  return !!r?.ok;
}

export async function once(key, send) {
  const fresh = await one('INSERT INTO notifications (key) VALUES ($1) ON CONFLICT DO NOTHING RETURNING key', [key]);
  if (fresh) await send();
}

const USER = 'SELECT id, telegram_id, bot_ok, lang FROM users WHERE id = $1';

export async function notifyReserved(item) {
  const row = await one('SELECT w.title, w.slug, w.owner_id FROM wishlists w WHERE w.id = $1', [item.wishlist_id]);
  await sendTo(await one(USER, [row.owner_id]), 'reserved', { list: row.title }, '/dashboard');
}

export async function notifyFunded(item) {
  if (item.funded < item.price) return;
  const users = await query(`SELECT DISTINCT u.id, u.telegram_id, u.bot_ok, u.lang FROM contributions c JOIN users u ON u.id = c.user_id WHERE c.item_id = $1`, [item.id]);
  await Promise.all(users.map((u) => sendTo(u, 'funded', { item: item.name }, '/reserved')));
}

export async function notifyThanks(wishlistId) {
  const list = await one('SELECT w.thanks, u.name FROM wishlists w JOIN users u ON u.id = w.owner_id WHERE w.id = $1', [wishlistId]);
  if (!list?.thanks) return;
  const givers = await query(
    `SELECT DISTINCT u.id, u.telegram_id, u.bot_ok, u.lang FROM users u
     WHERE u.id IN (SELECT reserved_by FROM items WHERE wishlist_id = $1
                    UNION SELECT c.user_id FROM contributions c JOIN items i ON i.id = c.item_id WHERE i.wishlist_id = $1)`,
    [wishlistId]
  );
  await Promise.all(givers.map((u) => once(`thanks:${wishlistId}:${u.id}`, () => sendTo(u, 'thanks', { owner: list.name, text: list.thanks }, '/reserved'))));
}

export async function dailyReminders() {
  const soon = await query(
    `SELECT DISTINCT w.id, w.slug, o.name AS owner, u.id AS user_id, u.telegram_id, u.bot_ok, u.lang
     FROM wishlists w JOIN users o ON o.id = w.owner_id JOIN items i ON i.wishlist_id = w.id
     LEFT JOIN contributions c ON c.item_id = i.id
     JOIN users u ON u.id = coalesce(i.reserved_by, c.user_id)
     WHERE w.event_date = (now() AT TIME ZONE 'Asia/Tashkent')::date + 3`
  );
  for (const r of soon) {
    const picked = await query(
      `SELECT DISTINCT i.name FROM items i LEFT JOIN contributions c ON c.item_id = i.id
       WHERE i.wishlist_id = $1 AND (i.reserved_by = $2 OR c.user_id = $2)`,
      [r.id, r.user_id]
    );
    await once(`remind:${r.id}:${r.user_id}`, () =>
      sendTo({ id: r.user_id, ...r }, 'remind', { owner: r.owner, items: picked.map((p) => p.name).join(', ') }, `/w/${r.slug}`)
    );
  }

  const birthdays = await query(
    `SELECT f.follower_id, p.id AS person_id, p.name, u.telegram_id, u.bot_ok, u.lang,
            (SELECT slug FROM wishlists WHERE owner_id = p.id ORDER BY created_at DESC LIMIT 1) AS slug
     FROM follows f JOIN users p ON p.id = f.followee_id JOIN users u ON u.id = f.follower_id
     WHERE p.birthday IS NOT NULL
       AND to_char(p.birthday, 'MM-DD') = to_char((now() AT TIME ZONE 'Asia/Tashkent')::date + 3, 'MM-DD')`
  );
  const year = new Date().getFullYear();
  for (const b of birthdays) {
    await once(`birthday:${b.person_id}:${b.follower_id}:${year}`, () =>
      sendTo({ id: b.follower_id, ...b }, 'birthday', { name: b.name }, b.slug ? `/w/${b.slug}` : '/dashboard')
    );
  }
  return { reminders: soon.length, birthdays: birthdays.length };
}

export function checkInitData(initData) {
  if (!botEnabled() || typeof initData !== 'string') return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const check = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(token()).digest();
  const expected = crypto.createHmac('sha256', secret).update(check).digest('hex');
  if (expected.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash))) return null;
  if (Date.now() / 1000 - Number(params.get('auth_date')) > 86400) return null;
  try {
    return { user: JSON.parse(params.get('user')), startParam: params.get('start_param') };
  } catch {
    return null;
  }
}

export async function setupBot(secret) {
  if (!botEnabled() || !site()) return;
  const url = `${site()}/api/bot/webhook`;
  const info = await call('getWebhookInfo', {});
  if (info?.result?.url === url) return;
  await call('setWebhook', { url, secret_token: secret, allowed_updates: ['message'] });
  await call('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Giftory', web_app: { url: site() } } });
}
