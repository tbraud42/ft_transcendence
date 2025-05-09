import Fastify from 'fastify'
const fastify = Fastify({
    logger: true
})

// 0.0.0.0 is used to bind the server to all available interfaces
const ADDRESS = '0.0.0.0';

// API Port should be set in the environment variable or default to 3000
const API_PORT = process.env.API_PORT || 3000;

fastify.get('/ping', async (request, reply) => {
    console.log("Ping received");
    return { message: 'pong' };
});

try {
    await fastify.listen({ port: API_PORT, host: ADDRESS })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}