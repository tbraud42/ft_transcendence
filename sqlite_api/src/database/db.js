// src/database/db.js
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
  console.log('Database already init');
}

const db = new Database(dbPath, {
  verbose: console.log // print toute les action dans la console
});

export default db;
