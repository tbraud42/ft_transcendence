// routes/client/userFriends.js
// | Method   | Route                  | Description                  | Access        |
// | -------- | ---------------------- | ---------------------------- | ------------- |
// | `GET`    | `/user/friends`        | List my friends              | Authenticated |
// | `POST`   | `/user/friends/:id`    | Add a friend                 | Authenticated |
// | `DELETE` | `/user/friends/:id`    | Remove a friend              | Authenticated |

export default async function (fastify, options) {
  fastify.get('/', { preHandler: [fastify.auth] }, async (req, reply) => {
    const friends = fastify.listFriends(fastify.db, req.user.id);
    return reply.send({ error: false, code: '', info: { friends } });
  });

  fastify.post('/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const friendId = Number(req.params.id);
    const friend = fastify.addFriend(fastify.db, req.user.id, friendId);
    return reply.send({ error: false, code: '', info: { friend } });
  });

  fastify.delete('/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const friendId = Number(req.params.id);
    const removed = fastify.removeFriend(fastify.db, req.user.id, friendId);
    if (!removed) {
      return reply.code(404).send({ error: true, code: 'USER_NOT_FRIENDS', info: 'Not friends' });
    }
    return reply.send({ error: false, code: '', info: 'friend delete' });
  });
}

// | Error                | Code                                  |
// | -------------------- | ------------------------------------- |
// | Not friends          | `USER_NOT_FRIENDS`                    |
