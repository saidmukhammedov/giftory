import express from 'express';
import authRoutes from './routes/auth.js';
import wishlistRoutes from './routes/wishlists.js';
import itemRoutes from './routes/items.js';
import imageRoutes from './routes/images.js';
import telegramRoutes from './routes/telegram.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();

if (process.env.REDIRECT_TO) {
  app.use((req, res, next) => (req.method === 'GET' && !req.path.startsWith('/api') ? res.redirect(301, process.env.REDIRECT_TO + req.originalUrl) : next()));
}
app.use(express.json({ limit: '100kb' }));

app.use('/u', analyticsRoutes);
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth/telegram', telegramRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wishlists', wishlistRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/images', imageRoutes);

app.use((err, _req, res, _next) => {
  if (err.code === '22P02') return res.status(404).json({ message: 'Not found' });
  if (err.code === '23514' || err.code === '22007') return res.status(400).json({ message: 'Check the values you entered' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'That photo is too big. Try a smaller one.' });
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Something went wrong on our side' });
});

export default app;
