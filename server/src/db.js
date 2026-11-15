import fs from 'node:fs';
import pg from 'pg';

pg.types.setTypeParser(20, Number);
pg.types.setTypeParser(1082, (d) => d);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const query = (text, params) => pool.query(text, params).then((r) => r.rows);
export const one = async (text, params) => (await query(text, params))[0];

export const migrate = () => pool.query(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

export function updates(body, columns, start = 1) {
  const keys = Object.keys(columns).filter((k) => body[k] !== undefined);
  return {
    sql: keys.map((k, i) => `${columns[k]} = $${start + i}`).join(', '),
    values: keys.map((k) => (body[k] === '' ? null : body[k])),
  };
}
