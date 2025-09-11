// routes/ping.js
// | Method   | Route              | Description                 | Access           |
// | -------- | ------------------ | --------------------------- | ---------------- |
// | `GET`    | `/ping`            | reply ping by pong          | Public           |

export default async function (fastify, opts) {
  fastify.get('/', { logLevel: 'silent' }, async (req, reply) => {
    const ip = req.ip;
    reply.type('application/json').send({ message: 'pong', from: ip });
  });
}
