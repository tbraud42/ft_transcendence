// routes/auth/signup.js
// | Method   | Route              | Description                         | Access           |
// | -------- | ------------------ | ----------------------------------- | ---------------- |
// | `POST`   | `/auth/signup`     | signup, reply by JWT token          | Public           |

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
      return reply.code(400).send({ error: 'Username already use' });
    }

    if (fastify.usernameEndsWith42(username)) {
      return reply.code(400).send({ error: 'Invalide username' });
    }

    const validation = await fastify.validatePassword(password);
    if (!validation.valid) {
      const message = await fastify.passwordFeedback(validation.errors);

      return reply.code(400).send({ error: "Invalide password policy", message });
    }

    fastify.apiStat.signup++;
    const newUser = await fastify.createUser(fastify.db, { username: username, password: password, avatar: null});
    const token = fastify.generateToken({id: newUser.userId, username: newUser.username, role: newUser.role,}, true, '12h');

    return reply.send({ token });
  });
}
