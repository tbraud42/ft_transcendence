// routes/auth/isAuth.js
export default async function (fastify, options) {
  fastify.post('/', { preHandler: fastify.authenticate }, async (request, reply) => {
      return reply.send({ status: 'authenticated', user: request.user });
    }
  );
}
