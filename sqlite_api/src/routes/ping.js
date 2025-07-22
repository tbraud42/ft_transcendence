// routes/ping.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `GET`    | `/ping`            | reply ping by pong                     | Public           |

export default async function (fastify, opts) {
  fastify.get('/', async (request, reply) => {
    const ip = request.ip;
    reply.type('application/json').send({ message: 'pong', from: ip });
  });
}
