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
      return reply.code(404).send({});
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
    const maxPlayer  = body.maxPlayer === undefined ? 2 : Number(body.maxPlayer);
    const creator = req.user.username;
    const bad = () => reply.code(400).send({ error: 'Missing or invalid field' });

    if (!name || name.length > 50) return bad();
    if (description && description.length > 255) return bad();
    if (!['easy','medium','hard'].includes(difficulty)) return bad();
    if (maxPlayer != 2 && maxPlayer != 4 && maxPlayer != 8) return bad();

    const data = {
      name,
      description,
      difficulty,
      maxPlayer,
      creator,
    };

    const tournament = await fastify.createTournament(fastify.db, data);
    reply.send(tournament);
  });

  fastify.patch('/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const id = Number(req.params.id);

    const allowed = await fastify.isAdminOrCreator(fastify.db, id, req.user.id);
    if (!allowed) return reply.code(403).send({ error: 'Access denied' });

    const body = req.body ?? {};
    const name        = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const difficulty  = typeof body.difficulty === 'string' ? body.difficulty.trim().toLowerCase() : '';
    const maxPlayer  = body.maxPlayer === undefined ? 2 : Number(body.maxPlayer);
    const bad = () => reply.code(400).send({ error: 'Missing or invalid field' });

    if (!name || name.length > 50) return bad();
    if (description && description.length > 255) return bad();
    if (!['easy','medium','hard'].includes(difficulty)) return bad();
    if (maxPlayer != 2 && maxPlayer != 4 && maxPlayer != 8) return bad();

    const tournament = await fastify.updateTournament(fastify.db, id, { name, description, difficulty, maxPlayer});
    if (!tournament || tournament.changes === 0) return reply.code(404).send({ error: 'Not found' });

    reply.send({ success: true });
  });

  fastify.post('/result/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const isAdmin = fastify.isAdmin(fastify.db, req.user.id);
    if (!isAdmin) return reply.code(403).send({ error: 'Access denied' });

    const tid = Number(req.params.id);
    if (!Number.isFinite(tid)) return reply.code(400).send({ error: 'Invalid tournament id' });

    if (!await fastify.tournamentExists(fastify.db, tid)) {
      return reply.code(404).send({ error: 'Tournament not found' });
    }

    const body  = req.body ?? {};
    const games = Array.isArray(body.games) ? body.games : [];
    const tourWinnerUsername =
      typeof body?.winner === 'string' ? body.winner.trim()
      : typeof body?.winner_username === 'string' ? body.winner_username.trim()
      : undefined;

    if (games.length === 0 && tourWinnerUsername === undefined) {
      return reply.code(400).send({ error: 'Provide games and/or winner' });
    }

    const preparedRows = [];
    for (const g of games) {
      const row = {
        game_num: g.game_num,
        p1: g.p1,
        p2: g.p2,
        winner: g.winner,
        started_at: g.started_at,
        duration_sec: g.duration_sec,
        p1_score: g.p1_score,
        p2_score: g.p2_score,
      };

      const { ok, errors, normalized } = fastify.validateGameRow(row);
      if (!ok) return reply.code(400).send({ error: `Invalid game row: ${errors.join(', ')}` });

      console.log(`§§§§test§§§§ = ${normalized.game_num}`);
      const u1 = fastify.showUserByUsername(fastify.db, normalized.p1);
      const u2 = fastify.showUserByUsername(fastify.db, normalized.p2);
      if (!u1 || !u2) return reply.code(400).send({ error: 'Unknown user in games' });

      preparedRows.push({
        game_num: normalized.game_num,
        player1: normalized.p1,
        player2: normalized.p2,
        p1_score: normalized.s1,
        p2_score: normalized.s2,
        duration_sec: normalized.dur,
        started_at: normalized.startedAt,
        winner: normalized.winner,
      });
    }

    await fastify.insertStatGame(fastify.db, tid, preparedRows);

    if (tourWinnerUsername !== undefined) {
      const u = fastify.showUserByUsername(fastify.db, tourWinnerUsername);
      if (!u) return reply.code(400).send({ error: 'Invalid winner' });

      const done = await fastify.setTournamentWinner(fastify.db, tid, tourWinnerUsername);
      return reply.send({ id: done.id, status: done.status, winner: done.winner });
    }

    const t = await fastify.getTournamentById(fastify.db, tid);
    return reply.send({ id: t.id, status: t.status, winner: t.winner ?? null });
  });

  fastify.delete('/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const id = Number(req.params.id);
    const allowed = await fastify.isAdminOrCreator(fastify.db, id, req.user.id);
    if (!allowed) return reply.code(403).send({ error: 'Access denied' });

    const info = await fastify.deleteTournament(fastify.db, id);
    if (!info || info.changes === 0) return reply.code(404).send({ error: 'Not found' });

    return reply.send({ success: true });
  });
}
