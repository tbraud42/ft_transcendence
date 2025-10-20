// database/manage.js

import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

export function isDev() {
  return process.env.NODE_ENV === 'development';
}

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

export function showUserByUsername(db, username) {
  if (typeof username !== 'string') return null;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  return user || null;
}

export function showUserById(db, id) {
  const uid = Number(id);
  if (!Number.isFinite(uid)) return null;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
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

  const dummy = await bcrypt.hash(crypto.randomUUID(), 12);

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

export function isAdminOrCreator(db, tournamentId, userId) {
  const tid = Number(tournamentId);
  const uid = Number(userId);
  if (!Number.isFinite(tid) || !Number.isFinite(uid)) return false;

  const result = db.prepare(`
    SELECT u.role, t.creator_id
    FROM users u
    JOIN tournaments t ON t.id = ?
    WHERE u.id = ?`).get(tid, uid);

  if (!result) return false;
  return result.role.toLowerCase() === 'admin' || result.creator_id === uid;
}

export async function crontab(fastify) {
  const users = fastify.db.prepare(`SELECT id FROM users WHERE last_timestamp < datetime('now', '-1 year')`).all();

  for (const { id } of users) {
    await fastify.deleteUser(fastify.db, id);
    fastify.log.info({ id }, 'User anonymized due to inactivity (RGPD)');
  }
}

export function showAllData(db) {
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`).all();

  for (const { name } of tables) {
    console.log(`\nTable: ${name}`);
    const result = db.prepare(`SELECT * FROM ${name}`).all();
    if (result.length === 0) console.log('empty db');
    else for (const row of result) console.log(row);
  }
}

export async function updateTimeStamp(db, id) {
  const uid = Number(id);
  if (!Number.isFinite(uid)) return false;

  const result = db.prepare(` UPDATE users SET last_timestamp = CURRENT_TIMESTAMP WHERE id = ?`);
  const info = result.run(uid);
  return info.changes > 0;
}

function normalizePair(a, b) {
  const x = Number(a), y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('INVALID_USER_ID');
  if (x === y) throw new Error('CANNOT_FRIEND_SELF');
  return x < y ? [x, y] : [y, x];
}

/* -------------------- Friends -------------------- */

export function addFriend(db, userA, userB) {
  const [u, f] = normalizePair(userA, userB);

  const exists = db.prepare(`SELECT id FROM users WHERE id IN (?, ?)`).all(u, f);
  if (exists.length !== 2) throw new Error('UNKNOWN_USER');

  const alreadyFriend = db.prepare(`SELECT 1 FROM user_friends WHERE user_id = ? AND friend_id = ?`).get(u, f);
  if (alreadyFriend) throw new Error('ALREADY_FRIEND');

  try {
    db.prepare(`INSERT INTO user_friends (user_id, friend_id) VALUES (?, ?)`).run(u, f);
    return { user_id: u, friend_id: f };
  } catch (e) {
    if (String(e.message).includes('FRIEND_LIMIT')) throw new Error('FRIEND_LIMIT');
    throw e;
  }
}

export function removeFriend(db, userA, userB) {
  const [u, f] = normalizePair(userA, userB);
  const info = db.prepare(`DELETE FROM user_friends WHERE user_id = ? AND friend_id = ?`).run(u, f);
  return info.changes > 0;
}

export function listFriends(db, userId, minutes = 10) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return [];

  const sql = `
    SELECT
      u.id,
      u.username,
      uf.created_at AS since,
      u.last_timestamp,
      CASE
        WHEN u.last_timestamp IS NULL THEN 0
        WHEN u.last_timestamp >= datetime('now', ?) THEN 1
        ELSE 0
      END AS online,
      CAST(strftime('%s','now') - strftime('%s', COALESCE(u.last_timestamp, '1970-01-01')) AS INTEGER) AS last_seen_seconds
    FROM user_friends uf
    JOIN users u ON u.id = CASE WHEN uf.user_id = ? THEN uf.friend_id ELSE uf.user_id END
    WHERE uf.user_id = ? OR uf.friend_id = ?
    ORDER BY u.username COLLATE NOCASE`;

  return db.prepare(sql).all(`-${minutes} minutes`, uid, uid, uid);
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
    ORDER BY u.username COLLATE NOCASE
  `;
  return db.prepare(sql).all(tid);
}

export function listTournamentMembersWithStats(db, tournamentId) {
  const tid = Number(tournamentId);
  if (!Number.isFinite(tid)) return [];

  const sql = `
    WITH participants AS (
      SELECT g.tournament_id, g.id AS game_id,
             g.player1_id AS user_id,
             CASE WHEN g.winner_id = g.player1_id THEN 1 ELSE 0 END AS win,
             CASE WHEN g.winner_id IS NOT NULL AND g.winner_id != g.player1_id THEN 1 ELSE 0 END AS loss,
             g.duration_sec AS seconds
      FROM games g WHERE g.tournament_id = ?
      UNION ALL
      SELECT g.tournament_id, g.id,
             g.player2_id,
             CASE WHEN g.winner_id = g.player2_id THEN 1 ELSE 0 END,
             CASE WHEN g.winner_id IS NOT NULL AND g.winner_id != g.player2_id THEN 1 ELSE 0 END,
             g.duration_sec
      FROM games g WHERE g.tournament_id = ?
    )
    SELECT u.id, u.username,
           SUM(win)   AS wins,
           SUM(loss)  AS losses,
           COUNT(*)   AS matches,
           COALESCE(SUM(seconds), 0) AS seconds_total
    FROM participants p
    JOIN users u ON u.id = p.user_id
    GROUP BY u.id, u.username
    ORDER BY wins DESC, losses ASC, u.username COLLATE NOCASE`;

  return db.prepare(sql).all(tid, tid);
}

export function getTournamentStandings(db, tournamentId) {
  return listTournamentMembersWithStats(db, tournamentId);
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

export function mapUserForPublic(user) {
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar ?? null,
  };
}
