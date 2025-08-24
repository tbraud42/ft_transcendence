// routes/matchs/tournaments.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `GET`    | `/tournaments`     | View all tournaments                   | Authenticated    | // a part si un user non login veux voir
// | `GET`    | `/tournaments/:id` | View a specific tournament             | Authenticated    | // a part si un user non login veux voir
// | `POST`   | `/tournaments`     | Create a tournament                    | Authenticated    |
// | `PATCH`  | `/tournaments/:id` | Edit tournament (name, description...) | Admin, creator   |
// | `DELETE` | `/tournaments/:id` | Delete a tournament                    | Admin, creator   |

// en construction
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

  fastify.post('/', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const { name, description, difficulty, maxPlayers, isPrivate } = req.body;

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
    // retour d'erreur possible?
    reply.send(tournaments);
  });

  fastify.patch('/:id', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const { name, description, difficulty, maxPlayers, isPrivate } = req.body;
    const creator_id = req.user.id; // admin qui peu changer des choses ?

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

    const tournaments = await fastify.updateTournament(fastify.db, req.params.id, data);
    // retour d'erreur possible?

    reply.send({ success: true });
  });

  fastify.delete('/:id', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const tournaments = await fastify.deleteTournament(fastify.db, req.params.id);
    if (!tournaments) return reply.code(404).send({ error: 'tournaments not found' }); // bon retour d'erreur?

    reply.send({ success: true });
  });
}