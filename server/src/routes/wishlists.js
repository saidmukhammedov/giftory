import crypto from 'node:crypto';
import { Router } from 'express';
import { query, one, updates } from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { removeImages } from './images.js';

const router = Router();
export const fail = (status, message) => Object.assign(new Error(message), { status });

const LIST_COLUMNS = { title: 'title', occasion: 'occasion', eventDate: 'event_date', note: 'note' };
export const ITEM_COLUMNS = { name: 'name', link: 'link', price: 'price', image: 'image', note: 'note', priority: 'priority', isGroupGift: 'is_group_gift' };

const toList = (w) => ({ id: w.id, title: w.title, occasion: w.occasion, eventDate: w.event_date, note: w.note, slug: w.slug, createdAt: w.created_at });

// The secret: reserved_by and contributor ids never leave the server.
// Owners learn only that an item is taken; friends also learn whether it was them.
export async function serializeItems(items, userId) {
  const groupIds = items.filter((i) => i.is_group_gift).map((i) => i.id);
  const stats = groupIds.length
    ? await query(
        `SELECT item_id, count(DISTINCT user_id)::int AS contributors,
                coalesce(sum(amount) FILTER (WHERE user_id = $2::uuid), 0)::bigint AS mine
         FROM contributions WHERE item_id = ANY($1::uuid[]) GROUP BY item_id`,
        [groupIds, userId || null]
      )
    : [];
  const byItem = Object.fromEntries(stats.map((s) => [s.item_id, s]));

  return items.map((i) => ({
    id: i.id,
    name: i.name,
    link: i.link,
    price: i.price,
    image: i.image,
    note: i.note,
    priority: i.priority,
    isGroupGift: i.is_group_gift,
    isReserved: !!i.reserved_by,
    reservedByMe: !!userId && i.reserved_by === userId,
    funded: i.funded,
    contributors: byItem[i.id]?.contributors || 0,
    myContribution: byItem[i.id]?.mine || 0,
  }));
}

export async function ownedList(id, userId) {
  const list = await one('SELECT * FROM wishlists WHERE id = $1', [id]);
  if (!list) throw fail(404, 'Wishlist not found');
  if (list.owner_id !== userId) throw fail(403, 'Only the owner can do this');
  return list;
}

router.get('/mine', requireAuth, async (req, res) => {
  const rows = await query(
    `SELECT w.*, count(i.id)::int AS total, count(i.reserved_by)::int AS reserved
     FROM wishlists w LEFT JOIN items i ON i.wishlist_id = w.id
     WHERE w.owner_id = $1 GROUP BY w.id ORDER BY w.created_at DESC`,
    [req.userId]
  );
  res.json(rows.map((w) => ({ ...toList(w), total: w.total, reserved: w.reserved })));
});

router.post('/', requireAuth, async (req, res) => {
  const { title, occasion, eventDate, note } = req.body;
  if (!title?.trim()) throw fail(400, 'Give your wishlist a name');
  const list = await one(
    'INSERT INTO wishlists (owner_id, title, occasion, event_date, note, slug) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [req.userId, title.trim(), occasion || null, eventDate || null, note || null, crypto.randomBytes(6).toString('base64url')]
  );
  res.status(201).json(toList(list));
});

router.get('/:slug', optionalAuth, async (req, res) => {
  const list = await one('SELECT w.*, u.name AS owner_name FROM wishlists w JOIN users u ON u.id = w.owner_id WHERE w.slug = $1', [req.params.slug]);
  if (!list) throw fail(404, 'This wishlist does not exist or was deleted');
  const isOwner = list.owner_id === req.userId;
  const items = await query('SELECT * FROM items WHERE wishlist_id = $1 ORDER BY created_at', [list.id]);
  res.json({
    wishlist: { ...toList(list), owner: { name: list.owner_name } },
    isOwner,
    items: await serializeItems(items, isOwner ? null : req.userId),
  });
});

router.patch('/:id', requireAuth, async (req, res) => {
  await ownedList(req.params.id, req.userId);
  const { sql, values } = updates(req.body, LIST_COLUMNS, 2);
  if (!sql) throw fail(400, 'Nothing to update');
  res.json(toList(await one(`UPDATE wishlists SET ${sql} WHERE id = $1 RETURNING *`, [req.params.id, ...values])));
});

router.delete('/:id', requireAuth, async (req, res) => {
  await ownedList(req.params.id, req.userId);
  const items = await query('DELETE FROM items WHERE wishlist_id = $1 RETURNING image', [req.params.id]);
  await query('DELETE FROM wishlists WHERE id = $1', [req.params.id]); // contributions cascade with items
  await removeImages(items.map((i) => i.image));
  res.status(204).end();
});

router.post('/:id/items', requireAuth, async (req, res) => {
  await ownedList(req.params.id, req.userId);
  const { name, price, link, image, note, priority = 'medium', isGroupGift = false } = req.body;
  if (!name?.trim()) throw fail(400, 'Give the wish a name');
  if (!(Number(price) >= 0)) throw fail(400, 'Enter a price in so‘m');
  const item = await one(
    `INSERT INTO items (wishlist_id, name, price, link, image, note, priority, is_group_gift)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [req.params.id, name.trim(), Math.round(Number(price)), link || null, image || null, note || null, priority, !!isGroupGift]
  );
  res.status(201).json((await serializeItems([item], null))[0]);
});

export default router;
