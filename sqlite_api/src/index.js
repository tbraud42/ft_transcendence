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
import tournamentClientRoute from './routes/matchs/tournaments_client.js';
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

  cron.schedule('0 0 0 * * *', () => crontab(fastify), { timezone: 'Europe/Paris' });

  const ADDRESS = '0.0.0.0';
  const PORT = process.env.DATABASE_PORT || 3000;
  const DOMAIN = process.env.DOMAIN || 'trans.clesucre.fr';

  try {
    await fastify.register(cors, {
      origin: (origin, cb) => {
        const isDev = process.env.NODE_ENV === 'development'

        if (isDev) {
          cb(null, true) // autorise tout en dev
        } else {
          const allowedOrigins = [
            `https://${DOMAIN}`
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
    // const password = 'supersecurepassword';

    // const password_hash = await bcrypt.hash(password, 10);

    // const insertUser = fastify.db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
    // const result = insertUser.run(username, password_hash, 'admin'); // insert admin, tmp
    // fastify.db.prepare(`UPDATE users SET last_timestamp = datetime('now', '-2 years') WHERE id = ?`).run(2); // tmp pour test crontab

    console.log(`----------show time !----------\n`);
    await fastify.showAllData(fastify.db);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
