// routes/matchs/tournamentsUser.js
// | Method   | Route                           | Description                   | Access           |
// | -------- | ------------------------------- | ----------------------------- | ---------------- |
// | `GET`    | `/tournaments/user/id`          | View user last match          | Authenticated    |
// | `GET`    | `/tournaments/:id/participants` | View user last match          | Authenticated    |

export default async function (fastify, options) {
  fastify.get('/tournaments/user/:id(\\d+)', { preHandler: [fastify.auth, fastify.allowSelfOrAdmin()] }, async (req, reply) => {
    const targetId = Number(req.params.id);
    const limit = req.query?.limit !== undefined ? Number(req.query.limit) : 20;

    const rows = listUserRecentMatches(fastify.db, targetId, limit);

    const data = rows.map(r => ({
      game_id: r.game_id,
      tournament_id: r.tournament_id,
      opponent: { id: r.opponent_id, username: r.opponent_username },
      score: { you: r.your_score, opp: r.opp_score },
      winner_id: r.winner_id,
      did_win: !!r.did_win,
      started_at: r.started_at
    }));

    reply.send(data);
  });

  fastify.get('/tournaments/:id/participants', { preHandler: [fastify.auth] }, async (req, reply) => {
    const id = Number(req.params.id);
    const result = fastify.db.prepare(`
      SELECT username
      FROM v_tournament_participants
      WHERE tournament_id = ?
      ORDER BY username COLLATE NOCASE`).all(id);

    reply.send(result);
  });

}
