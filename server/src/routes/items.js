import { Router } from 'express';
import { query, one, updates } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { ITEM_COLUMNS, fail, ownedList, serializeItems } from './wishlists.js';
import { removeImages } from './images.js';

const router = Router();
const single = async (item, userId) => (await serializeItems([item], userId))[0];

const findItem = async (id) => {
  const item = await one('SELECT i.*, w.owner_id FROM items i JOIN wishlists w ON w.id = i.wishlist_id WHERE i.id = $1', [id]);
  if (!item) throw fail(404, 'This wish no longer exists');
  return item;
};
const notOwner = (item, userId) => {
  if (item.owner_id === userId) throw fail(403, "You can't pick gifts from your own list");
};

// Gifts the current user reserved or chipped in on, across all lists
router.get('/reserved/mine', requireAuth, async (req, res) => {
  const rows = await query(
    `SELECT i.*, w.title AS wl_title, w.slug AS wl_slug, w.event_date AS wl_date
     FROM items i JOIN wishlists w ON w.id = i.wishlist_id
     WHERE i.reserved_by = $1 OR i.id IN (SELECT item_id FROM contributions WHERE user_id = $1)
     ORDER BY i.updated_at DESC`,
    [req.userId]
  );
  const items = await serializeItems(rows, req.userId);
  res.json(items.map((it, n) => ({ ...it, wishlist: { title: rows[n].wl_title, slug: rows[n].wl_slug, eventDate: rows[n].wl_date } })));
});

router.patch('/:id', requireAuth, async (req, res) => {
  const item = await findItem(req.params.id);
  await ownedList(item.wishlist_id, req.userId);
  const { sql, values } = updates(req.body, ITEM_COLUMNS, 2);
  if (!sql) throw fail(400, 'Nothing to update');
  const updated = await one(`UPDATE items SET ${sql}, updated_at = now() WHERE id = $1 RETURNING *`, [req.params.id, ...values]);
  if (updated.image !== item.image) await removeImages([item.image]);
  res.json(await single(updated, null));
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
  // Atomic: only succeeds if nobody holds it, so two friends can't grab the same gift
  const item = await one(
    `UPDATE items SET reserved_by = $2, reserved_at = now(), updated_at = now()
     WHERE id = $1 AND reserved_by IS NULL AND NOT is_group_gift RETURNING *`,
    [req.params.id, req.userId]
  );
  if (!item) throw fail(409, 'Someone already reserved this gift');
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
  // One statement: raise the total only if it stays within the price, and record who gave what
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
  res.json(await single(item, req.userId));
});

export default router;
