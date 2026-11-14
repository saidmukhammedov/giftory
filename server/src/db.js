import fs from 'node:fs';
import pg from 'pg';

pg.types.setTypeParser(20, Number); // bigint → number (soʻm amounts fit easily)
pg.types.setTypeParser(1082, (d) => d); // date → 'YYYY-MM-DD' string, no timezone shifts

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const query = (text, params) => pool.query(text, params).then((r) => r.rows);
export const one = async (text, params) => (await query(text, params))[0];

export const migrate = () => pool.query(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

// Builds "a = $1, b = $2" from the allowed fields present in body
export function updates(body, columns, start = 1) {
  const keys = Object.keys(columns).filter((k) => body[k] !== undefined);
  return {
    sql: keys.map((k, i) => `${columns[k]} = $${start + i}`).join(', '),
    values: keys.map((k) => (body[k] === '' ? null : body[k])),
  };
}
