import { spawn } from 'node:child_process';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import http from 'node:http';
import crypto from 'node:crypto';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';

const TG = 'http://127.0.0.1:5066', CLIENT_ID = '123456', SECRET = 's3cret';
const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
const codes = new Map();
let nextTgUser = { sub: '9001', name: 'Madina Telegram', preferred_username: 'madina', picture: 'https://t.me/i/userpic/madina.jpg' };
const BOT_TOKEN = '42:bot-token', botCalls = [];
const tgServer = http.createServer(async (req, res) => {
  const url = new URL(req.url, TG);
  if (url.pathname.startsWith(`/bot${BOT_TOKEN}/`)) {
    let body = ''; for await (const c of req) body += c;
    const method = url.pathname.split('/').pop();
    botCalls.push({ method, body: JSON.parse(body || '{}') });
    return res.end(JSON.stringify({ ok: true, result: method === 'getWebhookInfo' ? { url: '' } : true }));
  }
  if (url.pathname === '/.well-known/jwks.json') return res.end(JSON.stringify({ keys: [jwk] }));
  if (url.pathname === '/auth') {
    const code = crypto.randomUUID();
    codes.set(code, { challenge: url.searchParams.get('code_challenge'), user: nextTgUser, redirect: url.searchParams.get('redirect_uri') });
    res.writeHead(302, { Location: `${url.searchParams.get('redirect_uri')}?code=${code}&state=${url.searchParams.get('state')}` });
    return res.end();
  }
  if (url.pathname === '/token') {
    let body = ''; for await (const c of req) body += c;
    const f = new URLSearchParams(body), entry = codes.get(f.get('code'));
    const pkceOk = entry && crypto.createHash('sha256').update(f.get('code_verifier')).digest('base64url') === entry.challenge;
    const authOk = req.headers.authorization === 'Basic ' + Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64');
    if (!pkceOk || !authOk || f.get('redirect_uri') !== entry.redirect) { res.writeHead(400); return res.end('{"error":"invalid_grant"}'); }
    codes.delete(f.get('code'));
    const id_token = await new SignJWT(entry.user).setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuer(TG).setAudience(CLIENT_ID).setIssuedAt().setExpirationTime('5m').sign(privateKey);
    return res.end(JSON.stringify({ id_token, token_type: 'Bearer' }));
  }
  res.writeHead(404); res.end();
});
await new Promise((r) => tgServer.listen(5066, '127.0.0.1', r));

