// routes/ping.js
export default async function (fastify, opts) {
  fastify.get('/', async (request, reply) => {
    const ip = request.ip;
    reply.type('application/json').send({ message: 'pong', from: ip });
  });
}
