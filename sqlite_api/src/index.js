// env variable
import dotenv from 'dotenv';
dotenv.config();

// import fastify
import Fastify from 'fastify';

// import jwt secrets
import jwtPlugin from './plugins/jwt.js';

// import routes
import loginRoute from './routes/auth/login.js';
import matchRoutes from './routes/matches.js';
import playerRoutes from './routes/players.js';
import pingRoutes from './routes/ping.js';

const start = async () => {
  const fastify = Fastify({ logger: true });
  await fastify.register(jwtPlugin);

  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  await fastify.register(loginRoute, { prefix: '/auth' });
  await fastify.register(matchRoutes, { prefix: '/matches' });
  await fastify.register(playerRoutes, { prefix: '/players' });
  await fastify.register(pingRoutes, { prefix: '/ping' });

  const ADDRESS = '0.0.0.0';
  const PORT = process.env.DATABASE_PORT || 3000;

  try {
    await fastify.listen({ port: PORT, host: ADDRESS });
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("fastify.jwt dans /auth ?", typeof fastify.jwt);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); // ← sans ça, ton register ne fonctionne pas comme tu crois !
