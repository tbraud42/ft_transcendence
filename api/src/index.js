import Fastify from 'fastify'
const fastify = Fastify({
    logger: true
})

// 0.0.0.0 is used to bind the server to all available interfaces
const ADDRESS = '0.0.0.0';

fastify.get('/ping', async (request, reply) => {
    console.log("Ping received");
    return reply.code(200).send({ status: 'ok' })
});

try {
    await fastify.listen({ port: 3000, host: ADDRESS })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}
