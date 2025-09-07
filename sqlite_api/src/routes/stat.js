// routes/stat.js
// | Method   | Route              | Description                          | Access           |
// | -------- | ------------------ | ------------------------------------ | ---------------- |
// | `GET`    | `/stat`            | show api's stats                     | Admin            |
// | `GET`    | `/stat/dashboard`  | show tounrnament stats for dashboard | Authenticate     |

export default async function (fastify, opts) {
  fastify.get('/', { preHandler: [fastify.auth] }, async (req, reply) => {
    const admin = fastify.isAdmin(fastify.db, req.user.id);
    if (!admin) return reply.code(403).send({ error: 'Access denied' });

    return reply.send({
      request: fastify.apiStat.request,
      login: fastify.apiStat.login,
      signup: fastify.apiStat.signup
    });
  });

  fastify.get('/dashboard', { preHandler: [fastify.auth] }, async (req, reply) => {
    // do dashboard
  });
}
