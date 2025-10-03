// routes/matchs/tournaments_client.js
// | Method   | Route                           | Description                  | Access                  |
// | -------- | ------------------------------- | ---------------------------- | ----------------------- |
// | `GET`    | `/tournaments/:id/user/:userId` | View tournament participants | Authenticated           |
// | `POST`   | `/tournaments/:id/user/:userId` | Join a tournament (register) | Authenticated           |
// | `PATCH`  | `/tournaments/:id/user/:userId` | Update score or rank         | Admin, creator          |
// | `DELETE` | `/tournaments/:id/user/:userId` | Remove a participant         | Admin, creator, or self |

export default async function (fastify, options) {
  fastify.get('/:id(\\d+)/user/:userId(\\d+)', {preHandler: [fastify.auth]}, async (req, reply) => {
    const tournament_id = Number(req.params.id);
    const user_id = Number(req.params.userId);

    const participant = fastify.db.prepare(`SELECT * FROM tournament_participants WHERE tournament_id = ? AND user_id = ?`).get(tournament_id, user_id);

    if (!participant) {
      return reply.code(404).send({ error: 'Participant not found' });
    }

    reply.send(participant);
  });

  fastify.post('/:id(\\d+)/user/:userId(\\d+)', { preHandler: [fastify.auth] }, async (req, reply) => {
    const tournament_id = Number(req.params.id);
    const user_id = Number(req.params.userId);

    const exists = fastify.db.prepare('SELECT 1 FROM tournament_participants WHERE tournament_id = ? AND user_id = ?').get(tournament_id, user_id);

    if (exists) {
      return reply.code(400).send({ error: 'Participant already in tournament' });
    }

    const info = fastify.db.prepare('INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?, ?)').run(tournament_id, user_id);

    return reply.code(201).send({ success: true, id: Number(info.lastInsertRowid) });
  });


  fastify.patch('/:id(\\d+)/user/:userId(\\d+)', {preHandler: [fastify.auth]}, async (req, reply) => { // verifier et rajotuer teste sur argument
    const tournament_id = Number(req.params.id);
    const user_id = Number(req.params.userId);
    const { score, rank } = req.body;

    const result = fastify.db.prepare(`UPDATE tournament_participants SET score = COALESCE(?, score), rank = COALESCE(?, rank) WHERE tournament_id = ? AND user_id = ?`).run(score, rank, tournament_id, user_id);
    if (result.changes === 0) {
      return reply.code(404).send({ error: 'Participant not found or no change' });
    }

    reply.send({ success: true });
  });

  fastify.delete('/:id(\\d+)/user/:userId(\\d+)', {preHandler: [fastify.auth]}, async (req, reply) => {
    const tournament_id = Number(req.params.id);
    const user_id = Number(req.params.userId);

    const result = fastify.db.prepare(`DELETE FROM tournament_participants WHERE tournament_id = ? AND user_id = ?`).run(tournament_id, user_id);
    if (result.changes === 0) {
      return reply.code(404).send({ error: 'Participant not found' });
    }

    reply.send({ success: true });
  });
}
