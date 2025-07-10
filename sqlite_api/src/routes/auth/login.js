// routes/auth/login.js
export default async function (fastify, options) {
  fastify.post('/', async (request, reply) => {
    const { username, password } = request.body;

    const user = fastify.showUser(fastify.db, username);

    if (!user) {
      return reply.code(401).send({ error: 'User not found' });
    }

    if (!(await fastify.verifyPassword(password, user.password_hash))) {
      return reply.code(401).send({ error: 'invalid password' });
    }

    const token = fastify.generateToken({ username });
    return reply.send({ token });
  });
}
