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
      return reply.code(200).send({ error: true, code: 'VALIDATION_MISSING_OR_INVALID_FIELD', info: 'Missing or invalid field [username/password]' });
    }

    const user = await fastify.showUserByUsername(fastify, username);
    if (user) {
      return reply.code(200).send({ error: true, code: 'USERNAME_ALREADY_USED', info: 'Username already use' });
    }

    if (fastify.usernameEndsWith42(username)) {
      return reply.code(200).send({ error: true, code: 'INVALID_USERNAME_SUFFIX_42', info: 'Invalide username, cannot finish by _42' });
    }

    if (fastify.isDeletedUsername(username)) {
      return reply.code(400).send({ error: true, code: 'INVALID_USERNAME_RESERVED', info: 'Invalide username, reserved username'});
    }

    const validation = await fastify.validatePassword(password);
    if (!validation.valid) {
      const message = await fastify.passwordFeedback(validation.errors);

      return reply.code(200).send({ error: true, code: 'INVALID_PASSWORD_POLICY', info: 'Invalide password policy', message });
    }

    fastify.apiStat.signup++;
    const newUser = await fastify.createUser(fastify.db, { username: username, password: password, avatar: null});
    const token = fastify.generateToken({id: newUser.userId, username: newUser.username, role: newUser.role,}, true, '12h');

    return reply.send({ error: false, code: '', info: { token: token } });
  });
}

// | Error                                        | Code                                  |
// | -------------------------------------------- | ------------------------------------- |
// | Missing or invalid field [username/password] | `VALIDATION_MISSING_OR_INVALID_FIELD` |
// | Username already use                         | `USERNAME_ALREADY_USED`               |
// | Invalide username, cannot finish by _42      | `INVALID_USERNAME_SUFFIX_42`          |
// | Invalide password policy                     | `INVALID_PASSWORD_POLICY`             |
