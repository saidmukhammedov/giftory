import crypto from 'node:crypto';
import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { call, dailyReminders } from '../bot.js';
import { text } from '../texts.js';

const router = Router();
export const webhookSecret = () => crypto.createHash('sha256').update(`webhook:${process.env.JWT_SECRET}`).digest('hex').slice(0, 48);

router.post('/webhook', async (req, res) => {
  if (req.get('x-telegram-bot-api-secret-token') !== webhookSecret()) return res.status(401).end();
  const msg = req.body.message;
  if (msg?.text?.startsWith('/start') && msg.chat?.type === 'private') {
    const lang = ['uz', 'ru', 'en'].includes(msg.from?.language_code) ? msg.from.language_code : 'en';
    await query('UPDATE users SET bot_ok = true, lang = coalesce(lang, $2) WHERE telegram_id = $1', [String(msg.from.id), lang]);
    const slug = msg.text.split(' ')[1];
    const url = `${process.env.PUBLIC_URL}${slug && /^[\w-]{4,20}$/.test(slug) ? `/w/${slug}` : '/'}`;
    await call('sendMessage', { chat_id: msg.chat.id, text: text(lang, 'welcome'), reply_markup: { inline_keyboard: [[{ text: text(lang, 'open'), web_app: { url } }]] } });
  }
  res.json({ ok: true });
});

router.post('/allow', requireAuth, async (req, res) => {
  await query('UPDATE users SET bot_ok = true WHERE id = $1 AND telegram_id IS NOT NULL', [req.userId]);
  res.json({ ok: true });
});

router.get('/cron', async (req, res) => {
  if (!process.env.CRON_SECRET || req.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).end();
  res.json(await dailyReminders());
});

export default router;
