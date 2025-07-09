// env variable
import dotenv from 'dotenv';
dotenv.config();

// import fastify
import Fastify from 'fastify';

// import jwt secrets
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
// const jwtSecret = await getSecretFromVault('jwt-secret-key'); // pour import cle JWT depuis vault

// import verif mdp
import bcrypt from 'bcrypt';

// import database
import db from './database/db.js'
import {
  createUser,
  showUser,
  updateUser,
  deleteUser,
  showAllData,
  clearDatabase,
} from './database/manage.js';

// import routes
import loginRoute from './routes/auth/login.js';
import matchRoutes from './routes/matches.js';
import playerRoutes from './routes/players.js';
import pingRoutes from './routes/ping.js';

const start = async () => {
  const fastify = Fastify({ logger: true });

  fastify.decorate('db', db);
  fastify.decorate('createUser', createUser);
  fastify.decorate('showUser', showUser);
  fastify.decorate('updateUser', updateUser);
  fastify.decorate('deleteUser', deleteUser);
  fastify.decorate('showAllData', showAllData);
  fastify.decorate('clearDatabase', clearDatabase);

  fastify.decorate('generateToken', (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  });

  fastify.decorate('authenticate', async function (request, reply) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      request.user = decoded;
    } catch (err) {
      reply.code(401).send({ error: 'Invalid token', message: err.message });
    }
  });

  fastify.decorate('verifyPassword', async function (password, hashedPassword) {
    const isValid = await bcrypt.compare(password, hashedPassword);
    return isValid;
  });

  await fastify.register(loginRoute, { prefix: '/auth' });
  await fastify.register(matchRoutes, { prefix: '/matches' });
  await fastify.register(playerRoutes, { prefix: '/players' });
  await fastify.register(pingRoutes, { prefix: '/ping' });

  const ADDRESS = '0.0.0.0';
  const PORT = process.env.DATABASE_PORT || 3000;

  try {
    await fastify.listen({ port: PORT, host: ADDRESS });
    fastify.clearDatabase(fastify.db);
    fastify.createUser(fastify.db, { username: 'admin', password: 'pass123'});
    fastify.createUser(fastify.db, { username: 'tao', password: 'test'});
    fastify.createUser(fastify.db, { username: 'toto', password: 'fesse'});
    fastify.showAllData(fastify.db);
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
