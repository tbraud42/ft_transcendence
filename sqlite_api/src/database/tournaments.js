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
  const { name, description, creator_id } = data;
  const result = db.prepare('INSERT INTO tournaments (name, description, creator_id) VALUES (?, ?, ?)').run(name, description, creator_id);
  return result;
}

export async function changeTournamentStatus(db, tournamentId) {
  const result = db.prepare(`UPDATE tournaments SET status = CASE WHEN status < ${T_STATUS.FINISHED} THEN status + 1 ELSE status END WHERE id = ? RETURNING status`).get(tournamentId);

  if (!result) {
    throw new Error('Tournament not found');
  }
  return result.status;
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

  const query = `UPDATE tournaments SET ${fields.join(', ')} WHERE id = ?`;
  return db.run(query, values);
}

export async function deleteTournament(db, id) {
  const result = db.prepare('DELETE FROM tournaments WHERE id = ?').run(id);
  return result;
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

