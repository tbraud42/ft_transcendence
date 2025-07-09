// routes/auth/login.js
export default async function (fastify, options) {
  fastify.post('/', async (request, reply) => {
    const { username, password } = request.body;

    if (username === 'admin' && password === 'pass123') {
      const token = fastify.generateToken({ username });
      return reply.send({ token });
    }

    return reply.status(401).send({ error: 'Invalid credentials' });
  });
} // pas encorez connecter a la db
