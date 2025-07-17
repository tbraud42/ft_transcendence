import { getPublicRooms } from '../../rooms/store.js'

export default async function getPublicRoomsRoute(fastify) {
    fastify.get('/', async (request, reply) => {
        const rooms = getPublicRooms()
        return reply.send({ rooms })
    })
}