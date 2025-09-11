// routes/stat.js
// | Method   | Route                      | Description                             | Access       |
// | -------- | -------------------------- | --------------------------------------- | ------------ |
// | `GET`    | `/stat`                    | show api's stats                        | Admin        |
// | `GET`    | `/stat/dashboard/:id`      | show user(id) stats for dashboard       | Admin + self |
// | `GET`    | `/stat/dashboard/perWin`   | show stats  dashboard per win           | Authenticate |
// | `GET`    | `/stat/dashboard/perLose`  | show stats dashboard per lose           | Authenticate |
// | `GET`    | `/stat/dashboard/perTime`  | show stats dashboard per time           | Authenticate |
// | `GET`    | `/stat/dashboard/perCreat` | show stats dashboard per creat          | Authenticate |
// | `GET`    | `/stat/dashboard/perTWin`  | show stats dashboard per tournament win | Authenticate |

export default async function (fastify, opts) {
  fastify.get('/', { preHandler: [fastify.auth] }, async (req, reply) => {
    const admin = fastify.isAdmin(fastify.db, req.user.id);
    if (!admin) return reply.code(403).send({ error: 'Access denied' });

    return reply.send({
      request: fastify.apiStat.request,
      login: fastify.apiStat.login,
      signup: fastify.apiStat.signup
    });
  });

  fastify.get('/dashboard/:id(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const id = Number(req.params.id);

    return reply.send(fastify.getStat(fastify.db, id));
  });

  fastify.get('/dashboard/perWin', { preHandler: [fastify.auth] }, async (req, reply) => {
    return reply.send(fastify.topWinRate(fastify.db));
  });

  fastify.get('/dashboard/perLose', { preHandler: [fastify.auth] }, async (req, reply) => {
    return reply.send(fastify.topLoseRate(fastify.db));
  });

  fastify.get('/dashboard/perTime', { preHandler: [fastify.auth] }, async (req, reply) => {
    return reply.send(fastify.topTotalPlayTime(fastify.db));
  });

  fastify.get('/dashboard/perCreat', { preHandler: [fastify.auth] }, async (req, reply) => {
    return reply.send(fastify.topTournamentsCreated(fastify.db));
  });

  fastify.get('/dashboard/perTWin', { preHandler: [fastify.auth] }, async (req, reply) => {
    return reply.send(fastify.topTournamentsWon(fastify.db));
  });
}

