// plugins/jwt.js
import fastifyJWT from '@fastify/jwt';

export default async function jwtPlugin(fastify, options) {
  await fastify.register(fastifyJWT, {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
  });
}
