// routes/auth/refreshAuth.js
// | Method   | Route               | Description               | Access           |
// | -------- | ------------------- | ------------------------- | ---------------- |
// | `GET`    | `/auth/refreshAuth` | refresh JWT token         | Authenticated    |

export default async function (fastify, options) {
  fastify.get('/', { preHandler: [fastify.auth] }, async (req, reply) => {
    fastify.setJwtIAT(fastify.db, req.user.id);
      const token = fastify.generateToken({ id: req.user.id, username: req.user.username, role: req.user.role, iat: Math.floor(Date.now() / 1000) }, true, '12h');

      return reply.send({ error: false, code: '', info: { token: token } });
  });
}
