// routes/auth/isAuth.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `GET`    | `/auth/isAuth`     | verif JWT token                        | Public           |

export default async function (fastify, options) {
  fastify.get('/', { preHandler: fastify.authenticate(fastify) }, async (req, reply) => {
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
