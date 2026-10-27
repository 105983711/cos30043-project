import { build } from 'vite';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { openDatabase } from '../server/database.js';
import { clubs, seedEvents } from '../server/seed.js';
process.env.VITE_API_BASE = './api.php?path=';
await build({ build: { outDir: 'build/mercury' } });
await mkdir('deploy', { recursive: true });
const db = openDatabase(':memory:');
const schema = db
  .prepare(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name!='sessions'"
  )
  .all()
  .map((r) => r.sql.replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS') + ';')
  .join('\n');
db.close();
await writeFile(
  'deploy/schema.sqlite.sql',
  schema +
    '\nCREATE TABLE IF NOT EXISTS login_attempts (id INTEGER PRIMARY KEY,ip TEXT NOT NULL,window_id INTEGER NOT NULL);\n'
);
await writeFile('deploy/seed.json', JSON.stringify({ clubs, events: seedEvents() }, null, 2));
await copyFile('deploy/api.php', 'build/mercury/api.php');
await writeFile(
  'build/mercury/.htaccess',
  `Options -Indexes\n<IfModule mod_headers.c>\nHeader set X-Content-Type-Options "nosniff"\nHeader set Referrer-Policy "same-origin"\nHeader set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"\n</IfModule>\n`
);
console.log('Mercury upload files: build/mercury. Private database setup: deploy/.');
