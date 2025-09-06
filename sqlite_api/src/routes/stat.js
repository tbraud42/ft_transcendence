// routes/stat.js
// | Method   | Route              | Description                        | Access           |
// | -------- | ------------------ | ---------------------------------- | ---------------- |
// | `GET`    | `/stat`            | show api's stats                   | Admin            |

export default async function (fastify, opts) {
  fastify.get('/', { preHandler: [fastify.auth] }, async (req, reply) => {
    const admin = fastify.isAdmin(fastify.db, req.user.id);
    if (!admin) return reply.code(403).send({ error: 'Access denied' });

    return reply.send({
      request: fastify.stat.request,
      login: fastify.stat.login,
      signup: fastify.stat.signup
    });
  });
}

