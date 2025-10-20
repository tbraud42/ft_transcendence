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
      return reply.send({ user: fastify.mapUserForSelfOrAdmin(user) });
    }

    return reply.send({ user: fastify.mapUserForPublic(user) });
  });

  fastify.patch('/pass', {preHandler: [fastify.auth]}, async (req, reply) => {
    const body = req.body ?? {};
    const oldPassword = typeof body.oldPassword === 'string' ? body.oldPassword.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (fastify.usernameEndsWith42(req.user.username)) {
      return reply.code(403).send({ error: 'Cannot change 42 auth password' });
    }

    if (!oldPassword || !newPassword) {
      return reply.code(400).send({ error: 'Missing or invalid field [username/password]' });
    }

    if (!await fastify.verifyPassword(oldPassword, req.user.password_hash)) {
      return reply.code(403).send({ error: 'Access denied' });
    }

    if (await fastify.verifyPassword(newPassword, req.user.password_hash)) {
        return reply.code(400).send({error: "Need too change the password" });
    }

    const validation = await fastify.validatePassword(newPassword);
    if (!validation.valid) {
      const message = await fastify.passwordFeedback(validation.errors);

      return reply.code(400).send({ error: "Invalide password policy", message });
    }

    await fastify.updateUserPass(fastify.db, req.user.id, newPassword);
    return reply.send('User update successfully');
  });

  fastify.patch('/avatar', {preHandler: [fastify.auth]}, async (req, reply) => {
    const body = req.body ?? {};
    const newAvatar = typeof body.avatar === 'string' ? body.avatar.trim() : '';

    if (!newAvatar) {
      return reply.code(400).send({ error: 'Missing or invalid field [avatar]' });
    }

    if (newAvatar.length > 1_398_102) {
      return reply.code(413).send({ error: 'Avatar too large' });
    }

    await fastify.updateUserAvatar(fastify.db, req.user.id, newAvatar);
    return reply.send({ success: true });
  });

  fastify.delete('/:id(\\d+)', {preHandler: [fastify.auth]}, async (req, reply) => {
    const targetId = Number(req.params.id);

    if (targetId !== req.user.id && req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Access denied' });
    }

    await fastify.deleteUser(fastify.db, req.params.id);
    return reply.send({ success: true });
  });

  fastify.get('/:id(\\d+)/tournaments', {preHandler: [fastify.auth]}, async (req, reply) => {
    const targetId = Number(req.params.id);

    if (targetId !== req.user.id && req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Access denied' });
    }

    return reply.send(fastify.listUserRecentMatches(fastify.db, targetId));
  });
}
