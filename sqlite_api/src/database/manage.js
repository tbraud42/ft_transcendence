// src/database/.js
export async function createUser(db, { username, password_hash }) {
  try {
    const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
    const info = stmt.run(username, password_hash);

    return { success: true, id: info.lastInsertRowid, user: { id: info.lastInsertRowid, username, password_hash } };
  } catch (err) {

    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, error: 'user_exists' };
    }
    throw err;
  }
}

export async function showUser(db, username) {
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

