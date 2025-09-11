// database/tournaments.js

export const T_STATUS = {
  WAITING: 0,
  PLAYING: 1,
  FINISHED: 2
};

export async function getAllTournaments(db) {
  const result = db.prepare('SELECT * FROM tournaments').all();
  return result;
}

export async function getTournamentById(db, id) {
  const result = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
  return result;
}

export async function getTournamentByName(db, name) {
  const result = db.prepare('SELECT * FROM tournaments WHERE name = ?').get(name);
  return result;
}

export async function createTournament(db, data) {
  const { name, description, creator_id, difficulty, maxPlayers } = data;
  const result = db.prepare('INSERT INTO tournaments (name, description, creator_id, difficulty, maxPlayers) VALUES (?, ?, ?, ?, ?)').run(name, description, creator_id, difficulty, maxPlayers);
  return {id: Number(result.lastInsertRowid)};
}

export function changeTournamentStatus(db, tournamentId) {
  const row = db.prepare(`UPDATE tournaments SET status = CASE WHEN status < ? THEN status + 1 ELSE status END WHERE id = ? RETURNING id, status`).get(T_STATUS.FINISHED, tournamentId);

  return row ?? null;
}

export async function getTournamentsByStatus(db, status) {
  return db.prepare(`SELECT * FROM tournaments WHERE status = ? ORDER BY created_at DESC, id DESC`).all(status);
}

export async function updateTournament(db, id, data) {
  const fields = [];
  const values = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }

  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }

  if (fields.length === 0) return { changes: 0 };

  values.push(id);

  const result = db.prepare(`UPDATE tournaments SET ${fields.join(', ')} WHERE id = ?`).run(values);
  return result;
}

export function deleteTournament(db, id) {
  return db.prepare('DELETE FROM tournaments WHERE id = ?').run(id);
}

export async function getParticipantsByTournamentId(db, tournamentId) {
  const result = db.prepare('SELECT * FROM tournament_participants WHERE tournament_id = ?').all(tournamentId);
  return result;
}

export async function addParticipant(db, tournamentId, userId) {
  const result = db.prepare('INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?, ?)').run(tournamentId, userId);
  return result;
}

export async function updateParticipant(db, tournamentId, userId, data) {
  const result = db.prepare('UPDATE tournament_participants SET score = ? WHERE tournament_id = ? AND user_id = ?').run(data.score, tournamentId, userId);
  return result;
}

export async function deleteParticipant(db, tournamentId, userId) {
  const result = db.prepare('DELETE FROM tournament_participants WHERE tournament_id = ? AND user_id = ?').run(tournamentId, userId);
  return result;
}

// ------------- stat ---------------
// 1) Stat d’un seul user (ou null si introuvable)
export function getStat(db, id) {
  const uid = Number(id);
  if (!Number.isFinite(uid)) return null;

  const row = db.prepare(`
    SELECT
      u.id                         AS userId,
      u.username                   AS username,
      COALESCE(SUM(tp.wins),   0)  AS wins,
      COALESCE(SUM(tp.losses), 0)  AS losses,
      u.total_matches              AS games,
      CASE WHEN u.total_matches > 0
           THEN CAST(COALESCE(SUM(tp.wins),0) AS REAL) / u.total_matches
           ELSE 0 END               AS winRate,
      u.total_seconds              AS time
    FROM users u
    LEFT JOIN tournament_participants tp ON tp.user_id = u.id
    WHERE u.id = ?
    GROUP BY u.id, u.username, u.total_matches, u.total_seconds
  `).get(uid);

  return row || null;
}

// 2) Top win rate
export function topWinRate(db, limit = 10, minGames = 1) {
  return db.prepare(`
    SELECT
      u.id                         AS userId,
      u.username                   AS username,
      COALESCE(SUM(tp.wins),   0)  AS wins,
      COALESCE(SUM(tp.losses), 0)  AS losses,
      u.total_matches              AS games,
      CASE WHEN u.total_matches > 0
           THEN CAST(COALESCE(SUM(tp.wins),0) AS REAL) / u.total_matches
           ELSE 0 END               AS winRate,
      u.total_seconds              AS time
    FROM users u
    LEFT JOIN tournament_participants tp ON tp.user_id = u.id
    WHERE u.total_matches >= ?
    GROUP BY u.id, u.username, u.total_matches, u.total_seconds
    ORDER BY winRate DESC, games DESC, wins DESC
    LIMIT ?
  `).all(minGames, limit);
}

