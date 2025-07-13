// env variable
import dotenv from 'dotenv';
dotenv.config();

// import fastify
import Fastify from 'fastify';

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
import signupRoutes from './routes/auth/signup.js';
import isLoginRoute from './routes/auth/isLogin.js';
import pingRoutes from './routes/ping.js';
// import googleRoutes from './routes/auth/google.js';
// import userRoutes from './routes/client/user.js';
// import googleRoutes from './routes/matchs/tournaments';
// import googleRoutes from './routes/matchs/tournaments_client';

// importe all fastify.decorate function
import {
  generateToken,
  requireRole,
  authenticate,
  verifyPassword,
  allowSelfOrAdmin
} from './routes/plugins/security.js'

const start = async () => {
  const fastify = Fastify({ logger: true });

  // trouver un moyen de changer tout sa
  fastify.decorate('db', db);
  fastify.decorate('createUser', createUser);
  fastify.decorate('showUser', showUser);
  fastify.decorate('updateUser', updateUser);
  fastify.decorate('deleteUser', deleteUser);
  fastify.decorate('showAllData', showAllData);
  fastify.decorate('clearDatabase', clearDatabase);
  fastify.decorate('generateToken', generateToken);
  fastify.decorate('requireRole', requireRole);
  fastify.decorate('authenticate', authenticate);
  fastify.decorate('verifyPassword', verifyPassword);
  fastify.decorate('allowSelfOrAdmin', allowSelfOrAdmin);

  // await fastify.register(googleRoutes, { prefix: '/google' });
  await fastify.register(loginRoute, { prefix: '/auth/login' });
  await fastify.register(signupRoutes, { prefix: '/auth/signup' });
  await fastify.register(isLoginRoute, { prefix: '/auth/isLogin' });
  await fastify.register(pingRoutes, { prefix: '/ping' });

  const ADDRESS = '0.0.0.0';
  const PORT = process.env.DATABASE_PORT || 3000;

  try {
    fastify.listen({ port: PORT, host: ADDRESS });
    await fastify.clearDatabase(fastify.db); // clear all data, remove for futur
    // await fastify.createUser(fastify.db, { username: 'admin', password: 'pass123'});
    // await fastify.createUser(fastify.db, { username: 'tao', password: 'test'});
    // await fastify.createUser(fastify.db, { username: 'toto', password: 'fesse'});
    console.log(`----------show time !----------\n`);
    await fastify.showAllData(fastify.db);
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

/**
 * Enregistrement des routes de l'API, chacune avec un préfixe dédié :
 * - /auth/login     : connexion d'un utilisateur (authentification classique).
 * - /auth/signup    : création d'un nouvel utilisateur.
 * - /auth/isLogin   : vérification du statut d'authentification via JWT.
 * - /matches        : gestion des matchs (création, mise à jour, consultation). À revoir si nécessaire.
 * - /players        : gestion des joueurs (profils, stats, recherche...).
 * - /ping           : route de test pour vérifier que le serveur répond correctement.
 *
 * // - /auth/google  : (désactivé pour le moment) authentification via Google OAuth2.
 */


import axios from 'axios';

const API_URL = 'http://localhost:3000';

const user = {
  username: 'testuser',
  password: 'testpass'
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
