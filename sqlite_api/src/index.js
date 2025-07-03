// env variable
import dotenv from 'dotenv';
dotenv.config();

// import fastify
import Fastify from 'fastify';
const fastify = Fastify({ logger: true });

// import plugins
import jwtPlugin from './plugins/jwt.js';

// import routes
import playerRoutes from './routes/players.js';
import matchRoutes from './routes/matches.js';
import loginRoutes from './routes/auth/login.js';

import db from './database/db.js'
import {
  createUser,
  showUser,
  updateUser,
  deleteUser,
} from './database/manage.js';

// ping route
fastify.get('/ping', async (request, reply) => {
  const ip = request.ip;
  reply.type('application/json').send({ message: 'pong', from: ip });
});

// secure routes with JWT
fastify.addHook('onRequest', async (request, reply) => {
  if (request.raw.url.startsWith('/auth')) return;
  if (request.raw.url.startsWith('/ping')) return;

  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

// DB test
const testDB = async (database) => {
  console.log('--- TEST ---');
  const userData = {
    username: 'temp_test_user_123',
    password_hash: 'hashed_password_123',
  };
  const created = await createUser(database, userData);
  let user;
  if (created.success) {
    user = created.user;
  } else {
    user = await showUser(database, userData.username);
    if (!user) {
      console.error('ERROR: test db failded');
      return;
    }
  }
  await updateUser(database, user.id, {
    username: 'updated_temp_user',
    password_hash: 'new_hash_456',
  });
  await deleteUser(database, user.id);
  console.log('--- TEST ---');
};

// start api
const ADDRESS = '0.0.0.0';
const PORT = process.env.DATABASE_PORT || 3000;

async function start() {
  try {
    await testDB(db);

    await fastify.register(jwtPlugin);
    await fastify.register(playerRoutes, { prefix: '/players' });
    await fastify.register(matchRoutes, { prefix: '/matches' });
    await fastify.register(loginRoutes, { prefix: '/auth' });

    await fastify.listen({ port: PORT, host: ADDRESS });
    console.log(`Start api on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
