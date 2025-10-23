// env variable
import dotenv from 'dotenv';
dotenv.config();

// import fastify module
import Fastify from 'fastify';
import cors from '@fastify/cors'

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
import friendRoutes from './routes/client/userFriends.js';
import tournamentRoute from './routes/matchs/tournaments.js';
import pingRoutes from './routes/ping.js';
import statRoutes from './routes/stat.js';

const start = async () => {
  let fastify;
  if (process.env.NODE_ENV === 'development') {
    fastify = Fastify({ logger: true });
  } else {
    fastify = Fastify();
  }

  loadDecorate(fastify);

  await fastify.register(twoFaRoute, { prefix: '/auth/2fa' });
  await fastify.register(ftRoutes, { prefix: '/auth/42' });
  await fastify.register(isLoginRoute, { prefix: '/auth/isAuth' });
  await fastify.register(refreshRoute, { prefix: '/auth/refreshAuth' });
  await fastify.register(loginRoute, { prefix: '/auth/login' });
  await fastify.register(signupRoutes, { prefix: '/auth/signup' });
  await fastify.register(userRoutes, { prefix: '/user' });
  await fastify.register(friendRoutes, { prefix: '/user/friends' });
  await fastify.register(tournamentRoute, { prefix: '/tournaments' });
  await fastify.register(pingRoutes, { prefix: '/ping' });
  await fastify.register(statRoutes, { prefix: '/stat' });

  const ADDRESS = '0.0.0.0';
  const PORT = 3000;

  try {
    await fastify.register(cors, {
      origin: (origin, cb) => {
        if (fastify.isDev()) {
          cb(null, true)
        } else {
          const allowedOrigins = [
            `https://localhost`,
            `https://${process.env.DOMAIN}`,
            `https://www.${process.env.DOMAIN}`
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

    if (fastify.isDev()) {
      console.log(`----------show time !----------\n`);
      await fastify.showAllData(fastify.db);
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

