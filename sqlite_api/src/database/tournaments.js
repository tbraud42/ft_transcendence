// database/tournaments.js

export const T_STATUS = {
  WAITING: 0,
  PLAYING: 1,
  FINISHED: 2,
};

// plugins/tournaments.js

export function getAllTournaments(db) {
  return db.prepare(`
    SELECT t.*, u.username AS creator_username, uw.username AS winner_username
    FROM tournaments t
    JOIN users u ON u.id = t.creator_id
    LEFT JOIN users uw ON uw.id = t.winner
    ORDER BY t.created_at DESC
  `).all();
};

export function getTournamentById(db, id) {
  const tournament = db.prepare(`
    SELECT t.*, u.username AS creator_username, uw.username AS winner_username
    FROM tournaments t
    JOIN users u ON u.id = t.creator_id
    LEFT JOIN users uw ON uw.id = t.winner
    WHERE t.id = ?
  `).get(id);
  if (!tournament) return null;

  const participants = db.prepare(`
    SELECT DISTINCT u.id, u.username
    FROM games g
    JOIN users u ON u.id IN (g.player1_id, g.player2_id)
    WHERE g.tournament_id = ?
    ORDER BY u.username COLLATE NOCASE
  `).all(id);

  const games = db.prepare(`
    SELECT g.*,
           u1.username AS p1_username,
           u2.username AS p2_username,
           uw.username  AS winner_username
    FROM games g
    JOIN users u1 ON u1.id = g.player1_id
    JOIN users u2 ON u2.id = g.player2_id
    LEFT JOIN users uw ON uw.id = g.winner_id
    WHERE g.tournament_id = ?
    ORDER BY g.started_at ASC, g.id ASC
  `).all(id);

  return { ...tournament, participants, games };
};

export function getTournamentsByStatus(db, status){
    return db.prepare(`
      SELECT t.*, u.username AS creator_username, uw.username AS winner_username
      FROM tournaments t
      JOIN users u ON u.id = t.creator_id
      LEFT JOIN users uw ON uw.id = t.winner
      WHERE t.status = ?
      ORDER BY t.created_at DESC
    `).all(status);
  };

export function getTournamentByName(db, name){
    return db.prepare(`SELECT * FROM tournaments WHERE name = ? COLLATE NOCASE`).get(name);
  };

export function createTournament(db, { name, description, difficulty, creator_id }){
    const stmt = db.prepare(`INSERT INTO tournaments (name, description, creator_id, difficulty, status) VALUES (?, ?, ?, ?, 0)`);
    const info = stmt.run(name, description || null, creator_id, difficulty);
    return db.prepare(`SELECT * FROM tournaments WHERE id = ?`).get(info.lastInsertRowid);
  };

export function updateTournament(db, id, { name, description, difficulty }){
    const stmt = db.prepare(`UPDATE tournaments SET name = ?, description = ?, difficulty = ? WHERE id = ?`);
    return stmt.run(name, description || null, difficulty, id);
  };

export function changeTournamentStatus(db, id, nextStatus = null){
    const current = db.prepare(`SELECT status FROM tournaments WHERE id = ?`).get(id);
    if (!current) return null;
    const newStatus = nextStatus ?? (current.status === 0 ? 1 : current.status === 1 ? 2 : 2);
    const row = db.prepare(`UPDATE tournaments SET status = ? WHERE id = ? RETURNING id, status`).get(newStatus, id);
    return row || null;
  };

export function setTournamentWinner(db, id, winnerUserId){
    return db.prepare(`UPDATE tournaments SET winner = ?, status = 2 WHERE id = ? RETURNING id, status, winner`).get(winnerUserId, id);
  };

export function deleteTournament(db, id){
    return db.prepare(`DELETE FROM tournaments WHERE id = ?`).run(id);
  };

