import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { one } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { telegramEnabled } from './telegram.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim()) return res.status(400).json({ message: 'Enter your name and email' });
  if (!password || password.length < 8) return res.status(400).json({ message: 'Password needs at least 8 characters' });

  try {
    const user = await one(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
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

// Which sign-in options the app should show
router.get('/providers', (_req, res) => res.json({ telegram: telegramEnabled() }));

router.get('/me', requireAuth, async (req, res) => {
  const user = await one('SELECT id, name, email, avatar_url AS "avatarUrl", telegram_id IS NOT NULL AS telegram FROM users WHERE id = $1', [req.userId]);
  if (!user) return res.status(404).json({ message: 'Account not found' });
  res.json({ user });
});

export default router;
