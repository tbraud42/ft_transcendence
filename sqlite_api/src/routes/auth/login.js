// routes/auth/login.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `POST`   | `/login`           | login, reply by JWT token              | Public           |

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
    fastify.stat.login++;
    return reply.send({ token });
  });
}
