// routes/auth/signup.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `POST`   | `/auth/signup`     | signup, reply by JWT token             | Public           |

export default async function (fastify, options) {
  fastify.post('/', async (req, reply) => {
    const body = req.body ?? {};
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !password) {
      return reply.code(400).send({ error: 'Missing or invalid field [username/password]' });
    }

    const user = await fastify.showUserByUsername(fastify.db, username);
    if (user) {
      return reply.code(401).send({ error: 'username already use' });
    }

    if (await fastify.usernameEndsWith42(username)) {
      return reply.code(401).send({ error: 'invalide username' });
    }

    const validation = await fastify.validatePassword(password);
    if (!validation.valid) {
      const message = await fastify.passwordFeedback(validation.errors);

      return reply.code(400).send({
        error: "Bad Request",
        code: "INVALID_PASSWORD_POLICY",
        message
      });
    }

    fastify.stat.signup++;
    const newUser = await fastify.createUser(fastify.db, { username: username, password: password});
    const token = fastify.generateToken({id: newUser.userId, username: newUser.username, role: newUser.role,}, true, '12h');
    return reply.send({ token });
  });
}
