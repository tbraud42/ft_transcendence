// database/db.js
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import initDb from './initDb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = '/app/data'
const dbPath = path.join(dataDir, 'database.sqlite');

if (!fs.existsSync(dbPath)) {
  await initDb(dbPath);
} else {
  if (process.env.NODE_ENV === 'development') {
    console.log('Database already init');
  }
}

let db;

if (process.env.NODE_ENV === 'development') {
  db = new Database(dbPath, {
    verbose: console.log
  });
} else {
  db = new Database(dbPath);
}

export default db;
