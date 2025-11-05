// routes/client/user.js
// | Method   | Route                   | Description                                 | Access        |
// | -------- | ----------------------- | ------------------------------------------- | ------------- |
// | `GET`    | `/user/me`              | View a user's id                            | Authenticated |
// | `POST`   | `/user/:id`             | View a user's profile (id)                  | Authenticated |
// | `POST`   | `/user/username`        | View a user's profile (name)                | Authenticated |
// | `PATCH`  | `/user/pass`            | Update user info password                   | Self          |
// | `PATCH`  | `/user/avatar`          | Update user avatar                          | Self          |
// | `DELETE` | `/user/:id`             | Delete an account                           | Admin + self  |
// | `GET`    | `/user/:id/tournaments` | View tournaments a user has participated in | Admin + self  |

export default async function (fastify, options) {
  fastify.get('/me', { preHandler: [fastify.auth] }, async (req, reply) => {
    const user = await fastify.showUserById(fastify.db, req.user.id);
    if (!user) return reply.code(404).send({ error: true, code: 'USER_NOT_FOUND', info: 'User not found' });

    reply.send({ error: false, code: '', info: fastify.mapUserForSelfOrAdmin(user) });
  });


  fastify.post('/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const targetId = Number(req.params.id);
    if (!Number.isFinite(targetId)) {
      return reply.code(400).send({ error: true, code: 'USER_INVALID_ID', info: 'Invalid id' });
    }

    const user = await fastify.showUserById(fastify.db, targetId);
    if (!user) return reply.code(404).send({ error: true, code: 'USER_NOT_FOUND', info: 'User not found' });

    const isSelf = targetId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (isSelf || isAdmin) {
      return reply.send({ error: false, code: '', info: fastify.mapUserForSelfOrAdmin(user) });
    }

    return reply.send({ error: false, code: '', info: fastify.mapUserForPublic(user) });
  });

  fastify.post('/username', { preHandler: [fastify.auth] }, async (req, reply) => {
    const body = req.body ?? {};
    const username = typeof body.username === 'string' ? body.username.trim() : '';

    console.log(body)

    console.log("lalalalallalalalalla")
    console.log(username)
    const user = await fastify.showUserByUsername(fastify.db, username);
    if (!user) return reply.code(404).send({ error: true, code: 'USER_NOT_FOUND', info: 'User not found' });

    const isSelf = username === req.user.username;
    const isAdmin = req.user.role === 'admin';

    if (isSelf || isAdmin) {
      return reply.send({ error: false, code: '', info: fastify.mapUserForSelfOrAdmin(user) });
    }

    return reply.send({ error: false, code: '', info: fastify.mapUserForPublic(user) });
  });

  fastify.patch('/pass', {preHandler: [fastify.auth]}, async (req, reply) => {
    const body = req.body ?? {};
    const oldPassword = typeof body.oldPassword === 'string' ? body.oldPassword.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';

    if (fastify.usernameEndsWith42(req.user.username)) {
      return reply.code(403).send({ error: true, code: 'AUTH_42_PASSWORD_CHANGE_FORBIDDEN', info: 'Cannot change 42 auth password' });
    }

    if (!oldPassword || !newPassword) {
      return reply.code(400).send({ error: true, code: 'VALIDATION_MISSING_OR_INVALID_CREDENTIALS', info: 'Missing or invalid field [username/password]' });
    }

    if (!await fastify.verifyPassword(oldPassword, req.user.password_hash)) {
      return reply.code(403).send({ error: true, code: 'AUTH_ACCESS_DENIED', info: 'Access denied' });
    }

    if (await fastify.verifyPassword(newPassword, req.user.password_hash)) {
        return reply.code(400).send({ error: true, code: 'PASSWORD_CHANGE_REQUIRED', info: 'Need too change the password' });
    }

    const validation = await fastify.validatePassword(newPassword);
    if (!validation.valid) {
      const message = await fastify.passwordFeedback(validation.errors);

      return reply.code(400).send({ error: true, code: 'INVALID_PASSWORD_POLICY', info: 'Invalide password policy', message });
    }

    await fastify.updateUserPass(fastify.db, req.user.id, newPassword);
    return reply.send({ error: false, code: '', info: 'password update'});
  });

  fastify.patch('/avatar', {preHandler: [fastify.auth]}, async (req, reply) => {
    const body = req.body ?? {};
    const newAvatar = typeof body.avatar === 'string' ? body.avatar.trim() : '';

    if (!newAvatar) {
      return reply.code(400).send({ error: true, code: 'VALIDATION_MISSING_OR_INVALID_AVATAR', info: 'Missing or invalid field [avatar]' });
    }

    if (newAvatar.length > 1_398_102) {
      return reply.code(413).send({ error: true, code: 'AVATAR_TOO_LARGE', info: 'Avatar too large' });
    }

    await fastify.updateUserAvatar(fastify.db, req.user.id, newAvatar);
    return reply.send({ error: false, code: '', info: 'avatar update'});
  });

  fastify.delete('/:id(\\d+)', {preHandler: [fastify.auth]}, async (req, reply) => {
    const targetId = Number(req.params.id);

    if (targetId !== req.user.id && req.user.role !== 'admin') {
      return reply.code(403).send({ error: true, code: 'AUTH_ACCESS_DENIED', info: 'Access denied' });
    }

    await fastify.deleteUser(fastify.db, req.params.id);
    return reply.send({ error: false, code: '', info: 'delete sucesse'});
  });

  fastify.get('/:id(\\d+)/tournaments', {preHandler: [fastify.auth]}, async (req, reply) => {
    const targetId = Number(req.params.id);

    return reply.send({ error: false, code: '', info: fastify.listUserRecentMatches(fastify.db, targetId)});
  });
}

// | Error                                        | Code                                        |
// | -------------------------------------------- | ------------------------------------------- |
// | User not found                               | `USER_NOT_FOUND`                            |
// | Invalid id                                   | `USER_INVALID_ID`                           |
// | Cannot change 42 auth password               | `AUTH_42_PASSWORD_CHANGE_FORBIDDEN`         |
// | Missing or invalid field [username/password] | `VALIDATION_MISSING_OR_INVALID_CREDENTIALS` |
// | Access denied                                | `AUTH_ACCESS_DENIED`                        |
// | Need to change the password                  | `PASSWORD_CHANGE_REQUIRED`                  |
// | Invalide password policy                     | `INVALID_PASSWORD_POLICY`                   |
// | Missing or invalid field [avatar]            | `VALIDATION_MISSING_OR_INVALID_AVATAR`      |
// | Avatar too large                             | `AVATAR_TOO_LARGE`                          |
