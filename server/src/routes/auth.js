import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { one } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { telegramEnabled } from './telegram.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password, acceptTerms } = req.body;
  if (!name?.trim() || !email?.trim()) return res.status(400).json({ message: 'Enter your name and email' });
  if (acceptTerms !== true) return res.status(400).json({ message: 'Please accept the Terms and Privacy Policy to continue' });
  if (!password || password.length < 8) return res.status(400).json({ message: 'Password needs at least 8 characters' });

  try {
    const user = await one(
      'INSERT INTO users (name, email, password_hash, terms_accepted_at) VALUES ($1, $2, $3, now()) RETURNING id, name, email',
      [name.trim(), email.trim().toLowerCase(), await bcrypt.hash(password, 10)]
    );
    res.status(201).json({ token: signToken(user.id), user });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: 'This email already has an account. Log in instead.' });
    throw e;
  }
});

router.post('/login', async (req, res) => {
  const user = await one('SELECT id, name, email, password_hash FROM users WHERE email = $1', [req.body.email?.trim().toLowerCase()]);
  if (!user?.password_hash || !(await bcrypt.compare(req.body.password || '', user.password_hash))) {
    return res.status(401).json({ message: 'Wrong email or password' });
  }
  const { password_hash, ...publicUser } = user;
  res.json({ token: signToken(user.id), user: publicUser });
});

router.get('/providers', (_req, res) => res.json({ telegram: telegramEnabled() }));

const ME = `SELECT id, name, email, avatar_url AS "avatarUrl", telegram_id IS NOT NULL AS telegram, password_hash IS NOT NULL AS "hasPassword" FROM users WHERE id = $1`;
const me = async (id) => {
  const user = await one(ME, [id]);
  if (!user) throw Object.assign(new Error('Account not found'), { status: 404 });
  return user;
};

router.get('/me', requireAuth, async (req, res) => res.json({ user: await me(req.userId) }));

router.patch('/me', requireAuth, async (req, res) => {
  const user = await me(req.userId);
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase() || null;
  if (!name) return res.status(400).json({ message: 'Enter your name' });
  if (!email && user.hasPassword) return res.status(400).json({ message: 'You log in with email, so it can’t be empty' });
  try {
    await one('UPDATE users SET name = $2, email = $3 WHERE id = $1 RETURNING id', [req.userId, name, email]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: 'Another account already uses this email' });
    throw e;
  }
  res.json({ user: await me(req.userId) });
});

router.put('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const row = await one('SELECT email, password_hash FROM users WHERE id = $1', [req.userId]);
  if (!row.email) return res.status(400).json({ message: 'Add an email first, so you can log in with it' });
  if (row.password_hash && !(await bcrypt.compare(currentPassword || '', row.password_hash))) return res.status(400).json({ message: 'Your current password is wrong' });
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: 'Password needs at least 8 characters' });
  await one('UPDATE users SET password_hash = $2 WHERE id = $1 RETURNING id', [req.userId, await bcrypt.hash(newPassword, 10)]);
  res.json({ user: await me(req.userId) });
});

router.delete('/telegram', requireAuth, async (req, res) => {
  const user = await me(req.userId);
  if (!user.email || !user.hasPassword) return res.status(400).json({ message: 'Set an email and password first, or you would lose access to your account' });
  await one('UPDATE users SET telegram_id = NULL WHERE id = $1 RETURNING id', [req.userId]);
  res.json({ user: await me(req.userId) });
});

router.delete('/me', requireAuth, async (req, res) => {
  await one('DELETE FROM users WHERE id = $1 RETURNING id', [req.userId]);
  res.status(204).end();
});

export default router;
