// routes/client/user.js
// | Method   | Route                   | Description                                 | Access        |
// | -------- | ----------------------- | ------------------------------------------- | ------------- |
// | `GET`    | `/user/me`              | View a user's id                            | Authenticated |
// | `GET`    | `/user/:id`             | View a user's profile                       | Authenticated |
// | `PATCH`  | `/user/pass`            | Update user info password                   | Self          |
// | `PATCH`  | `/user/avatar`          | Update user avatar                          | Self          |
// | `DELETE` | `/user/:id`             | Delete an account                           | Admin + self  |
// | `GET`    | `/user/:id/tournaments` | View tournaments a user has participated in | Admin + self  |

export default async function (fastify, options) {
  fastify.get('/me', { preHandler: [fastify.auth] }, async (req, reply) => {
    reply.send(req.user.id);
  });

  fastify.get('/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const targetId = Number(req.params.id);
    if (!Number.isFinite(targetId)) {
      return reply.code(400).send({ error: 'Invalid id' });
    }

    const user = await fastify.showUserById(fastify.db, targetId);
    if (!user) return reply.code(404).send({ error: 'User not found' });

    const isSelf = targetId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (isSelf || isAdmin) {
      return reply.send({ user: mapUserForSelfOrAdmin(user) });
    }

    return reply.send({ user: mapUserForPublic(user) });
  });

  fastify.patch('/pass', {preHandler: [fastify.auth]}, async (req, reply) => { // tester avec auth 42
    const body = req.body ?? {};
    const oldPassword = typeof body.oldPassword === 'string' ? body.oldPassword.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!oldPassword || !newPassword) {
      return reply.code(400).send({ error: 'Missing or invalid field [username/password]' });
    }

    if (fastify.usernameEndsWith42(req.user.username)) {
      return reply.code(400).send({ error: 'cannot change 42 auth password' });
    }

    if (!await fastify.verifyPassword(oldPassword, req.user.password_hash)) {
      return reply.code(403).send({ error: 'Access denied' });
    }

    if (await fastify.verifyPassword(newPassword, req.user.password_hash)) {
        return reply.code(400).send({error: "need too change the password" });
    }

    const validation = await fastify.validatePassword(newPassword);
    if (!validation.valid) {
      const message = await fastify.passwordFeedback(validation.errors);

      return reply.code(400).send({error: "Bad Request", code: "INVALID_PASSWORD_POLICY", message });
    }

    await fastify.updateUser(fastify.db, req.user.id, newPassword);
    return reply.send('User update successfully');
  });

  fastify.patch('/avatar', {preHandler: [fastify.auth]}, async (req, reply) => { // tester avec auth 42 // juste do it, make your dream come try, yes you can, nothing is impossible
    const body = req.body ?? {};
    const oldPassword = typeof body.oldPassword === 'string' ? body.oldPassword.trim() : '';

    if (!oldPassword) {
      return reply.code(400).send({ error: 'Missing or invalid field [username/password]' });
    }

    if (fastify.usernameEndsWith42(req.user.username)) {
      return reply.code(400).send({ error: 'cannot change 42 auth password' });
    }

    if (!await fastify.verifyPassword(oldPassword, req.user.password_hash)) {
      return reply.code(403).send({ error: 'Access denied' });
    }

    if (await fastify.verifyPassword(newPassword, req.user.password_hash)) {
        return reply.code(400).send({error: "need too change the password" });
    }

      return reply.code(400).send({error: "Bad Request", code: "INVALID_PASSWORD_POLICY", message });

    await fastify.updateUser(fastify.db, req.user.id, newPassword); // a cree pour avatar
    return reply.send('User update successfully');
  });

  fastify.delete('/:id(\\d+)', {preHandler: [fastify.auth]}, async (req, reply) => {
    const targetId = Number(req.params.id);

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
}
