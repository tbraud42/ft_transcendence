// env variable
import dotenv from 'dotenv';
dotenv.config();

// import fastify
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors'

// import crontab module
import cron from 'node-cron';

// import database function
import db from './database/db.js'
import {
  createUser,
  showUserByUsername,
  showUserById,
  updateUser,
  deleteUser,
  showAllData,
  clearDatabase,
  crontab
} from './database/manage.js';

import {
  getAllTournaments,
  getTournamentById,
  getTournamentByName,
  createTournament,
  updateTournament,
  deleteTournament,
  getParticipantsByTournamentId,
  addParticipant,
  updateParticipant,
  deleteParticipant
} from './database/tournaments.js';

// import routes
import twoFaRoute from './routes/auth/2fa.js';
import loginRoute from './routes/auth/login.js';
import signupRoutes from './routes/auth/signup.js';
import isLoginRoute from './routes/auth/isAuth.js';
import userRoutes from './routes/client/user.js';
import tournamentRoute from './routes/matchs/tournaments.js';
import tournamentClientRoute from './routes/matchs/tournaments_client.js';
import pingRoutes from './routes/ping.js';
import statRoutes from './routes/stat.js';

// importe all security function
import {
  generateToken,
  requireRole,
  authenticate,
  verifyPassword,
  allowSelfOrAdmin,
  validatePassword,
  passwordFeedback
} from './plugins/security.js'

import bcrypt from 'bcrypt'; // tmp pour clean database

const start = async () => {
  const fastify = Fastify({ logger: true });

  // trouver un moyen de changer tout sa ??
  fastify.decorate('db', db);
  fastify.decorate('createUser', createUser);
  fastify.decorate('showUserByUsername', showUserByUsername);
  fastify.decorate('showUserById', showUserById);
  fastify.decorate('updateUser', updateUser);
  fastify.decorate('deleteUser', deleteUser);
  fastify.decorate('showAllData', showAllData);
  fastify.decorate('clearDatabase', clearDatabase);
  fastify.decorate('getAllTournaments', getAllTournaments);
  fastify.decorate('getTournamentById', getTournamentById);
  fastify.decorate('getTournamentByName', getTournamentByName);
  fastify.decorate('createTournament', createTournament);
  fastify.decorate('updateTournament', updateTournament);
  fastify.decorate('deleteTournament', deleteTournament);
  fastify.decorate('getParticipantsByTournamentId', getParticipantsByTournamentId);
  fastify.decorate('addParticipant', addParticipant);
  fastify.decorate('updateParticipant', updateParticipant);
  fastify.decorate('deleteParticipant', deleteParticipant);
  fastify.decorate('generateToken', generateToken);
  fastify.decorate('requireRole', requireRole);
  fastify.decorate('authenticate', authenticate);
  fastify.decorate('verifyPassword', verifyPassword);
  fastify.decorate('allowSelfOrAdmin', allowSelfOrAdmin);
  fastify.decorate('validatePassword', validatePassword);
  fastify.decorate('passwordFeedback', passwordFeedback);
  fastify.decorate('stat', {
    request: 0,
    login: 0,
    signup: 0
  });

  fastify.addHook('onRequest', async (req, reply) => {
    fastify.stat.request++;
  });

  fastify.register(rateLimit, { // c'est drole
    max: 20,
    timeWindow: '1 minute'
  });

  await fastify.register(twoFaRoute, { prefix: '/auth/2fa' });
  await fastify.register(loginRoute, { prefix: '/auth/login' });
  await fastify.register(signupRoutes, { prefix: '/auth/signup' });
  await fastify.register(isLoginRoute, { prefix: '/auth/isAuth' });
  await fastify.register(userRoutes, { prefix: '/users' });
  await fastify.register(tournamentRoute, { prefix: '/tournaments' });
  await fastify.register(tournamentClientRoute, { prefix: '/tournaments' });
  await fastify.register(pingRoutes, { prefix: '/ping' });
  await fastify.register(statRoutes, { prefix: '/stat' });

  cron.schedule('0 0 0 * * *', () => crontab(fastify), { timezone: 'Europe/Paris' });

  const ADDRESS = '0.0.0.0';
  const PORT = process.env.DATABASE_PORT || 3000;

  try {
    await fastify.register(cors, {
      origin: (origin, cb) => {
        const isDev = process.env.NODE_ENV === 'development'

        if (isDev) {
          cb(null, true) // autorise tout en dev
        } else {
          const allowedOrigins = [
            `https://${process.env.VITE_DOMAIN}`,
            `https://www.${process.env.VITE_DOMAIN}`
          ]

          if (!origin || allowedOrigins.includes(origin)) {
            cb(null, true)
          } else {
            cb(new Error('Not allowed'), false)
          }
        }
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204
    })

    fastify.listen({ port: PORT, host: ADDRESS });
    // const username = 'admin';
    // const email = 'admin@example.com';
    // const password = 'supersecurepassword';

    // const password_hash = await bcrypt.hash(password, 10);

    // const insertUser = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
    // const result = insertUser.run(username, password_hash, 'admin'); // insert admin, tmp
    // fastify.db.prepare(`UPDATE users SET last_timestamp = datetime('now', '-2 years') WHERE id = ?`).run(2); // tmp pour test crontab


    console.log(`----------show time !----------\n`);
    await fastify.showAllData(fastify.db);
    console.log(`Server running on http://localhost:3000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();