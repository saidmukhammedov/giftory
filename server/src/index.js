import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { migrate } from './db.js';
import authRoutes from './routes/auth.js';
import wishlistRoutes from './routes/wishlists.js';
import itemRoutes from './routes/items.js';
import imageRoutes from './routes/images.js';
import telegramRoutes from './routes/telegram.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '100kb' }));

app.use('/u', analyticsRoutes);
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth/telegram', telegramRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wishlists', wishlistRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/images', imageRoutes);

// In production, serve the built React app from ../client/dist
const dist = path.resolve(import.meta.dirname, '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  if (err.code === '22P02') return res.status(404).json({ message: 'Not found' }); // malformed id
  if (err.code === '23514' || err.code === '22007') return res.status(400).json({ message: 'Check the values you entered' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'That photo is too big. Try a smaller one.' });
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Something went wrong on our side' });
});

const port = process.env.PORT || 5000;
migrate()
  .then(() => app.listen(port, () => console.log(`Giftory API on http://localhost:${port}`)))
  .catch((e) => {
    console.error('Database setup failed:', e.message);
    process.exit(1);
  });

export default app;
