export default async function (fastify, opts) {
  fastify.get('/players', async (request, reply) => {
    // retourne tous les joueurs
  });

  fastify.post('/players', async (request, reply) => {
    // ajoute un joueur
  });
}
