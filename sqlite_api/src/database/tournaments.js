// database/tournaments.js
import { user_stat, dashboard_stat, recent_matches } from "./sqlRequest.js";

export function getAllTournaments(db) {
  return db.prepare(`
    SELECT
      t.id,
      t.socket_id,
      t.name,
      t.description,
      t.maxPlayer,
      t.difficulty,
      t.status,
      t.created_at,
      t.creator     AS creator_username,
      t.winner      AS winner_username
    FROM tournaments t
    ORDER BY t.created_at DESC
  `).all();
};

export function getTournamentById(db, id) {
  const tid = Number(id);
  if (!Number.isFinite(tid)) return null;

  const tournament = db.prepare(`
    SELECT
      t.id,
      t.socket_id,
      t.name,
      t.description,
      t.maxPlayer,
      t.difficulty,
      t.status,
      t.created_at,
      t.creator AS creator_username,
      t.winner  AS winner_username
    FROM tournaments t
    WHERE t.id = ?
  `).get(tid);

  if (!tournament) return null;

  const participants = db.prepare(`
    WITH all_players(username) AS (
      SELECT g.player1 FROM games g WHERE g.tournament_id = ?
      UNION
      SELECT g.player2 FROM games g WHERE g.tournament_id = ?
    )
    SELECT ap.username,
           u.id AS id
    FROM all_players ap
    LEFT JOIN users u ON u.username = ap.username
    WHERE ap.username IS NOT NULL
    ORDER BY ap.username COLLATE NOCASE
    `).all(tid, tid);

  const games = db.prepare(`
    SELECT
      g.id,
      g.game_num,
      g.tournament_id,
      g.player1 AS p1,
      g.player2 AS p2,
      g.winner  AS winner,
      g.started_at,
      g.duration_sec,
      g.p1_score,
      g.p2_score
    FROM games g
    WHERE g.tournament_id = ?
    ORDER BY g.started_at ASC, g.id ASC
    `).all(tid);

  return { ...tournament, participants, games };
};

export function getTournamentsByStatus(db, status) {
  const st = Number(status);

  return db.prepare(`
    SELECT
      t.id,
      t.socket_id,
      t.name,
      t.description,
      t.maxPlayer,
      t.difficulty,
      t.status,
      t.created_at,
      t.creator AS creator_username,
      t.winner  AS winner_username
    FROM tournaments t
    WHERE t.status = ?
    ORDER BY t.created_at DESC
    `).all(st);
};

export function createTournament(db, { socket_id, name, description, difficulty, maxPlayer, creator}){
    const info = db.prepare(`INSERT INTO tournaments (socket_id, name, description, creator, difficulty, maxPlayer, status) VALUES (?, ?, ?, ?, ?, ?, 0)`).run(socket_id, name, description || null, creator, difficulty, maxPlayer);
    return db.prepare(`SELECT * FROM tournaments WHERE id = ?`).get(info.lastInsertRowid);
};

export function changeTournamentStatus(db, id, nextStatus = null){
    const current = db.prepare(`SELECT status FROM tournaments WHERE id = ?`).get(id);
    if (!current) return null;
    const newStatus = nextStatus ?? (current.status === 0 ? 1 : current.status === 1 ? 2 : 2);
    if (newStatus !== 0 && newStatus !== 1 && newStatus !== 2) return null;
    const row = db.prepare(`UPDATE tournaments SET status = ? WHERE id = ? RETURNING id, status`).get(newStatus, id);
    return row || null;
};

export function setTournamentWinner(db, id, winnerUser){
    return db.prepare(`UPDATE tournaments SET winner = ?, status = 2 WHERE id = ? RETURNING id, status, winner`).get(winnerUser, id);
};

export function deleteTournament(db, id){
    return db.prepare(`DELETE FROM tournaments WHERE id = ?`).run(id);
};

