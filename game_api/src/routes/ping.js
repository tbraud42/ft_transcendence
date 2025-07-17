export default async function pingRoute(fastify) {
    fastify.get('/', async (request, reply) => {
        return reply.code(200).send({ status: 'ok' })
    })
}