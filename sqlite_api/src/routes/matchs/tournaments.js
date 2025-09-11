// routes/matchs/tournaments.js
// | Method   | Route                     | Description                            | Access           |
// | -------- | ------------------------- | -------------------------------------- | ---------------- |
// | `GET`    | `/tournaments`            | View all tournaments                   | Authenticated    |
// | `GET`    | `/tournaments/:id`        | View a specific tournament             | Authenticated    |
// | `GET`    | `/tournaments/watting`    | View watting tournaments               | Authenticated    |
// | `GET`    | `/tournaments/playing`    | View playing tournaments               | Authenticated    |
// | `GET`    | `/tournaments/finished`   | View finished tournaments              | Authenticated    |
// | `POST`   | `/tournaments`            | Create a tournament                    | Authenticated    |
// | `PATCH`  | `/tournaments/:id`        | Edit tournament (name, description...) | Admin, creator   |
// | `POST`   | `/tournaments/state/:id`  | Edit state tournament                  | Admin, creator   |
// | `POST`   | `/tournaments/result/:id` | implemnt result in tournament          | Admin, creator   |
// | `DELETE` | `/tournaments/:id`        | Delete a tournament                    | Admin, creator   |

export default async function (fastify, options) {
  fastify.get('/', {preHandler: [fastify.auth]}, async (req, reply) => {
    const tournaments = await fastify.getAllTournaments(fastify.db);
    if(!tournaments) return reply.code(404).send({ error: 'no tournaments yet' });

    reply.send(tournaments);
  });

  fastify.get('/:id(\\d+)', {preHandler: [fastify.auth]}, async (req, reply) => {
    const id = Number(req.params.id);

    const tournaments = await fastify.getTournamentById(fastify.db, id);
    if (!tournaments) return reply.code(404).send({ error: 'tournaments not found' });

    reply.send(tournaments);
  });

  fastify.get('/watting', {preHandler: [fastify.auth]}, async (req, reply) => {
    const tournaments = await fastify.getTournamentsByStatus(fastify.db, 0);
    if (!tournaments) return reply.code(404).send({ error: 'no tournament availible' });

    reply.send(tournaments);
  });

  fastify.get('/playing', {preHandler: [fastify.auth]}, async (req, reply) => {
    const tournaments = await fastify.getTournamentsByStatus(fastify.db, 1);
    if (!tournaments) return reply.code(404).send({ error: 'no tournament availible' });

    reply.send(tournaments);
  });

  fastify.get('/finished', {preHandler: [fastify.auth]}, async (req, reply) => {
    const tournaments = await fastify.getTournamentsByStatus(fastify.db, 2);
    if (!tournaments) return reply.code(404).send({ error: 'no tournament availible' });

    reply.send(tournaments);
  });

  fastify.post('/', {preHandler: [fastify.auth]}, async (req, reply) => {
    const body = req.body ?? {};

    const name        = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const difficulty  = typeof body.difficulty === 'string' ? body.difficulty.trim().toLowerCase() : '';
    const maxPlayers  = body.maxPlayers === undefined ? 16 : body.maxPlayers; // number only
    const isPrivate   = body.isPrivate === undefined ? false : body.isPrivate; // boolean only a modifier

    const errorCode = () => reply.code(400).send({ error: 'Missing or invalid field' });

    if (!name || name.length > 50) return errorCode();
    if (description && description.length > 255) return errorCode();
    if (!['easy','medium','hard'].includes(difficulty)) return errorCode();
    if (typeof maxPlayers !== 'number' || !Number.isInteger(maxPlayers) || (maxPlayers != 2 && maxPlayers != 4 && maxPlayers != 8)) return errorCode();
    if (typeof isPrivate !== 'boolean') return errorCode();

    const result = await fastify.getTournamentByName(fastify.db, name)
    if (result)  {
      return reply.status(400).send({ error: 'Name already token' });
    }

    const creator_id = req.user.id;

    const data = {
      name,
      description,
      creator_id,
      difficulty,
      maxPlayers,
      isPrivate: isPrivate ?? false,
    };

    const tournaments = await fastify.createTournament(fastify.db, data);
    if (req.user?.role !== 'admin') {
      await fastify.addParticipant(fastify.db, tournaments.id, creator_id);
    }

    reply.send(tournaments);
  });

  fastify.patch('/:id(\\d+)', {preHandler: [fastify.auth]}, async (req, reply) => {
    const id = Number(req.params.id);

    const allowed = await fastify.isAdminOrCreator(fastify, id, req.user.id);
    if (!allowed) return reply.code(403).send({ error: 'Access denied' });

    const body = req.body ?? {};

    const name        = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const difficulty  = typeof body.difficulty === 'string' ? body.difficulty.trim().toLowerCase() : '';
    const maxPlayers  = body.maxPlayers === undefined ? 16 : body.maxPlayers; // number only
    const isPrivate   = body.isPrivate === undefined ? false : body.isPrivate; // boolean only a modifier

    const errorCode = () => reply.code(400).send({ error: 'Missing or invalid field' });

    if (!name || name.length > 50) return errorCode();
    if (description && description.length > 255) return errorCode();
    if (!['easy','medium','hard'].includes(difficulty)) return errorCode();
    if (typeof maxPlayers !== 'number' || !Number.isInteger(maxPlayers) || (maxPlayers != 2 && maxPlayers != 4 && maxPlayers != 8)) return errorCode();
    if (typeof isPrivate !== 'boolean') return errorCode();

    const data = {
      name,
      description,
      difficulty,
      maxPlayers,
      isPrivate: isPrivate ?? false,
    };

    const tournaments = await fastify.updateTournament(fastify.db, req.params.id, data);
    reply.send({ success: true });
  });

  fastify.post('/state/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const id = Number(req.params.id);

    const allowed = await fastify.isAdminOrCreator(fastify, id, req.user.id);
    if (!allowed) return reply.code(403).send({ error: 'Access denied' });

    const result = await fastify.changeTournamentStatus(fastify.db, id);
    if (!result) return reply.code(404).send({ error: 'Not found' });

    return reply.send({ id: result.id, status: result.status });
  });

  fastify.post('/result/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const id = Number(req.params.id);
    const errorCode = () => reply.code(400).send({ error: 'Missing or invalid field' });

    if (!Number.isFinite(id)) return errorCode();

    const allowed = await fastify.isAdminOrCreator(fastify, id, req.user.id);
    if (!allowed) return reply.code(403).send({ error: 'Access denied' });

    const body = req.body ?? {};

    const winnerId = Number(body?.winner?.user_id);
    if (!Number.isFinite(winnerId)) return errorCode();

    const participants = Array.isArray(body.participants) ? body.participants : [];
    if (participants.length === 0) return errorCode();

    const allParticipants = [];
    for (const p of participants) {
      const uid     = Number(p?.user_id);
      const wins    = Number(p?.wins);
      const losses  = Number(p?.losses);
      const matches = Number(p?.matches);
      const seconds = Number(p?.seconds_total);
      if (
        !Number.isFinite(uid) ||
        !Number.isFinite(wins)    || wins    < 0 || !Number.isInteger(wins)    ||
        !Number.isFinite(losses)  || losses  < 0 || !Number.isInteger(losses)  ||
        !Number.isFinite(matches) || matches < 0 || !Number.isInteger(matches) ||
        !Number.isFinite(seconds) || seconds < 0 || !Number.isInteger(seconds)
      ) return errorCode();
      allParticipants.push({ uid, wins, losses, matches, seconds });
    }

    if (!allParticipants.some(p => p.uid === winnerId)) return errorCode();

    const tExist = fastify.db.prepare(`SELECT status FROM tournaments WHERE id = ?`).get(id);
    if (!tExist) return reply.code(404).send({ error: 'Not found' });
    if (tExist.status === 2 && !await fastify.isAdmin(fastify.db, req.user.id))  return errorCode();

    const existsParticipants = fastify.db.prepare(`SELECT 1 FROM tournament_participants WHERE tournament_id = ? AND user_id = ?`);
    for (const p of allParticipants) {
      const ex = existsParticipants.get(id, p.uid);
      if (!ex) return errorCode();
    }

    const updTP = fastify.db.prepare(`UPDATE tournament_participants SET wins = ?, losses = ? WHERE tournament_id = ? AND user_id = ?`);
    const updUser = fastify.db.prepare(`UPDATE users SET total_matches = total_matches + ?, total_seconds = total_seconds + ? WHERE id = ?`);
    const finish = fastify.db.prepare(`UPDATE tournaments SET winner = ?, status = 2 WHERE id = ? RETURNING id, status, winner`);

    const tx = fastify.db.transaction((rows) => {
      for (const p of rows) {
        updTP.run(p.wins, p.losses, id, p.uid);
        updUser.run(p.matches, p.seconds, p.uid);
      }
      return finish.get(winnerId, id);
    });

    await fastify.changeTournamentStatus(fastify.db, id);
    const done = tx(allParticipants);
    return reply.send({ id: done.id, status: done.status, winner_id: done.winner });
  });


  fastify.delete('/:id(\\d+)', {preHandler: [fastify.auth]}, async (req, reply) => {
    const id = Number(req.params.id);

    const allowed = await fastify.isAdminOrCreator(fastify, id, req.user.id);
    if (!allowed) return reply.code(403).send({ error: 'Access denied' });

    const info = fastify.deleteTournament(fastify.db, id);
    if (!info || info.changes === 0) {
      return reply.code(404).send({ error: 'Not found' });
    }

    return reply.send({ success: true });
  });
}
