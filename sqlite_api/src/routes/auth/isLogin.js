// routes/auth/isAuth.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `GET`    | `/auth/isAuth`     | verif JWT token                        | Public           |

export default async function (fastify, options) {
  fastify.get('/', { preHandler: fastify.authenticate(fastify) }, async (req, reply) => {
      return reply.send({ status: 'authenticated', user: req.user });
    }
  );
}
