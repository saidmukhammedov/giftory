import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import wishlistRoutes from './routes/wishlists.js';
import itemRoutes from './routes/items.js';
import imageRoutes from './routes/images.js';
import telegramRoutes from './routes/telegram.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();

// An old address can forward visitors to the new one (REDIRECT_TO=https://giftory-app.vercel.app)
if (process.env.REDIRECT_TO) {
  app.use((req, res, next) => (req.method === 'GET' && !req.path.startsWith('/api') ? res.redirect(301, process.env.REDIRECT_TO + req.originalUrl) : next()));
}
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '100kb' }));

app.use('/u', analyticsRoutes);
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth/telegram', telegramRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wishlists', wishlistRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/images', imageRoutes);

// Serve the built React app from ../client/dist (on Vercel the CDN serves it instead).
// Hashed files in /assets never change, so phones may keep them for a year; a missing one is a real 404,
// never index.html (which would fail as a script and leave a blank page).
// index.html is always re-checked, so a phone never holds on to a page that points at old files.
const dist = path.resolve(import.meta.dirname, '../../client/dist');
if (fs.existsSync(dist)) {
  app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }));
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get(/^(?!\/api).*/, (_req, res) => res.set('Cache-Control', 'no-cache').sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  if (err.code === '22P02') return res.status(404).json({ message: 'Not found' }); // malformed id
  if (err.code === '23514' || err.code === '22007') return res.status(400).json({ message: 'Check the values you entered' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'That photo is too big. Try a smaller one.' });
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Something went wrong on our side' });
});

export default app;
