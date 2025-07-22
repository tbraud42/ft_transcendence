// routes/stat.js
// | Method   | Route              | Description                            | Access           |
// | -------- | ------------------ | -------------------------------------- | ---------------- |
// | `GET`    | `/stat`            | show api's stats                       | Admin            |

export default async function (fastify, opts) {
  fastify.get('/', async (request, reply) => { // , {preHandler: [fastify.authenticate]} // a rajouter plus tard, because debug pour l'instant
    reply.type('application/json').send({ request: fastify.stat.request, login: fastify.stat.login, signup: fastify.stat.signup});
  });
}
