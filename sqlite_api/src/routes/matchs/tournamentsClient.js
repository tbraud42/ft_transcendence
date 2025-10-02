// routes/matchs/tournamentsClient.js
// | Method   | Route                     | Description                            | Access           |
// | -------- | ------------------------- | -------------------------------------- | ---------------- |
// | `GET`    | `/tournamentss`            | View all tournaments                   | Authenticated    |

export default async function (fastify, options) {
  // fastify.get('/', { preHandler: [fastify.auth] }, async (req, reply) => {
  //   const tournament = await fastify.getAllTournaments(fastify.db);
  //   if (!tournament || tournament.length === 0) {
  //     return reply.code(404).send({ error: 'no tournaments yet' });
  //   }
  //   reply.send(tournament);
  // });
}
