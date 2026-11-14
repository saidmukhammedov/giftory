// Vercel entry: the same Express app, as one serverless function.
// The schema is applied once per fresh instance, before the first request is handled.
import app from '../server/src/app.js';
import { migrate } from '../server/src/db.js';

let ready;

export default async function handler(req, res) {
  ready ??= migrate().catch((e) => {
    ready = undefined; // try again on the next request
    throw e;
  });
  try {
    await ready;
  } catch (e) {
    console.error('Database setup failed:', e.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ message: 'Giftory is starting up. Try again in a moment.' }));
  }
  return app(req, res);
}
