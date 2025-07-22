// env variable
import dotenv from 'dotenv';
dotenv.config();

// import fastify
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';

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

import {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  isTournamentCreator, // ici fonction utiliser en prehandler, changemement de fichier ?
  getParticipantsByTournamentId,
  addParticipant,
  updateParticipant,
  deleteParticipant
} from './database/tournaments.js';

// import routes
import loginRoute from './routes/auth/login.js';
import signupRoutes from './routes/auth/signup.js';
import isLoginRoute from './routes/auth/isLogin.js';
import userRoutes from './routes/client/user.js';
import tournamentRoute from './routes/matchs/tournaments.js';
import tournamentClientRoute from './routes/matchs/tournaments_client.js';
import pingRoutes from './routes/ping.js';
import statRoutes from './routes/stat.js';
// import googleRoutes from './routes/auth/google.js';
// import tournamentsRoutes from './routes/matchs/tournaments';
// import tournaments_clientRoutes from './routes/matchs/tournaments_client';

// importe all fastify.decorate function
import {
  generateToken,
  requireRole,
  authenticate,
  verifyPassword,
  allowSelfOrAdmin
} from './plugins/security.js'

import bcrypt from 'bcrypt';

const start = async () => {
  const fastify = Fastify({ logger: true });

  // trouver un moyen de changer tout sa ??
  fastify.decorate('db', db);
  fastify.decorate('createUser', createUser);
  fastify.decorate('showUser', showUser);
  fastify.decorate('updateUser', updateUser);
  fastify.decorate('deleteUser', deleteUser);
  fastify.decorate('showAllData', showAllData);
  fastify.decorate('clearDatabase', clearDatabase);
  fastify.decorate('getAllTournaments', getAllTournaments);
  fastify.decorate('getTournamentById', getTournamentById);
  fastify.decorate('createTournament', createTournament);
  fastify.decorate('updateTournament', updateTournament);
  fastify.decorate('deleteTournament', deleteTournament);
  fastify.decorate('isTournamentCreator', isTournamentCreator);
  fastify.decorate('getParticipantsByTournamentId', getParticipantsByTournamentId);
  fastify.decorate('addParticipant', addParticipant);
  fastify.decorate('updateParticipant', updateParticipant);
  fastify.decorate('deleteParticipant', deleteParticipant);
  fastify.decorate('generateToken', generateToken);
  fastify.decorate('requireRole', requireRole);
  fastify.decorate('authenticate', authenticate);
  fastify.decorate('verifyPassword', verifyPassword);
  fastify.decorate('allowSelfOrAdmin', allowSelfOrAdmin);
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


  // await fastify.register(googleRoutes, { prefix: '/google' });
  await fastify.register(loginRoute, { prefix: '/auth/login' });
  await fastify.register(signupRoutes, { prefix: '/auth/signup' });
  await fastify.register(isLoginRoute, { prefix: '/auth/isLogin' });
  await fastify.register(userRoutes, { prefix: '/users' });
  await fastify.register(tournamentRoute, { prefix: '/tournaments' });
  await fastify.register(tournamentClientRoute, { prefix: '/tournaments' });
  await fastify.register(pingRoutes, { prefix: '/ping' });
  await fastify.register(statRoutes, { prefix: '/stat' });

  const ADDRESS = '0.0.0.0';
  const PORT = process.env.DATABASE_PORT || 3000;

  try {
    fastify.listen({ port: PORT, host: ADDRESS });
    await fastify.clearDatabase(fastify.db); // clear all data, remove for futur
    const username = 'admin';
    const email = 'admin@example.com';
    const password = 'supersecurepassword';

    const password_hash = await bcrypt.hash(password, 10);

    const insertUser = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
    const result = insertUser.run(username, password_hash, 'admin'); // insert admin, tmp

    console.log(`----------show time !----------\n`);
    await fastify.showAllData(fastify.db);
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// ----------test auth---------------
import axios from 'axios';

const API_URL = 'http://localhost:3000';

const user = {
  username: 'testuser',
  password: 'Testpass1@'
};

let token = '';
let createdPlayerId = null;

async function signup() {
  try {
    const res = await axios.post(`${API_URL}/auth/signup`, user);
    token = res.data.token;
    console.log('✅ Login success. Token reçu :', token);
  } catch (err) {
    console.error('❌ Échec du login :', err.response?.data || err.message);
  }
}

async function isAuthenticated() {
  try {
    const res = await axios.get(`${API_URL}/auth/isLogin`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Authentifié :', res.data);
  } catch (err) {
    console.error('❌ Auth invalide :', err.response?.data || err.message);
  }
}

async function runAllTests() {
  console.log('\n🔐 LOGIN ET AUTH TEST\n');
  await signup();
  await isAuthenticated();
}

runAllTests();
