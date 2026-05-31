// Standalone seed runner:  npm run seed
import 'dotenv/config';
import { initDb } from './init.js';
import { getDb } from './connection.js';

(async () => {
  try {
    await initDb();
    const db = await getDb();
    await db.close?.();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();
