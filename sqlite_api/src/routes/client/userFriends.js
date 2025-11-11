// routes/client/userFriends.js
// | Method   | Route                  | Description                  | Access        |
// | -------- | ---------------------- | ---------------------------- | ------------- |
// | `GET`    | `/user/friends`        | List my friends              | Authenticated |
// | `POST`   | `/user/friends/:id`    | Add a friend                 | Authenticated |
// | `DELETE` | `/user/friends/:id`    | Remove a friend              | Authenticated |

export default async function (fastify, options) {
  fastify.get('/', { preHandler: [fastify.auth] }, async (req, reply) => {
    const friends = fastify.listFriends(fastify.db, req.user.id);
    const pending = fastify.pendingFriends(fastify.db, req.user.id);
    return reply.send({ error: false, code: '', info: { friends, pending } });
  });

  fastify.post('/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const friendId = Number(req.params.id);
    if (friendId === req.user.id) {
      return reply.code(200).send({ error: true, code: 'USER_INVALID_ID', info: 'id must be different of yours' });
    }

    const friend = fastify.addFriend(fastify.db, req.user.id, friendId);
    if (friend.error === true) {
      switch (friend.msg) {
        case 'unknowUser':
          return reply.code(200).send({ error: true, code: 'USER_INVALID_ID', info: 'unknow user id' });
        case 'alreadyFriend':
          return reply.code(200).send({ error: true, code: 'USER_ALREADY_FRIEND', info: 'user already friend' });
        case 'friendLimit':
          return reply.code(200).send({ error: true, code: 'MAX_FRIEND_LIMIT', info: 'limit friend hit' });
      }
    }

    return reply.send({ error: false, code: '', info: { } });
  });

  fastify.delete('/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const friendId = Number(req.params.id);
    if (friendId === req.user.id) {
      return reply.code(200).send({ error: true, code: 'USER_INVALID_ID', info: 'id must be different of yours' });
    }

    const removed = fastify.removeFriend(fastify.db, req.user.id, friendId);
    if (!removed) {
      return reply.code(200).send({ error: true, code: 'USER_NOT_FRIENDS', info: 'Not friends' });
    }

    return reply.send({ error: false, code: '', info: 'friend delete' });
  });
}

// | Error                | Code                                  |
// | -------------------- | ------------------------------------- |
// | invalide id          | `USER_INVALID_ID`                     |
// | already friend       | `USER_ALREADY_FRIEND`                 |
// | limit friend hit     | `MAX_FRIEND_LIMIT`                    |
// | Not friends          | `USER_NOT_FRIENDS`                    |
