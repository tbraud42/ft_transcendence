// routes/auth/refreshAuth.js
// | Method   | Route               | Description               | Access           |
// | -------- | ------------------- | ------------------------- | ---------------- |
// | `GET`    | `/auth/refreshAuth` | refresh JWT token         | Authenticated    |

export default async function (fastify, options) {
  fastify.get('/', { preHandler: [fastify.auth] }, async (req, reply) => {
      const token = fastify.generateToken({id: req.user.id, username: req.user.username, role: req.user.role, }, true, '12h');

      return reply.send({ token });
  });
}
