import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'pgdata');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new PGlite(dataDir);

export async function initDb() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS saves (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}
