// routes/matchs/tournaments_client.js
// | Method   | Route                                   | Description                  | Access                      |
// | -------- | --------------------------------------- | ---------------------------- | --------------------------- |
// | `GET`    | `/tournaments/:id/participants/:userId` | View tournament participants | Authenticated               | // tout le monde de login ??
// | `POST`   | `/tournaments/:id/participants/:userId` | Join a tournament (register) | Authenticated               |
// | `PATCH`  | `/tournaments/:id/participants/:userId` | Update score or rank         | Admin, creator              |
// | `DELETE` | `/tournaments/:id/participants/:userId` | Remove a participant         | Admin, creator, or self     |

// en construction
export default async function (fastify, options) {
  fastify.get('/:id/participants', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const user = null; // fonction pour montrer les participant d'un tournant, tous
    if (!user) return reply.code(404).send({ error: 'User not found' });
    reply.send(user);
  });

  fastify.post('/:id/participants', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const tournaments = fastify.addParticipant(fastify.db, req.params.id); // add participant

    reply.send(tournaments);
  });

  fastify.patch('/:id/participants/:userId', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    reply.send({ success: true }); // req.params.id req.params.userId
  });

  fastify.delete('/:id/participants/:userId', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    await fastify.deleteUser(fastify.db, req.params.id);
    reply.send({ success: true });
  });
}