// 3) Top lose rate (on retourne winRate pour garder le même schéma)
export function topLoseRate(db, limit = 10, minGames = 1) {
  return db.prepare(`
    SELECT
      u.id                         AS userId,
      u.username                   AS username,
      COALESCE(SUM(tp.wins),   0)  AS wins,
      COALESCE(SUM(tp.losses), 0)  AS losses,
      u.total_matches              AS games,
      CASE WHEN u.total_matches > 0
           THEN CAST(COALESCE(SUM(tp.wins),0) AS REAL) / u.total_matches
           ELSE 0 END               AS winRate,
      u.total_seconds              AS time
    FROM users u
    LEFT JOIN tournament_participants tp ON tp.user_id = u.id
    WHERE u.total_matches >= ?
    GROUP BY u.id, u.username, u.total_matches, u.total_seconds
    ORDER BY winRate ASC, games DESC
    LIMIT ?
  `).all(minGames, limit);
}

// 4) Top temps total joué (time desc)
export function topTotalPlayTime(db, limit = 10, minGames = 1) {
  return db.prepare(`
    SELECT
      u.id                         AS userId,
      u.username                   AS username,
      COALESCE(SUM(tp.wins),   0)  AS wins,
      COALESCE(SUM(tp.losses), 0)  AS losses,
      u.total_matches              AS games,
      CASE WHEN u.total_matches > 0
           THEN CAST(COALESCE(SUM(tp.wins),0) AS REAL) / u.total_matches
           ELSE 0 END               AS winRate,
      u.total_seconds              AS time
    FROM users u
    LEFT JOIN tournament_participants tp ON tp.user_id = u.id
    WHERE u.total_matches >= ?
    GROUP BY u.id, u.username, u.total_matches, u.total_seconds
    ORDER BY time DESC, games DESC
    LIMIT ?
  `).all(minGames, limit);
}

// 5) Top créateurs (ordre par nb créés, même schéma de sortie)
export function topTournamentsCreated(db, limit = 10) {
  return db.prepare(`
    SELECT
      u.id                         AS userId,
      u.username                   AS username,
      COALESCE(SUM(tp.wins),   0)  AS wins,
      COALESCE(SUM(tp.losses), 0)  AS losses,
      u.total_matches              AS games,
      CASE WHEN u.total_matches > 0
           THEN CAST(COALESCE(SUM(tp.wins),0) AS REAL) / u.total_matches
           ELSE 0 END               AS winRate,
      u.total_seconds              AS time
    FROM users u
    LEFT JOIN tournament_participants tp ON tp.user_id = u.id
    WHERE EXISTS (SELECT 1 FROM tournaments t WHERE t.creator_id = u.id)
    GROUP BY u.id, u.username, u.total_matches, u.total_seconds
    ORDER BY (SELECT COUNT(*) FROM tournaments t WHERE t.creator_id = u.id) DESC
    LIMIT ?
  `).all(limit);
}

// 6) Top vainqueurs (ordre par nb gagnés, même schéma de sortie)
export function topTournamentsWon(db, limit = 10) {
  return db.prepare(`
    SELECT
      u.id                         AS userId,
      u.username                   AS username,
      COALESCE(SUM(tp.wins),   0)  AS wins,
      COALESCE(SUM(tp.losses), 0)  AS losses,
      u.total_matches              AS games,
      CASE WHEN u.total_matches > 0
           THEN CAST(COALESCE(SUM(tp.wins),0) AS REAL) / u.total_matches
           ELSE 0 END               AS winRate,
      u.total_seconds              AS time
    FROM users u
    LEFT JOIN tournament_participants tp ON tp.user_id = u.id
    WHERE EXISTS (SELECT 1 FROM tournaments t WHERE t.winner = u.id)
    GROUP BY u.id, u.username, u.total_matches, u.total_seconds
    ORDER BY (SELECT COUNT(*) FROM tournaments t WHERE t.winner = u.id) DESC
    LIMIT ?
  `).all(limit);
}
