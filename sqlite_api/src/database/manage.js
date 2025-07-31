// database/.js
import bcrypt from 'bcrypt';

export async function createUser(db, { username, password }) {
  if (!password || typeof password !== 'string') {
    throw new Error("Password is required and must be a string");
  }

  const hashedPassword = await bcrypt.hash(password, 10); // 10 = saltRounds

  const info = db.prepare(`INSERT INTO users (username, password_hash) VALUES (?, ?)`).run(username, hashedPassword);

  return {
    success: true,
    userId: info.lastInsertRowid,
    username,
    role: 'user'
  };
}

export function showUserByUsername(db, username) {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  return user || null;
}

export function showUserById(db, id) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

  return user || null;
}

export async function updateUser(db, id, { username, password }) {
  if (!password || typeof password !== 'string') {
    throw new Error("Password is required and must be a string");
  }

  const hashedPassword = await bcrypt.hash(password, 10); // 10 = saltRounds

  const result = db.prepare('UPDATE users SET username = ?, password_hash = ? WHERE id = ?').run(username, hashedPassword, id);

  return {
    success: true,
    userId: result.lastInsertRowid,
    username,
    role: 'user'
  };
}

export async function deleteUser(db, id) {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

  return { success: true, id };
}


// tmp pour le debug
export async function showAllData(db) {
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`).all();

  for (const { name } of tables) {
    console.log(`\nTable: ${name}`);

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
