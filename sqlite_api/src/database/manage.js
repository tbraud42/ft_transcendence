// database/manage.js
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

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

  const info = db.prepare(`UPDATE users SET password_hash = ?, last_timestamp = CURRENT_TIMESTAMP WHERE id = ?`).run(hashedPassword, userId);

  if (info.changes === 0) {
    throw new Error('User not found');
  }

  return { success: true, id: userId };
}

export async function deleteUser(db, id) {
  const dummy = await bcrypt.hash(crypto.randomUUID(), 12);

  const info = db.prepare(`
    UPDATE users
    SET
      username         = 'deleted_' || id,
      password_hash    = ?,
      role             = 'user',
      twofa_secret     = NULL,
      is_twofa_enabled = 0,
      last_timestamp   = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(dummy, id);

  return info.changes > 0 ? { success: true, id: id, anonymized: true } : null;
}


export function isAdmin(db, userId) {
  const row = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);

  return row?.role?.toLowerCase?.() === 'admin';
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
  const stale = fastify.db.prepare(`SELECT id FROM users WHERE last_timestamp < datetime('now', '-1 year')`).all();

  for (const { id } of stale) {
    await fastify.deleteUser(fastify.db, id);
    fastify.log.info({ id }, 'User anonymized due to inactivity (RGPD)');
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
