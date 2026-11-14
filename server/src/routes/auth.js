import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim()) return res.status(400).json({ message: 'Enter your name and email' });
  if (!password || password.length < 8) return res.status(400).json({ message: 'Password needs at least 8 characters' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ message: 'This email already has an account. Log in instead.' });

  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: signToken(user._id), user: user.toPublic() });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ message: 'Wrong email or password' });
  }
  res.json({ token: signToken(user._id), user: user.toPublic() });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'Account not found' });
  res.json({ user: user.toPublic() });
});

export default router;
