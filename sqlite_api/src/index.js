// src/index.js
import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';

// Import plugins
import jwtPlugin from './plugins/jwt.js';

// Import routes
import playerRoutes from './routes/players.js';
import matchRoutes from './routes/matches.js';
import loginRoutes from './routes/auth/login.js';

const fastify = Fastify({ logger: true });

// Register plugins
await fastify.register(jwtPlugin);

// Register routes with prefixes
await fastify.register(loginRoutes, { prefix: '/auth' });
await fastify.register(playerRoutes, { prefix: '/players' });
await fastify.register(matchRoutes, { prefix: '/matches' });

// Misc route
fastify.get('/ping', async (request, reply) => {
  return { message: 'pong' + !!process.env.JWT_SECRET};
});

// Start server
const ADDRESS = '0.0.0.0';
const PORT = process.env.DATABASE_PORT || 3000;

async function start() {
  try {
    await fastify.listen({ port: PORT, host: ADDRESS });
    console.log(`Start api on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

fastify.addHook('onRequest', async (request, reply) => {
  if (request.raw.url.startsWith('/auth')) return;
  if (request.raw.url.startsWith('/ping')) return;
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});
