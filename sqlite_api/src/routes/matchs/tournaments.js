// routes/matchs/tournaments.js
// | Method   | Route                    | Description                            | Access           |
// | -------- | ------------------------ | -------------------------------------- | ---------------- |
// | `GET`    | `/tournaments`           | View all tournaments                   | Authenticated    |
// | `GET`    | `/tournaments/:id`       | View a specific tournament             | Authenticated    |
// | `GET`    | `/tournaments/watting`   | View watting tournaments               | Authenticated    |
// | `GET`    | `/tournaments/playing`   | View playing tournaments               | Authenticated    |
// | `GET`    | `/tournaments/finished`  | View finished tournaments              | Authenticated    |
// | `POST`   | `/tournaments`           | Create a tournament                    | Authenticated    |
// | `PATCH`  | `/tournaments/:id`       | Edit tournament (name, description...) | Admin, creator   |
// | `PATCH`  | `/tournaments/state/:id` | Edit state tournament                  | Admin, creator   |
// | `DELETE` | `/tournaments/:id`       | Delete a tournament                    | Admin, creator   |

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
    const isPrivate   = body.isPrivate === undefined ? false : body.isPrivate; // boolean only

    const bad = () => reply.code(400).send({ error: 'Missing or invalid field' });

    if (!name || name.length > 50) return bad();
    if (description && description.length > 255) return bad();
    if (!['easy','medium','hard'].includes(difficulty)) return bad();
    if (typeof maxPlayers !== 'number' || !Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 16) return bad();
    if (typeof isPrivate !== 'boolean') return bad();

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

    const tournaments = await fastify.createTournament(fastify.db, data); // rajouter l'ajout du createur sauf si il est amin
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
    const isPrivate   = body.isPrivate === undefined ? false : body.isPrivate; // boolean only

    const bad = () => reply.code(400).send({ error: 'Missing or invalid field' });

    if (!name || name.length > 50) return bad();
    if (description && description.length > 255) return bad();
    if (!['easy','medium','hard'].includes(difficulty)) return bad();
    if (typeof maxPlayers !== 'number' || !Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 16) return bad();
    if (typeof isPrivate !== 'boolean') return bad();

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

  fastify.patch('/state/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const id = Number(req.params.id);

    const allowed = await fastify.isAdminOrCreator(fastify, id, req.user.id);
    if (!allowed) return reply.code(403).send({ error: 'Access denied' });

    const result = await fastify.changeTournamentStatus(fastify.db, id);
    if (!result) return reply.code(404).send({ error: 'Not found' });

    return reply.send({ id: result.id, status: result.status });
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
