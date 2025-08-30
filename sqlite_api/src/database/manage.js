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

export async function updateUser(db, id, password) {
  const userId = Number(id);
  if (!Number.isFinite(userId)) {
    throw new Error('Invalid user id');
  }

  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password is required and must be a string');
  }

  const hashedPassword = await bcrypt.hash(password, 10); // 10 = saltRounds

  const info = db
    .prepare(`UPDATE users
              SET password_hash = ?, last_timestamp = CURRENT_TIMESTAMP
              WHERE id = ?`)
    .run(hashedPassword, userId);

  if (info.changes === 0) {
    throw new Error('User not found');
  }

  return { success: true, id: userId };
}

export async function deleteUser(db, id) {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

  return { success: true, id };
}

export function isAdmin(db, userId) { // pas bon encore
  const result = db.prepare('SELECT LOWER(role) AS role FROM users WHERE id = ?').get(userId);

  return result?.role === ROLE.ADMIN;
}

export async function isAdminOrCreator(fastify, tournamentId, userId) {
  const resultAdmin = await fastify.db.prepare(`SELECT role FROM users WHERE id = ?`).get([userId]);

  if (resultAdmin && resultAdmin.role === 'admin') {
    return true;
  }

  const resultUser = await fastify.db.prepare(`SELECT creator_id FROM tournaments WHERE id = ?`).get([tournamentId]);

  if (resultUser && resultUser.creator_id === userId) {
    return true;
  }

  return false;
}

export async function crontab(fastify) {
  fastify.db.exec('BEGIN');

  try {
    const inactiveUsers = fastify.db.prepare(`SELECT id, username, last_timestamp FROM users WHERE last_timestamp < datetime('now', '-1 year')`).all();

    const anonymizeStmt = fastify.db.prepare(`UPDATE users SET username = 'deleted_' || id, password_hash = hex(randomblob(32)), role = 'user' WHERE id = ?`);

    for (const user of inactiveUsers) {
      anonymizeStmt.run(user.id);
      fastify.log.info(`User ${user.username} (ID: ${user.id}) anonymized due to inactivity (RGPD)`);
    }

    fastify.db.exec('COMMIT');
  } catch (err) {
    fastify.db.exec('ROLLBACK');
    fastify.log.error({ err }, 'RGPD anonymization failed');
    throw err;
  }
}

export async function showAllData(db) {
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`).all();

  for (const { name } of tables) {
    console.log(`\nTable: ${name}`);

    const result = db.prepare(`SELECT * FROM ${name}`).all();

    if (result.length === 0) {
      console.log('empty db');
    } else {
      for (const row of result) {
        console.log(row);
      }
    }
  }
}
