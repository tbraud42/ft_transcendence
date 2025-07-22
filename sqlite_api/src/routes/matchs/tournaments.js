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
  fastify.get('/', {preHandler: [fastify.authenticate]}, async (req, reply) => {
    const tournaments = fastify.getAllTournaments(fastify.db);
    if(!tournaments) return reply.code(404).send({ error: 'no tournaments yet' });

    reply.send(tournaments);
  });

  fastify.get('/:id', {preHandler: [fastify.authenticate]}, async (req, reply) => {
    const tournaments = fastify.getTournamentById(fastify.db, req.params.id);
    if (!tournaments) return reply.code(404).send({ error: 'tournaments not found' });

    reply.send(tournaments);
  });

  fastify.post('/', {preHandler: [fastify.authenticate]}, async (req, reply) => {
    const tournaments = fastify.createTournament(fastify.db, /*data*/); //{ name, description, creator_id }
    // retour d'erreur possible?
    reply.send(tournaments); // voir la valeur de retour
  });

  fastify.patch('/:id', {preHandler: [fastify.authenticate, fastify.isTournamentCreator(fastify.db, req.params.id, req.params.userId)]}, async (req, reply) => {
    const tournaments = fastify.updateTournament(fastify.db, req.params.id, /*data*/); // retour d'erreur possible?

    reply.send({ success: true });
  });

  fastify.delete('/:id', {preHandler: [fastify.authenticate, fastify.isTournamentCreator(fastify.db, req.params.id, req.params.userId)]}, async (req, reply) => {
    const tournaments = fastify.deleteTournament(fastify.db, req.params.id);
    if (!tournaments) return reply.code(404).send({ error: 'tournaments not found' }); // bon retoru d'erreur?

    reply.send({ success: true });
  });
}