export function insertStatGame(db, tournamentId, gamesInput){
  const insGame = db.prepare(`
    INSERT INTO games (tournament_id, player1_id, player2_id, winner_id, started_at, duration_sec, p1_score, p2_score)
    VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?)`);

    const updUser = db.prepare(`
    UPDATE users
    SET total_games = total_games + 1,
        total_seconds = total_seconds + ?
    WHERE id = ?`);

  const tx = db.transaction((rows) => {
    for (const g of rows) {
      const p1 = Number(g.player1_id);
      const p2 = Number(g.player2_id);
      const s1 = Number(g.p1_score);
      const s2 = Number(g.p2_score);
      const dur = Number(g.duration_sec);
      if (![p1, p2, s1, s2, dur].every(Number.isFinite)) {
        throw new Error('INVALID_GAME_ROW');
      }
      const winner_id = s1 === s2 ? null : (s1 > s2 ? p1 : p2);

      insGame.run(
        tournamentId,
        p1,
        p2,
        winner_id,
        g.started_at ?? null,
        dur,
        s1,
        s2
      );
      updUser.run(dur, p1);
      updUser.run(dur, p2);
    }
  });

  tx(gamesInput);
  return true;
};

export function listUserMatches(db, userId) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return [];

  const result = db.prepare(`
    SELECT
      t.name        AS tournament_name,
      u1.username   AS player1_username,
      u2.username   AS player2_username,
      uw.username   AS winner_username,
      g.started_at  AS started_at
    FROM games g
    JOIN tournaments t ON t.id = g.tournament_id
    JOIN users u1      ON u1.id = g.player1_id
    JOIN users u2      ON u2.id = g.player2_id
    LEFT JOIN users uw ON uw.id = g.winner_id
    WHERE g.player1_id = ? OR g.player2_id = ?
    ORDER BY g.started_at DESC, g.id DESC
  `).all(uid, uid);

  return result;
}

export function userExists(id){
  return !!db.prepare(`SELECT 1 FROM users WHERE id = ?`).get(id);
};

export function tournamentExists(id){
  return !!db.prepare(`SELECT 1 FROM tournaments WHERE id = ?`).get(id);
};

// --------- Stats (schéma de sortie uniforme) ---------
// ordre: userId, username, wins, losses, games, winRate, time

export function getStat(db, id) {
  const uid = Number(id);
  if (!Number.isFinite(uid)) return null;

  const row = db
    .prepare(
      `
    SELECT
      u.id                        AS userId,
      u.username                  AS username,
      COALESCE(SUM(tp.wins),   0) AS wins,
      COALESCE(SUM(tp.losses), 0) AS losses,
      u.total_matches             AS games,
      CASE WHEN u.total_matches > 0
           THEN CAST(COALESCE(SUM(tp.wins),0) AS REAL) / u.total_matches
           ELSE 0 END             AS winRate,
      u.total_seconds             AS time
    FROM users u
    LEFT JOIN tournament_participants tp ON tp.user_id = u.id
    WHERE u.id = ?
    GROUP BY u.id, u.username, u.total_matches, u.total_seconds
  `
    )
    .get(uid);

  return row || null;
}

export function topWinRate(db, limit = 10, minGames = 1) {
  return db
    .prepare(
      `
    SELECT
      u.id                        AS userId,
      u.username                  AS username,
      COALESCE(SUM(tp.wins),   0) AS wins,
      COALESCE(SUM(tp.losses), 0) AS losses,
      u.total_matches             AS games,
      CASE WHEN u.total_matches > 0
           THEN CAST(COALESCE(SUM(tp.wins),0) AS REAL) / u.total_matches
           ELSE 0 END             AS winRate,
      u.total_seconds             AS time
    FROM users u
    LEFT JOIN tournament_participants tp ON tp.user_id = u.id
    WHERE u.total_matches >= ?
    GROUP BY u.id, u.username, u.total_matches, u.total_seconds
    ORDER BY winRate DESC, games DESC, wins DESC
    LIMIT ?
  `
    )
    .all(minGames, limit);
}

