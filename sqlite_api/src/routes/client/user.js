// routes/client/user.js
// | Method   | Route                    | Description                                 | Access        |
// | -------- | ------------------------ | ------------------------------------------- | ------------- |
// | `GET`    | `/users/me`              | View a user's id                            | Authenticated |
// | `GET`    | `/users/:id`             | View a user's profile                       | Admin + self  |
// | `PATCH`  | `/users/:id`             | Update user info (password, username, etc.) | Self          | // + admin ??
// | `DELETE` | `/users/:id`             | Delete an account                           | Admin + self  |
// | `GET`    | `/users/:id/tournaments` | View tournaments a user has participated in | Admin + self  |

export default async function (fastify, options) {
  fastify.get('/me', { preHandler: [fastify.authenticate(fastify)] }, async (req, reply) => {
    // const user = await fastify.showUser(fastify.db, req.user.id);
    // if (!user) return reply.code(404).send({ error: 'User not found' }); // should never happen
    reply.send(req.user.id); // include id, username, maybe role but no password ofc
  });

  fastify.get('/:id', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    if (parseInt(req.params.id) === req.user.id  || req.user.role === 'admin') {
      const user = await fastify.showUserById(fastify.db, parseInt(req.params.id));
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }
      reply.send(user); // savoir quelle info on renvoie, par defaut *
      return ;
    }
    return reply.code(404).send({ error: 'Forbidden: insufficient permissions' });
  });

  fastify.patch('/:id', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const { username, password } = req.body;
    const targetId = parseInt(req.params.id);

    if (targetId === req.user.id  || req.user.role === 'admin') {
      const user = await fastify.showUserById(fastify.db, targetId);
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }
      const double = await fastify.showUserByUsername(fastify.db, username);
      if (double) {
        return reply.code(401).send({ error: 'username already use' });
      }

      if (!await fastify.verifyPassword(password, user.password_hash)) {
        const validation = await fastify.validatePassword(password);
        if (!validation.valid) {
          const message = await fastify.passwordFeedback(validation.errors);

          return reply.code(400).send({error: "Bad Request", code: "INVALID_PASSWORD_POLICY", message });
        }
      }

      const result = await fastify.updateUser(fastify.db, targetId, { username, password });
      return reply.send('User update successfully');
    }
    return reply.code(404).send({ error: 'Forbidden: insufficient permissions' });
  });

  fastify.delete('/:id', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const targetId = parseInt(req.params.id);

    if (targetId === req.user.id || req.user.role === 'admin') {
      const user = await fastify.showUserById(fastify.db, targetId);
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }
      await fastify.deleteUser(fastify.db, req.params.id);
      return reply.send({ success: true });
    }
    return reply.code(404).send({ error: 'Forbidden: insufficient permissions' });
  });

  fastify.get('/:id/tournaments', {preHandler: [fastify.authenticate(fastify), fastify.allowSelfOrAdmin]}, async (req, reply) => { // faire et tester quand les tournaments sont implementer
    const tournaments = await fastify.db.prepare(
      `SELECT * FROM tournaments WHERE user_id = ?`
    ).all(req.params.id); // facoriser dans manage.js ?

    reply.send(tournaments);
  });
}
