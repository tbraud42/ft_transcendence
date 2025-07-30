// database/tournaments.js

export async function getAllTournaments(db) {
  const stmt = db.prepare('SELECT * FROM tournaments')
  const rows = stmt.all()
  return rows
}

export async function getTournamentById(db, id) {
  return db.get('SELECT * FROM tournaments WHERE id = ?', [id]);
}

export async function createTournament(db, data) {
  const { name, description, creator_id } = data;
  return db.run(
    'INSERT INTO tournaments (name, description, creator_id) VALUES (?, ?, ?)',
    [name, description, creator_id]
  );
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
  return db.run('DELETE FROM tournaments WHERE id = ?', [id]);
}

export function requireCreatorOrAdmin(db) {
  return async function (req, reply) {
    const tournamentId = req.params.id;
    const userId = req.user.id;

    const tournament = await db.get('SELECT creator_id FROM tournaments WHERE id = ?', [tournamentId]);
    if (!tournament) return reply.code(404).send({ error: 'Tournament not found' });

    if (tournament.creator_id !== userId && req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  };
}


export async function getParticipantsByTournamentId(db, tournamentId) {
  return db.all('SELECT * FROM participants WHERE tournament_id = ?', [tournamentId]);
}

export async function addParticipant(db, tournamentId, userId) {
  return db.run('INSERT INTO participants (tournament_id, user_id) VALUES (?, ?)', [tournamentId, userId]);
}

export async function updateParticipant(db, tournamentId, userId, data) {
  // mise à jour du score tmp avant amelioration
  return db.run('UPDATE participants SET score = ? WHERE tournament_id = ? AND user_id = ?', [data.score, tournamentId, userId]);
}

export async function deleteParticipant(db, tournamentId, userId) {
  return db.run('DELETE FROM participants WHERE tournament_id = ? AND user_id = ?', [tournamentId, userId]);
}
