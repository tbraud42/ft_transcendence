import db from './database/db.js'
import {
  createUser,
  showUserByUsername,
  showUserById,
  updateUser,
  deleteUser,
  isAdmin,
  isAdminOrCreator,
  showAllData
} from './database/manage.js';

import {
  getAllTournaments,
  getTournamentById,
  getTournamentByName,
  createTournament,
  changeTournamentStatus,
  getTournamentsByStatus,
  updateTournament,
  deleteTournament,
  getParticipantsByTournamentId,
  addParticipant,
  updateParticipant,
  deleteParticipant
} from './database/tournaments.js';

import {
  generateToken,
  requireRole,
  authenticate,
  verifyPassword,
  allowSelfOrAdmin,
  validatePassword,
  passwordFeedback,
  usernameEndsWith42
} from './plugins/security.js'

export function loadDecorate(fastify) {
  // --- DB ---
  fastify.decorate('db', db);
  fastify.addHook('onClose', (app, done) => {
    try { fastify.db?.close?.(); } catch (e) { app.log?.error(e, 'DB close failed'); }
    done();
  });
  fastify.decorate('showAllData', showAllData);

  // --- Users  ---
  fastify.decorate('createUser', createUser);
  fastify.decorate('showUserByUsername', showUserByUsername);
  fastify.decorate('showUserById', showUserById);
  fastify.decorate('updateUser', updateUser);
  fastify.decorate('deleteUser', deleteUser);
  fastify.decorate('isAdmin', isAdmin);
  fastify.decorate('isAdminOrCreator', isAdminOrCreator);
  // --- Tournament ---
  fastify.decorate('getAllTournaments', getAllTournaments);
  fastify.decorate('getTournamentById', getTournamentById);
  fastify.decorate('getTournamentByName', getTournamentByName);
  fastify.decorate('createTournament', createTournament);
  fastify.decorate('changeTournamentStatus', changeTournamentStatus);
  fastify.decorate('getTournamentsByStatus', getTournamentsByStatus);
  fastify.decorate('updateTournament', updateTournament);
  fastify.decorate('deleteTournament', deleteTournament);
  fastify.decorate('getParticipantsByTournamentId', getParticipantsByTournamentId);
  fastify.decorate('addParticipant', addParticipant);
  fastify.decorate('updateParticipant', updateParticipant);
  fastify.decorate('deleteParticipant', deleteParticipant);
  // --- Security ---
  fastify.decorate('generateToken', generateToken);
  fastify.decorate('requireRole', requireRole);
  fastify.decorate('auth', authenticate(fastify));
  fastify.decorate('auth2faPending', authenticate(fastify, { allow2FAPending: true }));
  fastify.decorate('verifyPassword', verifyPassword);
  fastify.decorate('allowSelfOrAdmin', allowSelfOrAdmin);
  fastify.decorate('validatePassword', validatePassword);
  fastify.decorate('passwordFeedback', passwordFeedback);
  fastify.decorate('usernameEndsWith42', usernameEndsWith42);

  // --- Stats ---
  fastify.decorate('stat', { request: 0, login: 0, signup: 0 });
  fastify.addHook('onRequest', (req, reply, done) => { fastify.stat.request++; done(); });
}
