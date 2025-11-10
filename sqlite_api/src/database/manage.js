// database/manage.js
import { friend_list, friend_pending } from "./sqlRequest.js";

import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

/* -------------------- User -------------------- */

export async function createUser(db, { username, password, avatar } = {}) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required and must be a string');
  }
  if (typeof username !== 'string' || username.trim() === '') {
    throw new Error('Invalid username');
  }

  const hashedPassword = await bcrypt.hash(password, 10); // 10 = saltRounds

  const info = db.prepare(`INSERT INTO users (username, password_hash, avatar) VALUES (?, ?, ?)`).run(username.trim(), hashedPassword, avatar ?? null);

  return {
    success: true,
    userId: Number(info.lastInsertRowid),
    username: username.trim(),
    role: 'user',
  };
}

export function showUserByUsername(fastify, username) {
  if (typeof username !== 'string' || fastify.isDeletedUsername(username)) return null;
  const sql = `SELECT * FROM users WHERE username = ? AND username NOT LIKE 'deleted_%'`;
  const user = fastify.db.prepare(sql).get(username);
  return user || null;
}

export function showUserById(db, id) {
  const uid = Number(id);
  if (!Number.isFinite(uid)) return null;
  const sql = `SELECT * FROM users WHERE id = ? AND username NOT LIKE 'deleted_%'`;
  const user = db.prepare(sql).get(uid);
  return user || null;
}

export async function updateUserPass(db, id, password) {
  const uid = Number(id);
  if (!Number.isFinite(uid)) throw new Error('Invalid user id');
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password is required and must be a string');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const info = db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hashedPassword, uid);

  if (info.changes === 0) throw new Error('User not found');
  return { success: true, id: uid };
}

export async function updateUserAvatar(db, id, avatar) {
  const uid = Number(id);
  if (!Number.isFinite(uid)) throw new Error('Invalid user id');

  const info = db.prepare(`UPDATE users SET avatar = ? WHERE id = ?`).run(avatar, uid);

  if (info.changes === 0) throw new Error('User not found');
  return { success: true, id: uid };
}

