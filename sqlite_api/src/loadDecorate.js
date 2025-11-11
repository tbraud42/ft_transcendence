import db from './database/db.js'
import {
  isDev,
  createUser,
  showUserByUsername,
  showUserById,
  updateUserPass,
  updateUserAvatar,
  deleteUser,
  isAdmin,
  isAdminOrCreator,
  updateTimeStamp,
  logout,
  addFriend,
  removeFriend,
  listFriends,
  pendingFriends,
  mapUserForSelfOrAdmin,
  mapUserForPublic,
  crontab
} from './database/manage.js';

import {
  getAllTournaments,
  getTournamentById,
  getTournamentsByStatus,
  createTournament,
  changeTournamentStatus,
  setTournamentWinner,
  deleteTournament,
  insertStatGame,
  getStat,
  topBy,
  listUserRecentMatches,
  validateGameRow
} from './database/tournaments.js';

import {
  generateToken,
  authenticate,
  verifyPassword,
  allowSelfOrAdmin,
  validatePassword,
  passwordFeedback,
  usernameEndsWith42,
  isDeletedUsername
} from './plugins/security.js'

// import crontab module
import cron from 'node-cron';

// import rate-limit module
import rateLimit from '@fastify/rate-limit';

export function loadDecorate(fastify) {
  // --- DB ---
  fastify.decorate('db', db);
  fastify.addHook('onClose', (app, done) => {
    try { fastify.db?.close?.(); } catch (e) { app.log?.error(e, 'DB close failed'); }
    done();
  });
  fastify.decorate('isDev', isDev);

  // --- Users ---
  fastify.decorate('createUser', createUser);
  fastify.decorate('showUserByUsername', showUserByUsername);
  fastify.decorate('showUserById', showUserById);
  fastify.decorate('updateUserPass', updateUserPass);
  fastify.decorate('updateUserAvatar', updateUserAvatar);
  fastify.decorate('deleteUser', deleteUser);
  fastify.decorate('isAdmin', isAdmin);
  fastify.decorate('isAdminOrCreator', isAdminOrCreator);
  fastify.decorate('updateTimeStamp', updateTimeStamp);
  fastify.decorate('logout', logout);
  fastify.decorate('addFriend', addFriend);
  fastify.decorate('removeFriend', removeFriend);
  fastify.decorate('listFriends', listFriends);
  fastify.decorate('pendingFriends', pendingFriends);
  fastify.decorate('mapUserForSelfOrAdmin', mapUserForSelfOrAdmin);
  fastify.decorate('mapUserForPublic', mapUserForPublic);

  // --- Tournament ---
  fastify.decorate('getAllTournaments', getAllTournaments);
  fastify.decorate('getTournamentById', getTournamentById);
  fastify.decorate('getTournamentsByStatus', getTournamentsByStatus);
  fastify.decorate('createTournament', createTournament);
  fastify.decorate('changeTournamentStatus', changeTournamentStatus);
  fastify.decorate('setTournamentWinner', setTournamentWinner);
  fastify.decorate('deleteTournament', deleteTournament);
  fastify.decorate('insertStatGame', insertStatGame);
  fastify.decorate('getStat', getStat);
  fastify.decorate('topBy', topBy);
  fastify.decorate('listUserRecentMatches', listUserRecentMatches);
  fastify.decorate('validateGameRow', validateGameRow);

  // --- Security ---
  fastify.decorate('generateToken', generateToken);
  fastify.decorate('auth', authenticate(fastify));
  fastify.decorate('auth2faPending', authenticate(fastify, { allow2FAPending: true }));
  fastify.decorate('verifyPassword', verifyPassword);
  fastify.decorate('allowSelfOrAdmin', allowSelfOrAdmin);
  fastify.decorate('validatePassword', validatePassword);
  fastify.decorate('passwordFeedback', passwordFeedback);
  fastify.decorate('usernameEndsWith42', usernameEndsWith42);
    fastify.decorate('isDeletedUsername', isDeletedUsername);

  // --- Stats ---
  fastify.decorate('apiStat', { request: 0, login: 0, signup: 0 });
  fastify.addHook('onRequest', (req, reply, done) => { fastify.apiStat.request++; done(); });

  cron.schedule('0 0 0 * * *', () => { crontab(fastify) }, { timezone: 'Europe/Paris' });

  fastify.register(rateLimit, {
    max: 1000,
    timeWindow: '1 minute'
  });
}
