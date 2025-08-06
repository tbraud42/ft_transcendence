// routes/auth/login.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `POST`   | `/auth/login`      | login, reply by JWT token              | Public           |

export default async function (fastify, options) {
  fastify.post('/', async (req, reply) => {
    const { username, password } = req.body;

    const user = await fastify.showUserByUsername(fastify.db, username);
    if (!user) {
      return reply.code(401).send({ error: 'User not found' });
    }

    if (!(await fastify.verifyPassword(password, user.password_hash))) {
      return reply.code(401).send({ error: 'Invalid password' });
    }

    fastify.stat.login++;
    if (user.is_twofa_enabled) {
      const token = fastify.generateToken({id: user.id, username: user.username, role: user.role,}, false, '5m');

      return reply.send({twofa_required: true, tmp_token: token,});
    } else {
      const token = fastify.generateToken({id: user.id, username: user.username, role: user.role, }, true, '12h');

      return reply.send({ token });
    }
  });
}
