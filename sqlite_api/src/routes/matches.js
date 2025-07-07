// routes/matches.js
export default async function (fastify, opts) {
  fastify.get('/', { preHandler: fastify.authenticate }, async (request, reply) => {
    // retourne tous les joueurs
  });

  fastify.post('/', { preHandler: fastify.authenticate }, async (request, reply) => {
    // ajoute un joueur
  });
}