import fs from 'node:fs';
const OUTBOX = `/tmp/giftory-outbox-${process.pid}.jsonl`;
const pgServer = new PGLiteSocketServer({ db: await PGlite.create(), port: 5433, host: '127.0.0.1', maxConnections: 20 });
await pgServer.start();
const api = spawn('node', [process.env.VERCEL ? 'test/vercel-host.mjs' : 'src/index.js'], {
  env: { ...process.env, DATABASE_URL: 'postgresql://postgres@127.0.0.1:5433/postgres', JWT_SECRET: 'test', PORT: '5055', TELEGRAM_OAUTH_URL: TG, TELEGRAM_CLIENT_ID: CLIENT_ID, TELEGRAM_CLIENT_SECRET: SECRET, PUBLIC_URL: 'http://127.0.0.1:5055',
    TELEGRAM_API_URL: TG, TELEGRAM_BOT_TOKEN: BOT_TOKEN, TELEGRAM_BOT_USERNAME: 'giftory_test_bot', MAIL_OUTBOX: OUTBOX, CRON_SECRET: 'cron' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((r) => api.stdout.once('data', r));

const B = 'http://127.0.0.1:5055/api';
let pass = 0, failN = 0;
const ok = (c, m) => { c ? pass++ : failN++; console.log(c ? '  ok ' : '  FAIL', m); };
async function call(method, path, body, token) {
  const r = await fetch(B + path, { method, headers: { 'content-type': 'application/json', ...(token && { authorization: 'Bearer ' + token }) }, body: body && JSON.stringify(body) });
  const text = await r.text();
  return { status: r.status, data: text ? JSON.parse(text) : null, raw: text };
}
const reg = async (n) => (await call('POST', '/auth/register', { name: n, email: n + '@t.uz', password: 'password1', acceptTerms: true })).data.token;
const owner = await reg('madina'), a = await reg('jasur'), b = await reg('dilnoza');
ok((await call('POST', '/auth/register', { name: 'x', email: 'MADINA@t.uz', password: 'password1', acceptTerms: true })).status === 409, 'duplicate email rejected');
ok((await call('POST', '/auth/register', { name: 'y', email: 'y@t.uz', password: 'password1' })).status === 400, 'sign-up without accepting the terms is refused');
ok((await call('POST', '/auth/login', { email: 'madina@t.uz', password: 'nope' })).status === 401, 'wrong password rejected');
ok((await call('POST', '/auth/login', { email: 'Madina@t.uz', password: 'password1' })).status === 200, 'login works, email case-insensitive');

const list = (await call('POST', '/wishlists', { title: "Madina's 21st", occasion: 'Birthday', eventDate: '2026-12-12' }, owner)).data;
ok(list.slug && list.eventDate === '2026-12-12', 'list created with slug and date');
const cam = (await call('POST', `/wishlists/${list.id}/items`, { name: 'Film camera', price: '1450000', priority: 'high' }, owner)).data;
const tea = (await call('POST', `/wishlists/${list.id}/items`, { name: 'Tea set', price: 380000 }, owner)).data;
const esp = (await call('POST', `/wishlists/${list.id}/items`, { name: 'Espresso', price: 1000, isGroupGift: true }, owner)).data;
ok(cam.price === 1450000 && esp.isGroupGift, 'items added');
ok((await call('POST', `/wishlists/${list.id}/items`, { name: 'x', price: 1 }, a)).status === 403, 'friend cannot add items');

ok((await call('GET', `/wishlists/${list.slug}`)).data.items.length === 3, 'anonymous can view list');
ok((await call('POST', `/items/${cam.id}/reserve`)).status === 401, 'anonymous cannot reserve');
ok((await call('POST', `/items/${cam.id}/reserve`, null, owner)).status === 403, 'owner cannot reserve own gift');

const [r1, r2] = await Promise.all([call('POST', `/items/${tea.id}/reserve`, null, a), call('POST', `/items/${tea.id}/reserve`, null, b)]);
ok([r1.status, r2.status].sort().join() === '200,409', `two friends race for one gift: ${r1.status}/${r2.status}`);
const winner = r1.status === 200 ? a : b, loser = winner === a ? b : a;

const asWinner = (await call('GET', `/wishlists/${list.slug}`, null, winner)).data;
const asLoser = (await call('GET', `/wishlists/${list.slug}`, null, loser)).data;
const asOwner = (await call('GET', `/wishlists/${list.slug}`, null, owner));
const tW = asWinner.items.find((i) => i.id === tea.id), tL = asLoser.items.find((i) => i.id === tea.id), tO = asOwner.data.items.find((i) => i.id === tea.id);
ok(tW.reservedByMe && tW.isReserved, 'winner sees "reserved by you"');
ok(!tL.reservedByMe && tL.isReserved, 'other friend sees "already reserved"');
ok(asOwner.data.isOwner && tO.isReserved && !tO.reservedByMe, 'owner sees reserved, not by whom');
ok(!/reserved_by|reservedBy"|user_id|owner_id|password/.test(asOwner.raw + JSON.stringify(asWinner)), 'no reserver ids or secrets in responses');

ok((await call('DELETE', `/items/${tea.id}/reserve`, null, loser)).status === 404, "can't cancel someone else's reservation");
ok((await call('DELETE', `/items/${tea.id}/reserve`, null, winner)).status === 200, 'winner cancels');
ok((await call('POST', `/items/${tea.id}/reserve`, null, loser)).status === 200, 'freed gift can be reserved again');
ok((await call('POST', `/items/${esp.id}/reserve`, null, a)).status === 409, 'group gift cannot be single-reserved');

ok((await call('POST', `/items/${esp.id}/contribute`, { amount: 100 }, a)).data.myContribution === 100, 'A chips in 100');
ok((await call('POST', `/items/${esp.id}/contribute`, { amount: 950 }, b)).status === 409, 'B cannot go past the price');
const full = (await call('POST', `/items/${esp.id}/contribute`, { amount: 900 }, b)).data;
ok(full.funded === 1000 && full.contributors === 2 && full.myContribution === 900, `fully funded: ${full.funded}, ${full.contributors} people`);
ok((await call('POST', `/items/${esp.id}/contribute`, { amount: 0 }, a)).status === 400, 'zero amount rejected');
ok((await call('POST', `/items/${esp.id}/contribute`, { amount: 5 }, owner)).status === 403, 'owner cannot chip in');

const mine = (await call('GET', '/wishlists/mine', null, owner)).data;
ok(mine[0].total === 3 && mine[0].reserved === 1, `dashboard counts: ${mine[0].reserved} of ${mine[0].total}`);
const res = (await call('GET', '/items/reserved/mine', null, b)).data;
ok(res.some((i) => i.id === esp.id) && res.every((i) => i.wishlist.slug === list.slug), `"reserved by me" lists ${res.length} gifts`);

ok((await call('PATCH', `/items/${cam.id}`, { price: 1300000 }, owner)).data.price === 1300000, 'owner edits a wish');
ok((await call('PATCH', `/wishlists/${list.id}`, { note: 'Thanks!' }, owner)).status === 200, 'owner edits list');
const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4510000000049454e44ae426082', 'hex');
const up = await fetch(B + '/images', { method: 'POST', headers: { 'content-type': 'image/png', authorization: 'Bearer ' + owner }, body: png });
const { url } = await up.json();
ok(up.status === 201 && url.startsWith('/api/images/'), 'photo uploaded');
const got = await fetch('http://127.0.0.1:5055' + url);
ok(got.status === 200 && got.headers.get('content-type') === 'image/png' && Buffer.from(await got.arrayBuffer()).equals(png), 'photo served back byte-for-byte');
ok((await fetch(B + '/images', { method: 'POST', headers: { 'content-type': 'image/png' }, body: png })).status === 401, 'anonymous cannot upload');
ok((await fetch(B + '/images', { method: 'POST', headers: { 'content-type': 'text/plain', authorization: 'Bearer ' + owner }, body: 'hi' })).status === 400, 'non-image rejected');
const withPhoto = (await call('POST', `/wishlists/${list.id}/items`, { name: 'Lamp', price: 5, image: url }, owner)).data;
ok(withPhoto.image === url, 'wish saved with uploaded photo');
await call('DELETE', `/items/${withPhoto.id}`, null, owner);
ok((await fetch('http://127.0.0.1:5055' + url)).status === 404, 'photo removed with its wish');
ok((await call('GET', '/wishlists/nope')).status === 404 && (await call('POST', '/items/not-a-uuid/reserve', null, a)).status === 404, 'bad ids give 404');
ok((await call('DELETE', `/wishlists/${list.id}`, null, owner)).status === 204, 'list deleted');
ok((await call('GET', '/items/reserved/mine', null, b)).data.length === 0, 'delete cascades to items and contributions');
const S = 'http://127.0.0.1:5055';
async function telegramLogin({ next = '/w/abc', ticket, tamperState = false } = {}) {
  const start = await fetch(`${S}/api/auth/telegram/start?next=${encodeURIComponent(next)}${ticket ? '&ticket=' + ticket : ''}`, { redirect: 'manual' });
  const cookie = start.headers.get('set-cookie')?.split(';')[0];
  const atTg = await fetch(start.headers.get('location'), { redirect: 'manual' });
  let back = atTg.headers.get('location');
  if (tamperState) back = back.replace(/state=[^&]+/, 'state=forged');
  const cb = await fetch(back, { redirect: 'manual', headers: { cookie } });
  const loc = cb.headers.get('location');
  const hash = new URLSearchParams(loc.split('#')[1] || '');
  return { start, loc, token: hash.get('token'), next: hash.get('next') };
}
ok((await call('GET', '/auth/providers')).data.telegram === true, 'Telegram login is offered when configured');
const s1 = await telegramLogin();
ok(s1.start.headers.get('location').startsWith(TG + '/auth?') && /code_challenge_method=S256/.test(s1.start.headers.get('location')), 'start redirects to Telegram with PKCE');
ok(s1.token && s1.next === '/w/abc', 'callback returns a session and the page to go back to');
const me1 = (await call('GET', '/auth/me', null, s1.token)).data.user;
ok(me1.name === 'Madina Telegram' && me1.telegram && me1.avatarUrl.includes('userpic') && !me1.email, 'new account created from the Telegram profile');
const s2 = await telegramLogin();
ok((await call('GET', '/auth/me', null, s2.token)).data.user.id === me1.id, 'logging in again finds the same account');
ok((await telegramLogin({ tamperState: true })).loc === '/login?error=telegram', 'forged state is rejected');
ok((await telegramLogin({ next: 'https://evil.example' })).next === '/dashboard', 'outside redirect targets are ignored');
ok((await call('POST', '/auth/login', { email: '', password: '' })).status === 401, 'Telegram-only account has no password login');

const emailUser = await reg('sardor');
const { ticket } = (await call('POST', '/auth/telegram/link', null, emailUser)).data;
nextTgUser = { sub: '9002', name: 'Sardor TG' };
const linked = await telegramLogin({ ticket });
const meLinked = (await call('GET', '/auth/me', null, linked.token)).data.user;
ok(meLinked.email === 'sardor@t.uz' && meLinked.telegram, 'Connect Telegram links it to the existing email account');
const again = await telegramLogin();
ok((await call('GET', '/auth/me', null, again.token)).data.user.email === 'sardor@t.uz', 'that Telegram account now logs into the email account');
nextTgUser = { sub: '9001', name: 'Madina Telegram' };
const { ticket: t2 } = (await call('POST', '/auth/telegram/link', null, emailUser)).data;
ok((await telegramLogin({ ticket: t2 })).loc === '/dashboard?error=telegram_taken', "can't connect a Telegram account that another account already uses");
ok((await call('POST', '/auth/telegram/link')).status === 401, 'connecting requires being logged in');

ok((await call('PATCH', '/auth/me', { name: 'Madina Y.', email: 'madina.new@t.uz' }, owner)).data.user.email === 'madina.new@t.uz', 'profile: name and email updated');
ok((await call('PATCH', '/auth/me', { name: 'x', email: 'jasur@t.uz' }, owner)).status === 409, "profile: can't take another account's email");
ok((await call('PATCH', '/auth/me', { name: 'x', email: '' }, owner)).status === 400, "profile: email can't be removed while it's the login");
ok((await call('PUT', '/auth/password', { currentPassword: 'wrong', newPassword: 'newpassword1' }, owner)).status === 400, 'password: wrong current password refused');
ok((await call('PUT', '/auth/password', { currentPassword: 'password1', newPassword: 'newpassword1' }, owner)).status === 200, 'password: changed');
ok((await call('POST', '/auth/login', { email: 'madina.new@t.uz', password: 'newpassword1' })).status === 200, 'password: new one works');
ok((await call('PUT', '/auth/password', { newPassword: 'abcdefgh1' }, s1.token)).status === 400, 'Telegram-only account must add an email before a password');
await call('PATCH', '/auth/me', { name: 'Madina Telegram', email: 'tg.madina@t.uz' }, s1.token);
ok((await call('DELETE', '/auth/telegram', null, s1.token)).status === 400, "can't disconnect Telegram without a password");
ok((await call('PUT', '/auth/password', { newPassword: 'abcdefgh1' }, s1.token)).data.user.hasPassword, 'Telegram account sets a password');
ok((await call('DELETE', '/auth/telegram', null, s1.token)).data.user.telegram === false, 'then disconnects Telegram');

const gone = await reg('temp');
const gl = (await call('POST', '/wishlists', { title: 'Temp list' }, gone)).data;
const gi = (await call('POST', `/wishlists/${gl.id}/items`, { name: 'Thing', price: 10 }, gone)).data;
await call('POST', `/items/${gi.id}/reserve`, null, a);
ok((await call('DELETE', '/auth/me', null, gone)).status === 204, 'account deleted');
ok((await call('GET', '/auth/me', null, gone)).status === 404 && (await call('GET', `/wishlists/${gl.slug}`)).status === 404, 'its lists are gone too');
ok((await call('POST', '/auth/login', { email: 'temp@t.uz', password: 'password1' })).status === 401, "deleted account can't log in");

const guest = (await call('POST', '/auth/guest', { name: 'Aziza', acceptTerms: true })).data;
ok(guest.token && guest.user.guest && !guest.user.email, 'friend can join with just a name');
ok((await call('POST', '/auth/guest', { name: 'Aziza' })).status === 400, 'guest still has to accept the terms');

const providers = (await call('GET', '/auth/providers')).data;
ok(providers.reset && providers.bot === 'giftory_test_bot', 'password reset and the bot are offered when configured');
ok((await call('POST', '/auth/forgot', { email: 'nobody@t.uz' })).status === 200 && !fs.existsSync(OUTBOX), 'unknown email: same answer, no email sent');
ok((await call('POST', '/auth/forgot', { email: 'Jasur@t.uz', lang: 'ru' })).status === 200, 'reset requested');
const mail = JSON.parse(fs.readFileSync(OUTBOX, 'utf8').trim().split('\n').pop());
const resetToken = mail.body.match(/#token=([\w-]+)/)?.[1];
ok(mail.to === 'Jasur@t.uz' && /парол/i.test(mail.subject) && resetToken, 'reset email sent in the chosen language');
ok((await call('POST', '/auth/reset', { token: resetToken, password: 'short' })).status === 400, 'reset needs a long enough password');
ok((await call('POST', '/auth/reset', { token: resetToken, password: 'brandnew1' })).data.token, 'reset link sets a new password and logs in');
ok((await call('POST', '/auth/login', { email: 'jasur@t.uz', password: 'brandnew1' })).status === 200, 'new password works');
ok((await call('POST', '/auth/reset', { token: resetToken, password: 'another11' })).status === 400, 'a reset link works only once');

const initData = (user, extra = {}) => {
  const p = new URLSearchParams({ auth_date: String(Math.floor(Date.now() / 1000)), user: JSON.stringify(user), ...extra });
  const check = [...p.entries()].sort(([x], [y]) => x.localeCompare(y)).map(([k, v]) => `${k}=${v}`).join('\n');
  const key = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  p.set('hash', crypto.createHmac('sha256', key).update(check).digest('hex'));
  return p.toString();
};
const app1 = (await call('POST', '/auth/webapp', { initData: initData({ id: 777, first_name: 'Kamola', language_code: 'uz', allows_write_to_pm: true }, { start_param: 'abc123' }) })).data;
ok(app1.token && app1.user.telegram && app1.user.botOk && app1.startParam === 'abc123', 'Mini App logs in from Telegram data');
ok((await call('POST', '/auth/webapp', { initData: initData({ id: 777 }).replace(/hash=\w+/, 'hash=' + 'a'.repeat(64)) })).status === 401, 'forged Mini App data rejected');
nextTgUser = { sub: '9002', id: 888, name: 'Sardor TG' };
const real = await telegramLogin();
ok((await call('GET', '/auth/me', null, real.token)).data.user.email === 'sardor@t.uz', 'site login with the real Telegram id keeps the account linked earlier');
const app2 = (await call('POST', '/auth/webapp', { initData: initData({ id: 888, first_name: 'Sardor' }) })).data;
ok(app2.user.email === 'sardor@t.uz', 'Mini App opens the same account as the site');

const tashkent = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
const inDays = (n) => { const d = new Date(tashkent); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };
const jasurMe = (await call('PATCH', '/auth/me', { birthday: inDays(3).replace(/^\d{4}/, '2000') }, a)).data.user;
ok(jasurMe.birthday === inDays(3).replace(/^\d{4}/, '2000'), 'birthday saved on the profile');
const jList = (await call('POST', '/wishlists', { title: 'Jasur turns 26', occasion: 'Birthday', eventDate: inDays(3) }, a)).data;
const jItem = (await call('POST', `/wishlists/${jList.id}/items`, { name: 'Headphones', price: 900000 }, a)).data;
const jView = (await call('GET', `/wishlists/${jList.slug}`, null, app1.token)).data;
ok(jView.wishlist.owner.id === jasurMe.id && jView.wishlist.owner.following === false, 'list shows its owner to follow');
ok((await call('POST', `/follows/${jasurMe.id}`, null, app1.token)).data.following, 'Kamola follows Jasur');
ok((await call('POST', `/follows/${jasurMe.id}`, null, a)).status === 400, "can't follow yourself");
const upcoming = (await call('GET', '/follows', null, app1.token)).data;
ok(upcoming[0].daysUntil === 3 && upcoming[0].list.slug === jList.slug, 'upcoming birthdays: 3 days, with their list');

botCalls.length = 0;
await call('POST', `/items/${jItem.id}/reserve`, null, app1.token);
ok(!botCalls.some((c) => c.method === 'sendMessage'), "owner without the bot isn't messaged");
const kamolaList = (await call('POST', '/wishlists', { title: 'Kamola housewarming' }, app1.token)).data;
const kItem = (await call('POST', `/wishlists/${kamolaList.id}/items`, { name: 'Plant', price: 50000 }, app1.token)).data;
await call('POST', `/items/${kItem.id}/reserve`, null, b);
const sent = botCalls.find((c) => c.method === 'sendMessage');
ok(sent?.body.chat_id === '777' && /Kamola housewarming/.test(sent.body.text) && !/dilnoza/i.test(sent.body.text), 'owner on Telegram hears a gift was picked, not by whom');

botCalls.length = 0;
ok((await call('GET', '/bot/cron')).status === 401, 'cron needs its secret');
const cron = (await fetch(B + '/bot/cron', { headers: { authorization: 'Bearer cron' } }).then((r) => r.json()));
const remind = botCalls.filter((c) => c.method === 'sendMessage');
ok(cron.reminders >= 1 && remind.some((c) => c.body.chat_id === '777' && /Headphones/.test(c.body.text)), 'reminder 3 days before: what you picked');
ok(remind.some((c) => c.body.chat_id === '777' && /🎂/.test(c.body.text)), "reminder 3 days before a followed friend's birthday");
botCalls.length = 0;
await fetch(B + '/bot/cron', { headers: { authorization: 'Bearer cron' } });
ok(!botCalls.some((c) => c.method === 'sendMessage'), 'reminders are sent only once');

const wh = (body, secret) => fetch(B + '/bot/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(body) });
const hookSecret = crypto.createHash('sha256').update('webhook:test').digest('hex').slice(0, 48);
ok((await wh({}, 'wrong')).status === 401, 'webhook rejects calls without its secret');
botCalls.length = 0;
await wh({ message: { text: '/start', chat: { id: 9002, type: 'private' }, from: { id: 9002, language_code: 'ru' } } }, hookSecret);
ok(botCalls.some((c) => c.method === 'sendMessage' && c.body.chat_id === 9002 && /Giftory/.test(c.body.text)), '/start answers with an Open Giftory button');

const past = (await call('POST', '/wishlists', { title: 'Done party', eventDate: '2025-01-01' }, owner)).data;
const pi = (await call('POST', `/wishlists/${past.id}/items`, { name: 'Book', price: 100 }, owner)).data;
const pg = (await call('POST', `/wishlists/${past.id}/items`, { name: 'Bike', price: 1000, isGroupGift: true }, owner)).data;
await call('POST', `/items/${pi.id}/reserve`, null, a);
ok((await call('POST', `/items/${pi.id}/sign`, { signed: true }, b)).status === 403, "can't sign a gift you didn't give");
ok((await call('POST', `/items/${pi.id}/sign`, { signed: true }, a)).data.signed, 'giver lets the owner know it was them');
await call('POST', `/items/${pg.id}/contribute`, { amount: 300 }, a);
await call('POST', `/items/${pg.id}/contribute`, { amount: 200 }, b);
ok((await call('POST', `/items/${pg.id}/collector`, null, guest.token)).status === 403, 'only people who chipped in can collect');
const col = (await call('POST', `/items/${pg.id}/collector`, null, a)).data;
ok(col.collector.isMe && col.chippers.length === 2, 'collector sees who chipped in and how much');
ok((await call('POST', `/items/${pg.id}/collector`, null, b)).status === 409, 'only one collector per gift');
await call('POST', `/items/${pg.id}/paid`, { paid: true }, b);
const bView = (await call('GET', `/wishlists/${past.slug}`, null, b)).data.items.find((i) => i.id === pg.id);
const aView = (await call('GET', `/wishlists/${past.slug}`, null, a)).data.items.find((i) => i.id === pg.id);
ok(bView.myPaid && bView.collector.name && !bView.chippers, 'chipper marks paid, sees the collector, not the list');
ok(aView.chippers.find((c) => c.amount === 200).paid, 'collector sees who has paid');
await call('PATCH', `/items/${pi.id}`, { received: true }, owner);
const ownerPast = (await call('GET', `/wishlists/${past.slug}`, null, owner));
const book = ownerPast.data.items.find((i) => i.id === pi.id), bike = ownerPast.data.items.find((i) => i.id === pg.id);
ok(book.received && book.from.length === 1 && bike.from.length === 0, 'owner sees received, and only signed givers');
ok(!/chippers|collector|myPaid/.test(ownerPast.raw), 'owner never sees collecting details');
ok((await call('PATCH', `/wishlists/${past.id}`, { thanks: 'Thank you all!' }, owner)).data.thanks === 'Thank you all!', 'owner writes a thank-you note');
ok((await call('GET', '/items/reserved/mine', null, a)).data.find((i) => i.id === pi.id).wishlist.thanks === 'Thank you all!', 'givers see the thank-you note');

ok((await call('POST', '/preview', { url: 'http://127.0.0.1:5055/api/health' }, a)).status === 422, 'link preview refuses private addresses');
ok((await call('POST', '/preview', { url: 'file:///etc/passwd' }, a)).status === 422, 'link preview refuses non-web links');
ok((await call('POST', '/preview', { url: 'https://example.com' })).status === 401, 'link preview needs an account');
tgServer.close();
fs.rmSync(OUTBOX, { force: true });

console.log(`\n${pass} passed, ${failN} failed`);
api.kill();
await pgServer.stop();
process.exit(failN ? 1 : 0);
