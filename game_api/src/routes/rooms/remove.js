import { removeRoom } from '../../rooms/store.js'

export default async function removeRoomRoute(fastify, options) {
    fastify.post('/', async (request, reply) => {
        const { roomId } = request.body

        if (!roomId) {
            return reply.code(400).send({ error: 'Room ID is required' })
        }

        const removed = removeRoom(roomId)
        if (!removed) {
            return reply.code(404).send({ error: 'Room not found' })
        }
        return reply.code(200).send({ message: 'Room removed successfully' })
    })
}