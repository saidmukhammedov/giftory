import { Router } from 'express';

const router = Router();
const umami = () => process.env.UMAMI_URL;

router.get('/script.js', async (_req, res) => {
  if (!umami()) return res.status(404).end();
  try {
    const r = await fetch(`${umami()}/script.js`, { signal: AbortSignal.timeout(60000) });
    res.set({ 'Content-Type': 'application/javascript', 'Cache-Control': 'public, max-age=86400' }).send(await r.text());
  } catch {
    res.status(503).end();
  }
});

router.post('/api/send', async (req, res) => {
  if (!umami()) return res.status(404).end();
  try {
    const r = await fetch(`${umami()}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': req.get('user-agent') || '',
        'X-Forwarded-For': req.get('x-forwarded-for')?.split(',')[0].trim() || req.ip,
      },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(60000),
    });
    res.status(r.status).type('application/json').send(await r.text());
  } catch {
    res.status(202).end();
  }
});

export default router;