export function topLoseRate(db, limit = 10, minGames = 1) {
  return db
    .prepare(
      `
    SELECT
      u.id                        AS userId,
      u.username                  AS username,
      COALESCE(SUM(tp.wins),   0) AS wins,
      COALESCE(SUM(tp.losses), 0) AS losses,
      u.total_matches             AS games,
      CASE WHEN u.total_matches > 0
           THEN CAST(COALESCE(SUM(tp.wins),0) AS REAL) / u.total_matches
           ELSE 0 END             AS winRate,
      u.total_seconds             AS time
    FROM users u
    LEFT JOIN tournament_participants tp ON tp.user_id = u.id
    WHERE u.total_matches >= ?
    GROUP BY u.id, u.username, u.total_matches, u.total_seconds
    ORDER BY winRate ASC, games DESC
    LIMIT ?
  `
    )
    .all(minGames, limit);
}

export function topTotalPlayTime(db, limit = 10, minGames = 1) {
  return db
    .prepare(
      `
    SELECT
      u.id                        AS userId,
      u.username                  AS username,
      COALESCE(SUM(tp.wins),   0) AS wins,
      COALESCE(SUM(tp.losses), 0) AS losses,
      u.total_matches             AS games,
      CASE WHEN u.total_matches > 0
           THEN CAST(COALESCE(SUM(tp.wins),0) AS REAL) / u.total_matches
           ELSE 0 END             AS winRate,
      u.total_seconds             AS time
    FROM users u
    LEFT JOIN tournament_participants tp ON tp.user_id = u.id
    WHERE u.total_matches >= ?
    GROUP BY u.id, u.username, u.total_matches, u.total_seconds
    ORDER BY time DESC, games DESC
    LIMIT ?
  `
    )
    .all(minGames, limit);
}

export function topTournamentsCreated(db, limit = 10) {
  return db
    .prepare(
      `
    SELECT
      u.id                        AS userId,
      u.username                  AS username,
      COALESCE(SUM(tp.wins),   0) AS wins,
      COALESCE(SUM(tp.losses), 0) AS losses,
      u.total_matches             AS games,
      CASE WHEN u.total_matches > 0
           THEN CAST(COALESCE(SUM(tp.wins),0) AS REAL) / u.total_matches
           ELSE 0 END             AS winRate,
      u.total_seconds             AS time
    FROM users u
    LEFT JOIN tournament_participants tp ON tp.user_id = u.id
    WHERE EXISTS (SELECT 1 FROM tournaments t WHERE t.creator_id = u.id)
    GROUP BY u.id, u.username, u.total_matches, u.total_seconds
    ORDER BY (SELECT COUNT(*) FROM tournaments t WHERE t.creator_id = u.id) DESC
    LIMIT ?
  `
    )
    .all(limit);
}

export function topTournamentsWon(db, limit = 10) {
  return db
    .prepare(
      `
    SELECT
      u.id                        AS userId,
      u.username                  AS username,
      COALESCE(SUM(tp.wins),   0) AS wins,
      COALESCE(SUM(tp.losses), 0) AS losses,
      u.total_matches             AS games,
      CASE WHEN u.total_matches > 0
           THEN CAST(COALESCE(SUM(tp.wins),0) AS REAL) / u.total_matches
           ELSE 0 END             AS winRate,
      u.total_seconds             AS time
    FROM users u
    LEFT JOIN tournament_participants tp ON tp.user_id = u.id
    WHERE EXISTS (SELECT 1 FROM tournaments t WHERE t.winner = u.id)
    GROUP BY u.id, u.username, u.total_matches, u.total_seconds
    ORDER BY (SELECT COUNT(*) FROM tournaments t WHERE t.winner = u.id) DESC
    LIMIT ?
  `
    )
    .all(limit);
}
