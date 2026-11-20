import fs from 'node:fs';
import pg from 'pg';

pg.types.setTypeParser(20, Number);
pg.types.setTypeParser(1082, (d) => d);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const query = (text, params) => pool.query(text, params).then((r) => r.rows);
export const one = async (text, params) => (await query(text, params))[0];

export async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(7101)');
    await client.query(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export function updates(body, columns, start = 1) {
  const keys = Object.keys(columns).filter((k) => body[k] !== undefined);
  return {
    sql: keys.map((k, i) => `${columns[k]} = $${start + i}`).join(', '),
    values: keys.map((k) => (body[k] === '' ? null : body[k])),
  };
}
