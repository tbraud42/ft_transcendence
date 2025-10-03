import db from './database/db.js'
import {
  isDev,
  createUser,
  showUserByUsername,
  showUserById,
  updateUser,
  deleteUser,
  isAdmin,
  isAdminOrCreator,
  showAllData,
  updateTimeStamp,
  addFriend,
  removeFriend,
  listFriends,
  mapUserForSelfOrAdmin,
  mapUserForPublic,
  crontab
} from './database/manage.js';

import {
  getAllTournaments,
  getTournamentById,
  getTournamentsByStatus,
  getTournamentByName,
  createTournament,
  updateTournament,
  changeTournamentStatus,
  setTournamentWinner,
  deleteTournament,
  insertStatGame,
  userExists,
  tournamentExists,
  getStat,
  topWinRate,
  topLoseRate,
  topTotalPlayTime,
  topTournamentsCreated,
  topTournamentsWon
} from './database/tournaments.js';

import {
  generateToken,
  authenticate,
  verifyPassword,
  allowSelfOrAdmin,
  validatePassword,
  passwordFeedback,
  usernameEndsWith42
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
  fastify.decorate('showAllData', showAllData);

  // --- Users  ---
  fastify.decorate('createUser', createUser);
  fastify.decorate('showUserByUsername', showUserByUsername);
  fastify.decorate('showUserById', showUserById);
  fastify.decorate('updateUser', updateUser);
  fastify.decorate('deleteUser', deleteUser);
  fastify.decorate('isAdmin', isAdmin);
  fastify.decorate('isAdminOrCreator', isAdminOrCreator);
  fastify.decorate('updateTimeStamp', updateTimeStamp);

  fastify.decorate('addFriend', addFriend);
  fastify.decorate('removeFriend', removeFriend);
  fastify.decorate('listFriends', listFriends);
  fastify.decorate('mapUserForSelfOrAdmin', mapUserForSelfOrAdmin);
  fastify.decorate('mapUserForPublic', mapUserForPublic);

  // --- Tournament ---
  fastify.decorate('getAllTournaments', getAllTournaments);
  fastify.decorate('getTournamentById', getTournamentById);
  fastify.decorate('getTournamentsByStatus', getTournamentsByStatus);
  fastify.decorate('getTournamentByName', getTournamentByName);
  fastify.decorate('createTournament', createTournament);
  fastify.decorate('updateTournament', updateTournament);
  fastify.decorate('changeTournamentStatus', changeTournamentStatus);
  fastify.decorate('setTournamentWinner', setTournamentWinner);
  fastify.decorate('deleteTournament', deleteTournament);
  fastify.decorate('insertStatGame', insertStatGame);
  fastify.decorate('userExists', userExists);
  fastify.decorate('tournamentExists', tournamentExists);

  fastify.decorate('getStat', getStat);
  fastify.decorate('topWinRate', topWinRate);
  fastify.decorate('topLoseRate', topLoseRate);
  fastify.decorate('topTotalPlayTime', topTotalPlayTime);
  fastify.decorate('topTournamentsCreated', topTournamentsCreated);
  fastify.decorate('topTournamentsWon', topTournamentsWon);
  // --- Security ---
  fastify.decorate('generateToken', generateToken);
  fastify.decorate('auth', authenticate(fastify));
  fastify.decorate('auth2faPending', authenticate(fastify, { allow2FAPending: true }));
  fastify.decorate('verifyPassword', verifyPassword);
  fastify.decorate('allowSelfOrAdmin', allowSelfOrAdmin);
  fastify.decorate('validatePassword', validatePassword);
  fastify.decorate('passwordFeedback', passwordFeedback);
  fastify.decorate('usernameEndsWith42', usernameEndsWith42);
  // --- Stats ---
  fastify.decorate('apiStat', { request: 0, login: 0, signup: 0 });
  fastify.addHook('onRequest', (req, reply, done) => { fastify.apiStat.request++; done(); });


    let retryTask = null;

    cron.schedule('0 0 0 * * *', () => {
      try {
        crontab(fastify)
      } catch (err) {
        console.error("overloading process fot crontab, setup to every 5 min", err);

        retryTask = cron.schedule("*/5 * * * *", () => {
          try {
            crontab(fastify)
            console.log("crontab successful");
            retryTask.stop();
            retryTask = null;
          } catch (err2) {
            console.error("crontab fail", err2);
          }
        });
      }
    }, { timezone: 'Europe/Paris' });

  fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });
}
