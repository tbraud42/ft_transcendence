// env variable
import dotenv from 'dotenv';
dotenv.config();

// import fastify
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors'

// import crontab module
import cron from 'node-cron';
import { crontab } from './database/manage.js';

// import decorate loader
import { loadDecorate } from './loadDecorate.js';

// import routes
import twoFaRoute from './routes/auth/2fa.js';
import ftRoutes from './routes/auth/42auth.js';
import isLoginRoute from './routes/auth/isAuth.js';
import loginRoute from './routes/auth/login.js';
import refreshRoute from './routes/auth/refreshAuth.js';
import signupRoutes from './routes/auth/signup.js';
import userRoutes from './routes/client/user.js';
import tournamentRoute from './routes/matchs/tournaments.js';
import tournamentClientRoute from './routes/matchs/tournamentsClient.js';
import pingRoutes from './routes/ping.js';
import statRoutes from './routes/stat.js';

import bcrypt from 'bcrypt'; // tmp pour clean database

const start = async () => {
  const fastify = Fastify({ logger: true });

  loadDecorate(fastify);

  fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  await fastify.register(twoFaRoute, { prefix: '/auth/2fa' });
  await fastify.register(ftRoutes, { prefix: '/auth/42' });
  await fastify.register(isLoginRoute, { prefix: '/auth/isAuth' });
  await fastify.register(refreshRoute, { prefix: '/auth/refreshAuth' });
  await fastify.register(loginRoute, { prefix: '/auth/login' });
  await fastify.register(signupRoutes, { prefix: '/auth/signup' });
  await fastify.register(userRoutes, { prefix: '/user' });
  await fastify.register(tournamentRoute, { prefix: '/tournaments' });
  await fastify.register(tournamentClientRoute, { prefix: '/tournaments' });
  await fastify.register(pingRoutes, { prefix: '/ping' });
  await fastify.register(statRoutes, { prefix: '/stat' });

  // cron.schedule('0 0 0 * * *', () => crontab(fastify), { timezone: 'Europe/Paris' });

  let retryTask = null;

  cron.schedule('0 0 0 * * *', () => { // toujours pas bon
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

  const ADDRESS = '0.0.0.0';
  const PORT = process.env.DATABASE_PORT || 3000;

  try {
    await fastify.register(cors, {
      origin: (origin, cb) => {
        const isDev = process.env.NODE_ENV === 'development'

        if (isDev) {
          cb(null, true)
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
    //------insert admin-------
    // const username = 'bob';
    // const password = 'supersecurepassword';
    // const password_hash = await bcrypt.hash(password, 10);
    // const insertUser = fastify.db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
    // const result = insertUser.run(username, password_hash, 'admin'); // insert admin, tmp

    // -----crontab-------------
    // fastify.db.prepare(`UPDATE users SET last_timestamp = datetime('now', '-2 years') WHERE username = ?`).run("bob"); // tmp pour test crontab

    console.log(`----------show time !----------\n`);
    await fastify.showAllData(fastify.db);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
