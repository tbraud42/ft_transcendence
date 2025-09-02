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
  return result;
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
  const result = db.prepare('SELECT * FROM participants WHERE tournament_id = ?').all(tournamentId);
  return result;
}

export async function addParticipant(db, tournamentId, userId) {
  const result = db.prepare('INSERT INTO participants (tournament_id, user_id) VALUES (?, ?)').run(tournamentId, userId);
  return result;
}

export async function updateParticipant(db, tournamentId, userId, data) {
  const result = db.prepare('UPDATE participants SET score = ? WHERE tournament_id = ? AND user_id = ?').run(data.score, tournamentId, userId);
  return result;
}

export async function deleteParticipant(db, tournamentId, userId) {
  const result = db.prepare('DELETE FROM participants WHERE tournament_id = ? AND user_id = ?').run(tournamentId, userId);
  return result;
}

