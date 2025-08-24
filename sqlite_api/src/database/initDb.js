// database/initDb.js
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

export default async function initDb(dbPath) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const schemaPath = path.resolve(__dirname, './schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error('schema.sql not found', schemaPath);
    process.exit(1);
  }

  const schema = await fsp.readFile(schemaPath, 'utf-8');

  const db = new Database(dbPath);
  try {
    db.exec(schema);
    console.log('Database init successfully');
  } catch (err) {
    console.error('something wrong init: ', err.message);
    process.exit(1);
  }

  db.close();
}
