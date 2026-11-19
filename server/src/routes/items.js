import { Router } from 'express';
import { query, one, updates } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { ITEM_COLUMNS, fail, ownedList, serializeItems } from './wishlists.js';
import { removeImages } from './images.js';
import { notifyFunded, notifyReserved } from '../bot.js';

const router = Router();
const single = async (item, userId, ownerView = false) => (await serializeItems([item], userId, ownerView))[0];

const findItem = async (id) => {
  const item = await one('SELECT i.*, w.owner_id FROM items i JOIN wishlists w ON w.id = i.wishlist_id WHERE i.id = $1', [id]);
  if (!item) throw fail(404, 'This wish no longer exists');
  return item;
};
const notOwner = (item, userId) => {
  if (item.owner_id === userId) throw fail(403, "You can't pick gifts from your own list");
};

router.get('/reserved/mine', requireAuth, async (req, res) => {
  const rows = await query(
    `SELECT i.*, w.title AS wl_title, w.slug AS wl_slug, w.event_date AS wl_date, w.thanks AS wl_thanks, o.name AS wl_owner
     FROM items i JOIN wishlists w ON w.id = i.wishlist_id JOIN users o ON o.id = w.owner_id
     WHERE i.reserved_by = $1 OR i.id IN (SELECT item_id FROM contributions WHERE user_id = $1)
     ORDER BY i.updated_at DESC`,
    [req.userId]
  );
  const items = await serializeItems(rows, req.userId);
  res.json(items.map((it, n) => ({
    ...it,
    wishlist: { title: rows[n].wl_title, slug: rows[n].wl_slug, eventDate: rows[n].wl_date, thanks: rows[n].wl_thanks, owner: rows[n].wl_owner },
  })));
});

router.patch('/:id', requireAuth, async (req, res) => {
  const item = await findItem(req.params.id);
  await ownedList(item.wishlist_id, req.userId);
  const { sql, values } = updates(req.body, ITEM_COLUMNS, 2);
  if (!sql) throw fail(400, 'Nothing to update');
  const updated = await one(`UPDATE items SET ${sql}, updated_at = now() WHERE id = $1 RETURNING *`, [req.params.id, ...values]);
  if (updated.image !== item.image) await removeImages([item.image]);
  res.json(await single(updated, null, true));
});

router.delete('/:id', requireAuth, async (req, res) => {
  const item = await findItem(req.params.id);
  await ownedList(item.wishlist_id, req.userId);
  await query('DELETE FROM items WHERE id = $1', [req.params.id]);
  await removeImages([item.image]);
  res.status(204).end();
});

router.post('/:id/reserve', requireAuth, async (req, res) => {
  notOwner(await findItem(req.params.id), req.userId);
  const item = await one(
    `UPDATE items SET reserved_by = $2, reserved_at = now(), updated_at = now()
     WHERE id = $1 AND reserved_by IS NULL AND NOT is_group_gift RETURNING *`,
    [req.params.id, req.userId]
  );
  if (!item) throw fail(409, 'Someone already reserved this gift');
  await notifyReserved(item);
  res.json(await single(item, req.userId));
});

router.delete('/:id/reserve', requireAuth, async (req, res) => {
  const item = await one(
    'UPDATE items SET reserved_by = NULL, reserved_at = NULL, updated_at = now() WHERE id = $1 AND reserved_by = $2 RETURNING *',
    [req.params.id, req.userId]
  );
  if (!item) throw fail(404, "You haven't reserved this gift");
  res.json(await single(item, req.userId));
});

router.post('/:id/contribute', requireAuth, async (req, res) => {
  const amount = Math.round(Number(req.body.amount));
  if (!(amount > 0)) throw fail(400, 'Enter an amount above zero');
  notOwner(await findItem(req.params.id), req.userId);
  const item = await one(
    `WITH up AS (
       UPDATE items SET funded = funded + $2, updated_at = now()
       WHERE id = $1 AND is_group_gift AND funded + $2 <= price RETURNING *
     ), ins AS (
       INSERT INTO contributions (item_id, user_id, amount) SELECT id, $3, $2 FROM up
     )
     SELECT * FROM up`,
    [req.params.id, amount, req.userId]
  );
  if (!item) throw fail(409, 'That amount is more than what is left to raise');
  await notifyFunded(item);
  res.json(await single(item, req.userId));
});

const isChipper = (itemId, userId) => one('SELECT 1 FROM contributions WHERE item_id = $1 AND user_id = $2 LIMIT 1', [itemId, userId]);

router.post('/:id/sign', requireAuth, async (req, res) => {
  const signed = req.body.signed !== false;
  const item = await findItem(req.params.id);
  if (item.reserved_by === req.userId) {
    await query('UPDATE items SET signed = $2 WHERE id = $1', [item.id, signed]);
  } else if (await isChipper(item.id, req.userId)) {
    await query('UPDATE contributions SET signed = $3 WHERE item_id = $1 AND user_id = $2', [item.id, req.userId, signed]);
  } else {
    throw fail(403, "You haven't given this gift");
  }
  res.json(await single(await findItem(item.id), req.userId));
});

router.post('/:id/collector', requireAuth, async (req, res) => {
  const item = await findItem(req.params.id);
  if (!(await isChipper(item.id, req.userId))) throw fail(403, 'Chip in first, then you can collect for this gift');
  const updated = await one('UPDATE items SET collector_id = $2 WHERE id = $1 AND collector_id IS NULL RETURNING *', [item.id, req.userId]);
  if (!updated) throw fail(409, 'Someone is already collecting for this gift');
  res.json(await single(updated, req.userId));
});

router.delete('/:id/collector', requireAuth, async (req, res) => {
  const updated = await one('UPDATE items SET collector_id = NULL WHERE id = $1 AND collector_id = $2 RETURNING *', [req.params.id, req.userId]);
  if (!updated) throw fail(404, "You aren't collecting for this gift");
  res.json(await single(updated, req.userId));
});

router.post('/:id/paid', requireAuth, async (req, res) => {
  const rows = await query('UPDATE contributions SET paid = $3 WHERE item_id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.userId, req.body.paid !== false]);
  if (!rows.length) throw fail(403, "You haven't chipped in on this gift");
  res.json(await single(await findItem(req.params.id), req.userId));
});

export default router;