export function insertStatGame(fastify, tournamentId, gamesInput) {
  const tid = Number(tournamentId);
  if (!Number.isFinite(tid)) throw new Error('INVALID_TOURNAMENT');

  const getMaxNum = fastify.db.prepare(`SELECT COALESCE(MAX(game_num), 0) AS maxn FROM games WHERE tournament_id = ?`);

  const insGame = fastify.db.prepare(`INSERT INTO games (game_num, tournament_id, player1, player2, winner, started_at, duration_sec, p1_score, p2_score)
    VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?)`);

  const updUserByName = fastify.db.prepare(`UPDATE users SET total_games = total_games + 1, total_seconds = total_seconds + ? WHERE username = ?`);

  const tx = fastify.db.transaction((rows) => {
    let inserted = 0;
    for (const g of rows) {
      const game_num = Number(g.game_num);
      const winner =  typeof g.winner === 'string' ? g.winner.trim() : '';
      const p1 = typeof g.player1 === 'string' ? g.player1.trim() : '';
      const p2 = typeof g.player2 === 'string' ? g.player2.trim() : '';
      const s1 = Number(g.p1_score);
      const s2 = Number(g.p2_score);
      const dur = Number(g.duration_sec);
      const started = g.started_at;

      insGame.run(game_num, tid, p1, p2, winner, started, dur, s1, s2);

      if (fastify.showUserByUsername(fastify, p1))
        updUserByName.run(dur, p1);
      if (fastify.showUserByUsername(fastify, p2))
        updUserByName.run(dur, p2);

      inserted++;
    }

    return { inserted };
  });

  return tx(gamesInput);
};

/* -------------------- Stats -------------------- */

export function getStat(db, id) {
  const uid = Number(id);
  if (!Number.isFinite(uid)) return null;

  const row = db.prepare(user_stat).get(uid);
  return row || null;
}

const ORDER_MAP = {
  wins: 'wins',
  losses: 'losses',
  tWon: 'tWon',
  winRate: 'winRate',
  time: 'time',
  create: '"create"',
};

const cacheRequest = new WeakMap();

function getDbCache(db) {
  let map = cacheRequest.get(db);
  if (!map) {
    map = new Map();
    cacheRequest.set(db, map);
  }
  return map;
}

export function topBy(db, { orderKey, limit = 10 }) {
  const col = ORDER_MAP[orderKey];
  if (!col) throw new Error('Invalid order key');

  let sql = dashboard_stat;
  sql += `\nORDER BY ${col} DESC, u.username COLLATE NOCASE\nLIMIT @limit;`;

  const cache = getDbCache(db);
  let request = cache.get(sql);
  if (!request) {
    request = db.prepare(sql);
    cache.set(sql, request);
  }

  const l = Math.max(1, Math.min(100, Number(limit)));

  return request.all({ limit: l, minGames: 0 });
}

export function listUserRecentMatches(db, userId, limit = 20) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return [];

  const user = db.prepare(`SELECT username FROM users WHERE id = ?`).get(uid);
  if (!user) return [];

  const uname = user.username;
  const lim = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 20;

  return db.prepare(recent_matches).all(uname, uname, uname, uname, uname, uname, lim);
}

export function validateGameRow(row) {
  const errors = [];

  const game_num = Number(row?.game_num);
  const p1 = typeof row?.p1 === 'string' ? row.p1.trim() : '';
  const p2 = typeof row?.p2 === 'string' ? row.p2.trim() : '';
  const s1 = Number(row?.p1_score);
  const s2 = Number(row?.p2_score);
  const dur = Number(row?.duration_sec);
  const startedAt = typeof row?.started_at === 'string' && row.started_at.trim() !== '' ? row.started_at.trim() : null;

  if (!game_num) errors.push('game_num is required');
  if (!p1) errors.push('p1 is required');
  if (!p2) errors.push('p2 is required');
  if (p1 && p2 && p1 === p2) errors.push('player1 and player2 must differ');
  if (!Number.isFinite(s1) || s1 < 0) errors.push('p1_score invalid');
  if (!Number.isFinite(s2) || s2 < 0) errors.push('p2_score invalid');
  if (!Number.isFinite(dur) || dur < 0) errors.push('duration_sec invalid');

  const winnerUsername = typeof row?.winner === 'string' ? row.winner.trim() : null;
  if (!winnerUsername || (winnerUsername !== p1 && winnerUsername !== p2)) {
    errors.push('winner must be either p1 or p2');
  }

  return {
    ok: errors.length === 0,
    errors,
    normalized: { game_num, p1, p2, s1, s2, dur, startedAt, winner: winnerUsername }
  };
}
