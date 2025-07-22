// routes/client/user.js
// | Method   | Route                    | Description                                 | Access       |
// | -------- | ------------------------ | ------------------------------------------- | ------------ |
// | `GET`    | `/users/:id`             | View a user's profile                       | Admin + self |
// | `PATCH`  | `/users/:id`             | Update user info (password, username, etc.) | Self         | // + admin ??
// | `DELETE` | `/users/:id`             | Delete an account                           | Admin + self |
// | `GET`    | `/users/:id/tournaments` | View tournaments a user has participated in | Admin + self |

export default async function (fastify, options) {
  fastify.get('/:id', {preHandler: [fastify.authenticate, fastify.allowSelfOrAdmin]}, async (req, reply) => {
    const user = fastify.showUser(fastify.db, req.params.id);
    if (!user) return reply.code(404).send({ error: 'User not found' });
    reply.send(user);
  });

  fastify.patch('/:id', {preHandler: [fastify.authenticate, fastify.allowSelfOrAdmin]}, async (req, reply) => {
    const { username, password } = req.body;
    await fastify.updateUser(fastify.db, req.params.id, { username, password });
    reply.send({ success: true });
  });

  fastify.delete('/:id', {preHandler: [fastify.authenticate, fastify.requireRole('admin')]}, async (req, reply) => {
    await fastify.deleteUser(fastify.db, req.params.id);
    reply.send({ success: true });
  });

  fastify.get('/:id/tournaments', {preHandler: [fastify.authenticate, fastify.allowSelfOrAdmin]}, async (req, reply) => {
    const tournaments = await fastify.db.prepare(
      `SELECT * FROM tournaments WHERE user_id = ?`
    ).all(req.params.id); // facoriser dans manage.js ?

    reply.send(tournaments);
  });
}
