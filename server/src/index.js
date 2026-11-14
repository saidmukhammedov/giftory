import app from './app.js';
import { migrate } from './db.js';

const port = process.env.PORT || 5000;
migrate()
  .then(() => app.listen(port, () => console.log(`Giftory API on http://localhost:${port}`)))
  .catch((e) => {
    console.error('Database setup failed:', e.message);
    process.exit(1);
  });
