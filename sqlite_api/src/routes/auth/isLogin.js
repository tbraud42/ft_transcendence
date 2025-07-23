// routes/auth/isAuth.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `GET`    | `/isAuth`          | verif JWT token                        | Public           |

export default async function (fastify, options) {
  fastify.get('/', { preHandler: fastify.authenticate }, async (request, reply) => {
      return reply.send({ status: 'authenticated', user: request.user });
    }
  );
}
