// routes/client/userFriends.js
// | Method   | Route                   | Description                                 | Access        |
// | -------- | ----------------------- | ------------------------------------------- | ------------- |
// | `GET`    | `/user/me`              | View a user's id                            | Authenticated |

export default async function (fastify, options) {
  fastify.get('/me', { preHandler: [fastify.auth] }, async (req, reply) => {
    reply.send(req.user.id);
  });
}
