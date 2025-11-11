// routes/auth/login.js
// | Method   | Route              | Description                        | Access           |
// | -------- | ------------------ | ---------------------------------- | ---------------- |
// | `POST`   | `/auth/logout`     | logout                             | Authenticate     |

export default async function (fastify, options) {
  fastify.post('/', { preHandler: [fastify.auth] }, async (req, reply) => {
    fastify.logout(fastify.db, req.user.id);
    return reply.send({ error: false, code: '', info: {} });
  });
}
