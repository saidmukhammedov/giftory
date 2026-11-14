import express, { Router } from 'express';
import { one, query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const TYPES = ['image/webp', 'image/jpeg', 'image/png'];
const PREFIX = '/api/images/';
const fail = (status, message) => Object.assign(new Error(message), { status });

router.post('/', requireAuth, express.raw({ type: TYPES, limit: '3mb' }), async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw fail(400, 'Choose a JPG, PNG or WebP photo');
  const { id } = await one('INSERT INTO images (owner_id, mime, data) VALUES ($1, $2, $3) RETURNING id', [req.userId, req.headers['content-type'], req.body]);
  res.status(201).json({ url: PREFIX + id });
});

router.get('/:id', async (req, res) => {
  const img = await one('SELECT mime, data FROM images WHERE id = $1', [req.params.id]);
  if (!img) throw fail(404, 'Photo not found');
  res.set({ 'Content-Type': img.mime, 'Cache-Control': 'public, max-age=31536000, immutable' }).send(img.data);
});

// Removes uploaded photos that no item uses any more (called after deletes)
export const removeImages = (urls) => {
  const ids = urls.filter((u) => u?.startsWith(PREFIX)).map((u) => u.slice(PREFIX.length));
  return ids.length ? query('DELETE FROM images WHERE id = ANY($1::uuid[]) AND NOT EXISTS (SELECT 1 FROM items WHERE image = $2 || images.id::text)', [ids, PREFIX]) : null;
};

export default router;
