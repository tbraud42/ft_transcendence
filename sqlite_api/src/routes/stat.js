// routes/stat.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `GET`    | `/stat`            | show api's stats                       | Admin            |

export default async function (fastify, opts) {
  fastify.get('/', async (req, reply) => { // , {preHandler: [fastify.authenticate(fastify)]} // add after + admin
    reply.type('application/json').send({ request: fastify.stat.request, login: fastify.stat.login, signup: fastify.stat.signup});
  });
}
