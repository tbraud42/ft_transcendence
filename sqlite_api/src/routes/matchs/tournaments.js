// routes/matchs/tournaments.js
// | Method   | Route                     | Description                            | Access           |
// | -------- | ------------------------- | -------------------------------------- | ---------------- |
// | `GET`    | `/tournaments`            | View all tournaments                   | Authenticated    |
// | `GET`    | `/tournaments/:id`        | View a specific tournament (+games)    | Authenticated    |
// | `GET`    | `/tournaments/waitting`   | View waiting tournaments (status=0)    | Authenticated    |
// | `GET`    | `/tournaments/playing`    | View playing tournaments (status=1)    | Authenticated    |
// | `GET`    | `/tournaments/finished`   | View finished tournaments (status=2)   | Authenticated    |
// | `POST`   | `/tournaments`            | Create a tournament                    | Authenticated    |
// | `PATCH`  | `/tournaments/:id`        | Edit tournament (name, desc, diff)     | Admin, creator   |
// | `POST`   | `/tournaments/state/:id`  | Advance or set state                   | Admin, creator   |
// | `POST`   | `/tournaments/result/:id` | Insert games, optionally set winner    | Admin, creator   |
// | `DELETE` | `/tournaments/:id`        | Delete a tournament                    | Admin, creator   |

export default async function (fastify, options) {
  fastify.get('/', { preHandler: [fastify.auth] }, async (req, reply) => {
    const tournament = await fastify.getAllTournaments(fastify.db);
    if (!tournament || tournament.length === 0) {
      return reply.code(404).send({ error: 'no tournaments yet' });
    }
    reply.send(tournament);
  });

  fastify.get('/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const id = Number(req.params.id);
    const tournament = await fastify.getTournamentById(fastify.db, id);
    if (!tournament) return reply.code(404).send({ error: 'tournament not found' });
    reply.send(tournament);
  });

  fastify.get('/waitting', { preHandler: [fastify.auth] }, async (req, reply) => {
    const tournament = await fastify.getTournamentsByStatus(fastify.db, 0);
    if (!tournament || tournament.length === 0) return reply.code(404).send({ error: 'no tournament available' });
    reply.send(tournament);
  });

  fastify.get('/playing', { preHandler: [fastify.auth] }, async (req, reply) => {
    const tournament = await fastify.getTournamentsByStatus(fastify.db, 1);
    if (!tournament || tournament.length === 0) return reply.code(404).send({ error: 'no tournament available' });
    reply.send(tournament);
  });

  fastify.get('/finished', { preHandler: [fastify.auth] }, async (req, reply) => {
    const tournament = await fastify.getTournamentsByStatus(fastify.db, 2);
    if (!tournament || tournament.length === 0) return reply.code(404).send({ error: 'no tournament available' });
    reply.send(tournament);
  });

  fastify.post('/', { preHandler: [fastify.auth] }, async (req, reply) => {
    const body = req.body ?? {};
    const name        = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const difficulty  = typeof body.difficulty === 'string' ? body.difficulty.trim().toLowerCase() : '';

    const bad = () => reply.code(400).send({ error: 'Missing or invalid field' });
    if (!name || name.length > 50) return bad();
    if (description && description.length > 255) return bad();
    if (!['easy','medium','hard'].includes(difficulty)) return bad();

    const exists = await fastify.getTournamentByName(fastify.db, name);
    if (exists) return reply.code(400).send({ error: 'Name already taken' });

    const data = {
      name,
      description,
      difficulty,
      creator_id: req.user.id,
    };

    const tournament = await fastify.createTournament(fastify.db, data);
    reply.send(tournament);
  });

  fastify.patch('/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const id = Number(req.params.id);

    const allowed = await fastify.isAdminOrCreator(id, req.user.id);// ne marche pas
    if (allowed) return reply.code(403).send({ error: 'Access denied' });

    const body = req.body ?? {};
    const name        = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const difficulty  = typeof body.difficulty === 'string' ? body.difficulty.trim().toLowerCase() : '';
    const bad = () => reply.code(400).send({ error: 'Missing or invalid field' });

    if (!name || name.length > 50) return bad();
    if (description && description.length > 255) return bad();
    if (!['easy','medium','hard'].includes(difficulty)) return bad();

    const tournament = await fastify.updateTournament(fastify.db, id, { name, description, difficulty });
    if (!tournament || tournament.changes === 0) return reply.code(404).send({ error: 'Not found' });
    reply.send({ success: true });
  });

  fastify.post('/state/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const id = Number(req.params.id);

    const allowed = await fastify.isAdminOrCreator(fastify.db, id, req.user.id);
    if (allowed) return reply.code(403).send({ error: 'Access denied' });

    const next = typeof req.body?.status === 'number' ? req.body.status : null;
    if (next !== null && ![0,1,2].includes(next)) {
      return reply.code(400).send({ error: 'Invalid status' });
    }

    const result = await fastify.changeTournamentStatus(fastify.db, id, next);
    if (!result) return reply.code(404).send({ error: 'Not found' });

    return reply.send({ id: result.id, status: result.status });
  });

  fastify.post('/result/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const id = Number(req.params.id);
    const bad = (m='Missing or invalid field') => reply.code(400).send({ error: m });

    if (!Number.isFinite(id)) return bad();

    const allowed = await fastify.isAdminOrCreator(fastify.db, id, req.user.id);
    if (allowed) return reply.code(403).send({ error: 'Access denied' });

    if (!await fastify.tournamentExists(fastify.db, id)) return reply.code(404).send({ error: 'Not found' });

    const body = req.body ?? {};
    const games = Array.isArray(body.games) ? body.games : [];

    if (games.length === 0 && body.winner_id === undefined) {
      return bad('Provide games and/or winner_id');
    }

    for (const g of games) {
      const p1 = Number(g?.player1_id);
      const p2 = Number(g?.player2_id);
      const s1 = Number(g?.p1_score);
      const s2 = Number(g?.p2_score);
      const dur = Number(g?.duration_sec);
      if (![p1,p2,s1,s2,dur].every(Number.isFinite) || dur < 0) return bad();
      if (!await fastify.userExists(fastify.db, p1) || !await fastify.userExists(fastify.db, p2)) return bad('Unknown user in games');
    }

    if (games.length > 0) {
      try {
        await fastify.insertStatGame(fastify.db, id, games);
      } catch (e) {
        if (e.message === 'INVALID_GAME_ROW') return bad();
        throw e;
      }
    }

    if (body.winner_id !== undefined) {
      const winnerId = Number(body.winner_id);
      if (!Number.isFinite(winnerId) || !await fastify.userExists(fastify.db, winnerId)) return bad('Invalid winner_id');
      const done = await fastify.setTournamentWinner(fastify.db, id, winnerId);
      return reply.send({ id: done.id, status: done.status, winner_id: done.winner });
    }

    const t = await fastify.getTournamentById(fastify.db, id);
    return reply.send({ id: t.id, status: t.status, winner_id: t.winner ?? null });
  });

  fastify.delete('/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const id = Number(req.params.id);
    const allowed = await fastify.isAdminOrCreator(fastify.db, id, req.user.id);
    if (allowed) return reply.code(403).send({ error: 'Access denied' });

    const info = await fastify.deleteTournament(fastify.db, id);
    if (!info || info.changes === 0) return reply.code(404).send({ error: 'Not found' });

    return reply.send({ success: true });
  });
}
