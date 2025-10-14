// routes/auth/isAuth.js
// | Method   | Route              | Description                | Access        |
// | -------- | ------------------ | -------------------------- | ------------- |
// | `GET`    | `/auth/isAuth`     | verif JWT token            | Authenticated |

export default async function (fastify, options) {
  fastify.get('/', { preHandler: [fastify.auth] }, async (req, reply) => {
    const user = fastify.showUserById(fastify.db, req.user.id);
    return reply.send({
      status: 'authenticated',
      user: fastify.mapUserForSelfOrAdmin(user)
    });
  });
}
