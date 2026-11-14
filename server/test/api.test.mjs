// Full API test against an in-memory Postgres (PGlite). Run: npm test
import { spawn } from 'node:child_process';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const pgServer = new PGLiteSocketServer({ db: await PGlite.create(), port: 5433, host: '127.0.0.1', maxConnections: 20 });
await pgServer.start();
const api = spawn('node', ['src/index.js'], {
  env: { ...process.env, DATABASE_URL: 'postgresql://postgres@127.0.0.1:5433/postgres', JWT_SECRET: 'test', PORT: '5055' },
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
const reg = async (n) => (await call('POST', '/auth/register', { name: n, email: n + '@t.uz', password: 'password1' })).data.token;
const owner = await reg('madina'), a = await reg('jasur'), b = await reg('dilnoza');
ok((await call('POST', '/auth/register', { name: 'x', email: 'MADINA@t.uz', password: 'password1' })).status === 409, 'duplicate email rejected');
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
// Photos
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
console.log(`\n${pass} passed, ${failN} failed`);
api.kill();
await pgServer.stop();
process.exit(failN ? 1 : 0);