export async function deleteUser(db, id) {
    const uid = Number(id);
    if (!Number.isFinite(uid)) return null;

    const u = db.prepare(`SELECT username FROM users WHERE id = ?`).get(uid);
    if (!u) return null;
    const oldUsername = u.username;

    const dummy = await bcrypt.hash(crypto.randomUUID(), 12);

  db.prepare(`UPDATE tournaments SET winner  = NULL WHERE winner  = ?`).run(oldUsername);
  db.prepare(`UPDATE tournaments SET creator = NULL WHERE creator = ?`).run(oldUsername);
  db.prepare(`UPDATE games SET winner  = NULL WHERE winner  = ?`).run(oldUsername);
  db.prepare(`UPDATE games SET player1 = NULL WHERE player1 = ?`).run(oldUsername);
  db.prepare(`UPDATE games SET player2 = NULL WHERE player2 = ?`).run(oldUsername);
  db.prepare(`DELETE FROM user_friends WHERE user_id = ? OR friend_id = ?`).run(uid, uid);
  db.prepare(`DELETE FROM tournaments WHERE creator = ? AND status != 2`).run(oldUsername);

    const info = db.prepare(`
        UPDATE users
        SET
            username         = 'deleted_' || id,
            password_hash    = ?,
            role             = 'user',
            twofa_secret     = NULL,
            is_twofa_enabled = 0,
            avatar           = NULL,
            last_timestamp   = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(dummy, uid);

    return info.changes > 0 ? { success: true, id: uid, anonymized: true } : null;
}

export function isAdmin(db, userId) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return false;

  const row = db.prepare('SELECT role FROM users WHERE id = ?').get(uid);
  return row?.role?.toLowerCase() === 'admin';
}

export function isAdminOrCreator(db, tournamentId, username) {
  const tid = Number(tournamentId);

  const user = String(username || '').trim();

  const result = db.prepare(`
    SELECT u.role, t.creator
    FROM users u
    JOIN tournaments t ON t.id = ?
    WHERE u.username = ?
  `).get(tid, user);

  if (!result) return false;
  return result.role.toLowerCase() === 'admin' || result.creator === user;
}

export function setJwtIAT(db, userId, time = Math.floor(Date.now() / 1000)) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return false;

  const info = db.prepare(` UPDATE users SET jwt_issued_at = ? WHERE id = ?`).run(time, uid);

  return true;
}

export function isTokenAccepted(db, userId, tokenIat) {
  const uid = Number(userId);
  const iat = Number(tokenIat);
  if (!Number.isFinite(uid) || !Number.isFinite(iat)) return false;

  const result = db.prepare(`SELECT jwt_issued_at FROM users WHERE id = ?`).get(uid);
  if (!result) return false;

  const jwtTime = Number(result.token_valid_after) || 0;
  return iat >= jwtTime;
}

export async function updateTimeStamp(db, id) {
  const uid = Number(id);
  if (!Number.isFinite(uid)) return false;

  const result = db.prepare(` UPDATE users SET last_timestamp = CURRENT_TIMESTAMP WHERE id = ?`);
  const info = result.run(uid);
  return info.changes > 0;
}

export function logout(db, userId, time = 5) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return false;

  const info = db.prepare(`UPDATE users SET last_timestamp = datetime('now', ?) WHERE id = ?`).run(`-${time} minutes`, uid);

  return true;
}


export function mapUserForSelfOrAdmin(user) {
  return {
    id: user.id,
    username: user.username,
    created_at: user.created_at,
    last_timestamp: user.last_timestamp,
    avatar: user.avatar ?? null,
    is_twofa_enabled: !!user.is_twofa_enabled,
    total_seconds: user.total_seconds,
    total_games: user.total_games,
  };
}

export function mapUserForPublic(db, user, requestUser) {

  let isFriend = false;
  if (db.prepare(`SELECT 1 FROM user_friends WHERE user_id = ? AND friend_id = ?`).get(requestUser, user.id))
      isFriend = true;

  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar ?? null,
    created_at: user.created_at,
    last_timestamp: user.last_timestamp,
    total_seconds: user.total_seconds,
    total_games: user.total_games,
    follow: isFriend,
  };
}

/* -------------------- Friends -------------------- */

export function addFriend(db, userId, friendId) {
  const u = Number(userId);
  const f = Number(friendId);

  if (!Number.isFinite(u) || !Number.isFinite(f)) {
    return { error: true, msg: 'unknowUser' };
  }

  const exists = db.prepare(`SELECT * FROM users WHERE id = ?`).get(f);
  if (!exists) return { error: true, msg: 'unknowUser' };

  const already = db.prepare(`SELECT 1 FROM user_friends WHERE user_id = ? AND friend_id = ?`).get(u, f);
  if (already) return { error: true, msg: 'alreadyFriend' };

  try {
    db.prepare(`INSERT INTO user_friends (user_id, friend_id) VALUES (?, ?)`).run(u, f);

    return { error: false };
  } catch (e) {
    return { error: true, msg: 'friendLimit' };
  }
}

export function removeFriend(db, userA, userB) {
  const info = db.prepare(`DELETE FROM user_friends WHERE user_id = ? AND friend_id = ?`).run(userA, userB);
  return info.changes > 0;
}

export function listFriends(db, userId, time = 5) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return [];

  return db.prepare(friend_list).all(`-${time} minutes`, uid, uid);
}

export function pendingFriends(db, userId, time = 5) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return [];

  return db.prepare(friend_pending).all(`-${time} minutes`, uid, uid);
}

/* -------------------- Tournaments -------------------- */

export function listTournamentMembers(db, tournamentId) {
  const tid = Number(tournamentId);
  if (!Number.isFinite(tid)) return [];
  const sql = `
    SELECT DISTINCT u.id, u.username
    FROM games g
    JOIN users u ON u.id IN (g.player1_id, g.player2_id)
    WHERE g.tournament_id = ?
    ORDER BY u.username COLLATE NOCASE`;

  return db.prepare(sql).all(tid);
}

/* -------------------- utils -------------------- */

export function isDev() {
  return process.env.NODE_ENV === 'development';
}

export async function crontab(fastify) {
  const users = fastify.db.prepare(`SELECT id FROM users WHERE last_timestamp < datetime('now', '-1 year')`).all();

  for (const { id } of users) {
    await fastify.deleteUser(fastify.db, id);
    fastify.log.info({ id }, 'User anonymized due to inactivity (RGPD)');
  }
}
