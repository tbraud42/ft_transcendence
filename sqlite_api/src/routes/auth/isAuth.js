// routes/auth/isAuth.js
// | Method   | Route              | Description                | Access           |
// | -------- | ------------------ | -------------------------- | ---------------- |
// | `GET`    | `/auth/isAuth`     | verif JWT token            | Authenticated    |

export default async function (fastify, options) {
  fastify.get('/', { preHandler: [fastify.auth] }, async (req, reply) => {
    fastify.updateTimeStamp(fastify.db, req.user.id);
    return reply.send({
      status: 'authenticated',
      user: {
        id: req.user.id,
        username: req.user.username,
        password_hash: 'Not displayed for security reasons',
        role: req.user.role,
        created_at: req.user.created_at,
        last_timestamp : req.user.last_timestamp,
      },
    });
  });
}
