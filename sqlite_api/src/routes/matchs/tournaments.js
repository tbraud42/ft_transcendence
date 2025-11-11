// routes/matchs/tournaments.js
// | Method   | Route                     | Description                            | Access           |
// | -------- | ------------------------- | -------------------------------------- | ---------------- |
// | `GET`    | `/tournaments`            | View all tournaments                   | Authenticated    |
// | `GET`    | `/tournaments/:id`        | View a specific tournament             | Authenticated    |
// | `GET`    | `/tournaments/waitting`   | View waiting tournaments (status=0)    | Authenticated    |
// | `GET`    | `/tournaments/playing`    | View playing tournaments (status=1)    | Authenticated    |
// | `GET`    | `/tournaments/finished`   | View finished tournaments (status=2)   | Authenticated    |
// | `POST`   | `/tournaments`            | Create a tournament                    | Authenticated    |
// | `POST`   | `/tournaments/state/:id`  | Advance or set state                   | Admin, creator   |
// | `POST`   | `/tournaments/result/:id` | Insert games, set winner               | Admin, creator   |
// | `DELETE` | `/tournaments/:id`        | Delete a tournament                    | Admin, creator   |

export default async function (fastify, options) {
  fastify.get('/', { preHandler: [fastify.auth] }, async (req, reply) => {
    const tournament = await fastify.getAllTournaments(fastify.db);
    if (!tournament || tournament.length === 0) {
      return reply.send({ error: false, code: '', info: {} });
    }
    return reply.send({ error: false, code: '', info: { tournament } });
  });

  fastify.get('/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const id = Number(req.params.id);
    const tournament = await fastify.getTournamentById(fastify.db, id);
    if (!tournament) return reply.code(200).send({ error: true, code: 'TOURNAMENT_NOT_FOUND', info: 'tournament not found' });
    return reply.send({ error: false, code: '', info: { tournament } });
  });

  fastify.get('/waitting', { preHandler: [fastify.auth] }, async (req, reply) => {
    const tournament = await fastify.getTournamentsByStatus(fastify.db, 0);
    if (!tournament || tournament.length === 0) return reply.send({ error: false, code: '', info: {} });
    return reply.send({ error: false, code: '', info: { tournament } });
  });

  fastify.get('/playing', { preHandler: [fastify.auth] }, async (req, reply) => {
    const tournament = await fastify.getTournamentsByStatus(fastify.db, 1);
    if (!tournament || tournament.length === 0) return reply.send({ error: false, code: '', info: {} });
    return reply.send({ error: false, code: '', info: { tournament } });
  });

  fastify.get('/finished', { preHandler: [fastify.auth] }, async (req, reply) => {
    const tournament = await fastify.getTournamentsByStatus(fastify.db, 2);
    if (!tournament || tournament.length === 0) return reply.send({ error: false, code: '', info: {} });
    return reply.send({ error: false, code: '', info: { tournament } });
  });

  fastify.post('/', { preHandler: [fastify.auth] }, async (req, reply) => {
    const body = req.body ?? {};

    const socket_id   = 1;
    const name        = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const difficulty  = typeof body.difficulty === 'string' ? body.difficulty.trim().toLowerCase() : '';
    const maxPlayer   = body.maxPlayer === undefined ? 2 : Number(body.maxPlayer);
    const creator     = String(req.user.username || '').trim();

    const bad = (msg='Missing or invalid field') => reply.code(200).send({ error: true, code: 'VALIDATION_MISSING_OR_INVALID_FIELD', info: msg });

    if (!name || name.length > 50) return bad();
    if (description && description.length > 255) return bad();
    if (!['easy','medium','hard'].includes(difficulty)) return bad();
    if (!Number.isInteger(maxPlayer) || ![2,4,8].includes(maxPlayer)) return bad('Invalid maxPlayer');
    if (!creator) return bad('Invalid creator');

    const data = { socket_id, name, description, difficulty, maxPlayer, creator };

    const tournament = await fastify.createTournament(fastify.db, data);
    return reply.send({ error: false, code: '', info: { tournament } });
  });

  fastify.post('/state/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const tid = Number(req.params.id);
    const body = req.body ?? {};
    const status = body.status === undefined ? 0 : Number(body.status);
    if (!Number.isFinite(tid)) return reply.code(200).send({ error: true, code: 'TOURNAMENT_INVALID_ID', info: 'Invalid tournament id' });

    if (!await fastify.getTournamentById(fastify.db, tid)) {
      return reply.code(200).send({ error: true, code: 'TOURNAMENT_NOT_FOUND', info: 'Tournament not found' });
    }

    const allowed = await fastify.isAdminOrCreator(fastify.db, tid, req.user.username);
    if (!allowed) return reply.code(200).send({ error: true, code: 'AUTH_ACCESS_DENIED', info: 'Access denied' });

    const info = fastify.changeTournamentStatus(fastify.db, tid, status);
    return reply.send({ error: false, code: '', info: { info } });
  });

  fastify.post('/result/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const tid = Number(req.params.id);
    if (!Number.isFinite(tid)) return reply.code(200).send({ error: true, code: 'TOURNAMENT_INVALID_ID', info: 'Invalid tournament id' });

    const tournament = await fastify.getTournamentById(fastify.db, tid);
    if (!tournament) {
      return reply.code(200).send({ error: true, code: 'TOURNAMENT_NOT_FOUND', info: 'Tournament not found' });
    }

    const allowed = await fastify.isAdminOrCreator(fastify.db, tid, req.user.username);
    if (!allowed) return reply.code(200).send({ error: true, code: 'AUTH_ACCESS_DENIED', info: 'Access denied' });

    const body  = req.body ?? {};
    const games = Array.isArray(body.games) ? body.games : [];
    const tourWinnerUsername = typeof body?.winner === 'string' ? body.winner.trim() : '';

    if (games.length === 0) {
      return reply.code(200).send({ error: true, code: 'TOURNAMENT_MISSING_GAMES_OR_WINNER', info: 'Provide games' });
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
      if (!ok) return reply.code(200).send({ error: true, code: 'TOURNAMENT_INVALID_FIELD', info: `Invalid game row: ${errors.join(', ')}` });

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

    await fastify.insertStatGame(fastify, tid, preparedRows);

    if (tourWinnerUsername !== undefined && tourWinnerUsername !== '') {
      const u = fastify.showUserByUsername(fastify, tourWinnerUsername);
      if (!u) return reply.code(200).send({ error: true, code: 'TOURNAMENT_INVALID_WINNER', info: 'Invalid tournament winner' });

      await fastify.setTournamentWinner(fastify.db, tid, tourWinnerUsername);
      return reply.send({ error: false, code: '', info: { tournament } });
    }

    return reply.send({ error: false, code: '', info: { tournament } });
  });

  fastify.delete('/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const id = Number(req.params.id);

    const tournament = await fastify.getTournamentById(fastify.db, id);
    if (!tournament) {
      return reply.code(200).send({ error: true, code: 'TOURNAMENT_NOT_FOUND', info: 'Tournament not found' });
    }

    const allowed = await fastify.isAdminOrCreator(fastify.db, id, req.user.username);
    if (!allowed) return reply.code(200).send({ error: true, code: 'AUTH_ACCESS_DENIED', info: 'Access denied' });

    const info = await fastify.deleteTournament(fastify.db, id);

    return reply.send({ error: false, code: '', info: { info } });
  });
}

// | Error                               | Code                                  |
// | ----------------------------------- | ------------------------------------- |
// | Tournament not found                | `TOURNAMENT_NOT_FOUND`                |
// | Missing or invalid field            | `VALIDATION_MISSING_OR_INVALID_FIELD` |
// | Tournament name already taken       | `TOURNAMENT_NAME_ALREADY_TAKEN`       |
// | Invalid tournament id               | `TOURNAMENT_INVALID_ID`               |
// | Access denied                       | `AUTH_ACCESS_DENIED`                  |
// | Provide games and/or winner         | `TOURNAMENT_INVALID_FIELD`            |
// | Invalid game row                    | `TOURNAMENT_INVALID_GAME_ROW`         |
// | Invalid tournament winner           | `TOURNAMENT_INVALID_WINNER`           |
