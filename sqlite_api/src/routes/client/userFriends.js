// routes/client/userFriends.js
// | Method   | Route                  | Description                  | Access        |
// | -------- | ---------------------- | ---------------------------- | ------------- |
// | `GET`    | `/user/friends`        | List my friends              | Authenticated |
// | `POST`   | `/user/friends/:id`    | Add a friend                 | Authenticated |
// | `DELETE` | `/user/friends/:id`    | Remove a friend              | Authenticated |

export default async function (fastify, options) {
  fastify.get('/friends', { preHandler: [fastify.auth] }, async (req, reply) => {
    const friends = fastify.listFriends(fastify.db, req.user.id);
    return reply.send(friends);
  });

  fastify.post('/friends/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const friendId = Number(req.params.id);
    const friend = fastify.addFriend(fastify.db, req.user.id, friendId);
    return reply.code(201).send(friend); // 201 creat si ok
  });

  fastify.delete('/friends/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const friendId = Number(req.params.id);
    const removed = fastify.removeFriend(fastify.db, req.user.id, friendId);
    if (!removed) {
      return reply.code(404).send({ error: 'Not friends' });
    }
    return reply.send({ success: true });
  });
}
