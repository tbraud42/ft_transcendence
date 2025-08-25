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
  fastify.get('/', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const tournaments = await fastify.getAllTournaments(fastify.db);
    if(!tournaments) return reply.code(404).send({ error: 'no tournaments yet' });

    reply.send(tournaments);
  });

  fastify.get('/:id', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const tournaments = await fastify.getTournamentById(fastify.db, req.params.id);
    if (!tournaments) return reply.code(404).send({ error: 'tournaments not found' });

    reply.send(tournaments);
  });

  fastify.get('/watting', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const tournaments = await fastify.getTournamentsByStatus(fastify.db, 0);
    if (!tournaments) return reply.code(404).send({ error: 'no tournament availible' });

    reply.send(tournaments);
  });

  fastify.get('/playing', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const tournaments = await fastify.getTournamentsByStatus(fastify.db, 1);
    if (!tournaments) return reply.code(404).send({ error: 'no tournament availible' });

    reply.send(tournaments);
  });

  fastify.get('/finished', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const tournaments = await fastify.getTournamentsByStatus(fastify.db, 2);
    if (!tournaments) return reply.code(404).send({ error: 'no tournament availible' });

    reply.send(tournaments);
  });

  fastify.post('/', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const { name, description, difficulty, maxPlayers, isPrivate } = req.body;
    // difficulter ne marche pas, maxplayers, is private
    const result = await fastify.getTournamentByName(fastify.db, name)
    if (result)  {
      return reply.status(400).send({ error: 'Name already token' });
    }

    const creator_id = req.user.id;

    if (!name || !creator_id || !difficulty || !maxPlayers) { // rajouter les test de grandeur de chaine de caracter ?
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    const data = {
      name,
      description,
      creator_id,
      difficulty,
      maxPlayers,
      isPrivate: isPrivate ?? false,
    };

    const tournaments = await fastify.createTournament(fastify.db, data);
    reply.send(tournaments);
  });

  fastify.patch('/:id', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    if (!fastify.isAdminOrCreator(fastify, req.params.id, req.user.id)) {
      return reply.code(403).send({ error: 'Access denied' });
    }

    const { name, description, difficulty, maxPlayers, isPrivate } = req.body;
    if (!name || !difficulty || !maxPlayers) { // rajouter les test de grandeur de chaine de caracter ?
      return reply.status(400).send({ error: 'Missing required fields' });
    }

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

  fastify.get('/state/:id', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => { // a faire
    if (!fastify.isAdminOrCreator(fastify, req.params.id, req.user.id)) {
      return reply.code(403).send({ error: 'Access denied' });
    }

    const result = fastify.changeTournamentStatus(fastify.db, req.params.id);
    if (result.error) {
      return reply.code(404).send({ error: 'no tournament availible' });
    }
    reply.send({ status: result }); // pas bon
  });

  fastify.delete('/:id', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => { // a corriger si on appel deux fois
    if (!fastify.isAdminOrCreator(fastify, req.params.id, req.user.id)) {
      return reply.code(403).send({ error: 'Access denied' });
    }

    const tournaments = await fastify.deleteTournament(fastify.db, req.params.id);
    if (!tournaments) return reply.code(404).send({ error: 'tournaments not found' });

    reply.send({ success: true });
  });
}
