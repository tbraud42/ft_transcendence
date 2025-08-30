// routes/stat.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `GET`    | `/stat`            | show api's stats                       | Admin            |

export default async function (fastify, opts) {
  fastify.get('/' , {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    if (fastify.isAdmin(fastify.db, req.user.id)) {
      return reply.code(403).send({ error: 'Access denied' });
    }

    reply.type('application/json').send({ request: fastify.stat.request, login: fastify.stat.login, signup: fastify.stat.signup});
  });
}
