import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { one, query, updates } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { telegramEnabled } from './telegram.js';
import { botEnabled, checkInitData } from '../bot.js';
import { mailEnabled, sendMail } from '../mail.js';
import { text } from '../texts.js';

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

router.post('/guest', async (req, res) => {
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ message: 'Enter your name' });
  if (req.body.acceptTerms !== true) return res.status(400).json({ message: 'Please accept the Terms and Privacy Policy to continue' });
  const user = await one('INSERT INTO users (name, terms_accepted_at) VALUES ($1, now()) RETURNING id', [name.slice(0, 80)]);
  res.status(201).json({ token: signToken(user.id), user: await me(user.id) });
});

router.post('/webapp', async (req, res) => {
  const data = checkInitData(req.body.initData);
  if (!data?.user?.id) return res.status(401).json({ message: 'Telegram login didn’t finish. Try again.' });
  const tg = data.user;
  const name = [tg.first_name, tg.last_name].filter(Boolean).join(' ') || tg.username || 'Telegram user';
  const lang = ['uz', 'ru', 'en'].includes(tg.language_code) ? tg.language_code : null;
  const user = await one(
    `INSERT INTO users (name, telegram_id, avatar_url, lang, bot_ok, terms_accepted_at) VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (telegram_id) DO UPDATE SET avatar_url = coalesce(EXCLUDED.avatar_url, users.avatar_url),
       bot_ok = users.bot_ok OR EXCLUDED.bot_ok, lang = coalesce(users.lang, EXCLUDED.lang) RETURNING id`,
    [name, String(tg.id), tg.photo_url || null, lang, !!tg.allows_write_to_pm]
  );
  res.json({ token: signToken(user.id), user: await me(user.id), startParam: data.startParam || null });
});

router.post('/forgot', async (req, res) => {
  if (!mailEnabled()) return res.status(503).json({ message: 'Password reset by email isn’t set up yet. Log in with Telegram instead.' });
  const user = await one('SELECT id, lang FROM users WHERE email = $1', [req.body.email?.trim().toLowerCase()]);
  if (user) {
    const raw = crypto.randomBytes(32).toString('base64url');
    await query("INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '1 hour')", [hash(raw), user.id]);
    const lang = ['uz', 'ru', 'en'].includes(req.body.lang) ? req.body.lang : user.lang || 'en';
    const link = `${process.env.PUBLIC_URL}/reset#token=${raw}`;
    try {
      await sendMail({ to: req.body.email.trim(), subject: text(lang, 'resetSubject'), body: text(lang, 'resetBody', { link }) });
    } catch (e) {
      console.error('Reset email failed:', e.message);
      return res.status(502).json({ message: 'We couldn’t send the email. Try again later.' });
    }
  }
  res.json({ ok: true });
});

router.post('/reset', async (req, res) => {
  const { token, password } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ message: 'Password needs at least 8 characters' });
  const row = await one('DELETE FROM password_resets WHERE token_hash = $1 RETURNING user_id, expires_at > now() AS valid', [hash(String(token || ''))]);
  if (!row?.valid) return res.status(400).json({ message: 'This reset link has expired. Ask for a new one.' });
  await query('UPDATE users SET password_hash = $2 WHERE id = $1', [row.user_id, await bcrypt.hash(password, 10)]);
  await query('DELETE FROM password_resets WHERE user_id = $1', [row.user_id]);
  res.json({ token: signToken(row.user_id), user: await me(row.user_id) });
});

router.get('/providers', (_req, res) =>
  res.json({ telegram: telegramEnabled(), reset: mailEnabled(), bot: botEnabled() ? process.env.TELEGRAM_BOT_USERNAME || null : null })
);

const hash = (raw) => crypto.createHash('sha256').update(raw).digest('hex');
const ME = `SELECT id, name, email, avatar_url AS "avatarUrl", telegram_id IS NOT NULL AS telegram, password_hash IS NOT NULL AS "hasPassword",
  birthday, lang, bot_ok AS "botOk", (email IS NULL AND telegram_id IS NULL) AS guest FROM users WHERE id = $1`;
const me = async (id) => {
  const user = await one(ME, [id]);
  if (!user) throw Object.assign(new Error('Account not found'), { status: 404 });
  return user;
};

router.get('/me', requireAuth, async (req, res) => res.json({ user: await me(req.userId) }));

router.patch('/me', requireAuth, async (req, res) => {
  const user = await me(req.userId);
  const b = req.body;
  const set = {};
  if ('name' in b) {
    if (!b.name?.trim()) return res.status(400).json({ message: 'Enter your name' });
    set.name = b.name.trim().slice(0, 80);
  }
  if ('email' in b) {
    set.email = b.email?.trim().toLowerCase() || null;
    if (!set.email && user.hasPassword) return res.status(400).json({ message: 'You log in with email, so it can’t be empty' });
  }
  if ('birthday' in b) set.birthday = b.birthday || null;
  if (['uz', 'ru', 'en'].includes(b.lang)) set.lang = b.lang;
  const { sql, values } = updates(set, { name: 'name', email: 'email', birthday: 'birthday', lang: 'lang' }, 2);
  if (sql) {
    try {
      await query(`UPDATE users SET ${sql} WHERE id = $1`, [req.userId, ...values]);
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ message: 'Another account already uses this email' });
      throw e;
    }
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
