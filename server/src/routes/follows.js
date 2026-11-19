import { Router } from 'express';
import { query, one } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { fail } from './wishlists.js';

const router = Router();

const daysUntil = (mmdd) => {
  if (!mmdd) return null;
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [m, d] = mmdd.split('-').map(Number);
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
  return Math.round((next - today) / 86400000);
};

router.get('/', requireAuth, async (req, res) => {
  const rows = await query(
    `SELECT u.id, u.name, u.avatar_url, to_char(u.birthday, 'MM-DD') AS birthday, l.slug, l.title
     FROM follows f JOIN users u ON u.id = f.followee_id
     LEFT JOIN LATERAL (
       SELECT slug, title FROM wishlists WHERE owner_id = u.id
       ORDER BY (event_date >= current_date) DESC, event_date NULLS LAST, created_at DESC LIMIT 1
     ) l ON true
     WHERE f.follower_id = $1`,
    [req.userId]
  );
  const people = rows.map((r) => ({
    id: r.id, name: r.name, avatarUrl: r.avatar_url, birthday: r.birthday, daysUntil: daysUntil(r.birthday),
    list: r.slug ? { slug: r.slug, title: r.title } : null,
  }));
  people.sort((a, b) => (a.daysUntil ?? 999) - (b.daysUntil ?? 999) || a.name.localeCompare(b.name));
  res.json(people);
});

router.post('/:id', requireAuth, async (req, res) => {
  if (req.params.id === req.userId) throw fail(400, "You can't follow yourself");
  if (!(await one('SELECT id FROM users WHERE id = $1', [req.params.id]))) throw fail(404, 'Account not found');
  await query('INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.userId, req.params.id]);
  res.json({ following: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  await query('DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2', [req.userId, req.params.id]);
  res.json({ following: false });
});

export default router;
