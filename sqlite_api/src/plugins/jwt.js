import jwt from '@fastify/jwt';

export default async function jwtPlugin(fastify, opts) {
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET,
  });

  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}
