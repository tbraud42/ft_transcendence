// routes/players.js
export default async function (fastify, opts) {
  fastify.get('/', { preHandler: fastify.authenticate }, async (request, reply) => {
  });

  fastify.post('/', { preHandler: fastify.authenticate }, async (request, reply) => {
  });
}
