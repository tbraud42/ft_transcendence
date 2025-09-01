// routes/matchs/tournaments_client.js
// | Method   | Route                                   | Description                  | Access                      |
// | -------- | --------------------------------------- | ---------------------------- | --------------------------- |
// | `GET`    | `/tournaments/:id/participants/:userId` | View tournament participants | Authenticated               |
// | `POST`   | `/tournaments/:id/participants/:userId` | Join a tournament (register) | Authenticated               |
// | `PATCH`  | `/tournaments/:id/participants/:userId` | Update score or rank         | Admin, creator              |
// | `DELETE` | `/tournaments/:id/participants/:userId` | Remove a participant         | Admin, creator, or self     |

export default async function (fastify, options) {
  fastify.get('/:id(\\d+)/participants/:userId(\\d+)', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const id = Number(req.params.id);
    const user_id = Number(req.params.user_id);

    const participant = fastify.db.prepare(`SELECT * FROM tournament_participants WHERE tournament_id = ? AND user_id = ?`).get(tournament_id, user_id);

    if (!participant) {
      return reply.code(404).send({ error: 'Participant not found' });
    }

    reply.send(participant);
  });

  fastify.post('/:id(\\d+)/participants/:userId(\\d+)', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const id = Number(req.params.id);
    const user_id = Number(req.params.user_id);

    try {
      const insert = fastify.db.prepare(`INSERT INTO tournament_participants (tournament_id, user_id) VALUES (?, ?)`).run(tournament_id, user_id);

      reply.code(201).send({ success: true, id: insert.lastInsertRowid });
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return reply.code(400).send({ error: 'User already joined or invalid foreign key' });
      }

      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.patch('/:id(\\d+)/participants/:userId(\\d+)', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const id = Number(req.params.id);
    const user_id = Number(req.params.user_id);
    const { score, rank } = req.body;

    const result = fastify.db.prepare(`UPDATE tournament_participants SET score = COALESCE(?, score), rank = COALESCE(?, rank) WHERE tournament_id = ? AND user_id = ?`).run(score, rank, tournament_id, user_id);
    if (result.changes === 0) {
      return reply.code(404).send({ error: 'Participant not found or no change' });
    }

    reply.send({ success: true });
  });

  fastify.delete('/:id(\\d+)/participants/:userId(\\d+)', {preHandler: [fastify.authenticate(fastify)]}, async (req, reply) => {
    const id = Number(req.params.id);
    const user_id = Number(req.params.user_id);

    const result = fastify.db.prepare(`DELETE FROM tournament_participants WHERE tournament_id = ? AND user_id = ?`).run(tournament_id, user_id);
    if (result.changes === 0) {
      return reply.code(404).send({ error: 'Participant not found' });
    }

    reply.send({ success: true });
  });
}
