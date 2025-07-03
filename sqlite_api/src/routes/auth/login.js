export default async function (fastify, opts) {
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body;

    // Remplace ceci par une vraie vérification utilisateur/BDD
    if (username === 'admin' && password === 'admin') {
      const token = fastify.jwt.sign({ user: username });
      return { token };
    } else {
      reply.code(401).send({ error: 'Invalid credentials' });
    }
  });
}
