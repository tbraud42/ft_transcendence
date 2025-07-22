// database/.js
import bcrypt from 'bcrypt';

export async function createUser(db, { username, password }) {
  if (!password || typeof password !== 'string') {
    throw new Error("Password is required and must be a string");
  }

  const hashedPassword = await bcrypt.hash(password, 10); // 10 = saltRounds

  const stmt = db.prepare(`INSERT INTO users (username, password_hash) VALUES (?, ?)`);
  const info = stmt.run(username, hashedPassword);

  return { success: true, userId: info.lastInsertRowid };
}

export function showUser(db, username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get(username);

  return user || null;
}

export function updateUser(db, id, { username, password_hash }) {
  const stmt = db.prepare('UPDATE users SET username = ?, password_hash = ? WHERE id = ?');
  const result = stmt.run(username, password_hash, id);

  return { success: true, id };
}

export async function deleteUser(db, id) {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const result = stmt.run(id);

  return { success: true, id };
}


// tmp pour le debug
export async function showAllData(db) {
  // Recup toute les tables
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`).all();

  for (const { name } of tables) {
    console.log(`\nTable: ${name}`);

    // Recup ligne
    const rows = db.prepare(`SELECT * FROM ${name}`).all();

    if (rows.length === 0) {
      console.log('empty db');
    } else {
      for (const row of rows) {
        console.log(row);
      }
    }
  }
}

export function clearDatabase(db) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();

  for (const table of tables) {
    const tableName = table.name;
    db.prepare(`DELETE FROM ${tableName}`).run();
    db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(tableName); // Reset AUTOINCREMENT
    console.log(`database clear : ${tableName}`);
  }
}
