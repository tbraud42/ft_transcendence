import { registerRoom } from '../../rooms/store.js'
import { randomUUID } from 'crypto'

export default async function createRoomRoute(fastify, options) {
    fastify.post('/', async (request, reply) => {
        const { name, isPrivate, difficulty, playerId } = request.body

        if (!name || typeof isPrivate !== 'boolean' || !difficulty || !playerId) {
            return reply.code(400).send({ error: 'Missing required fields' })
        }
        const playerName = "CleSucre" //TODO: get player name from playerId
        const players = [{ id: playerId, name: playerName, isReady: false }]

        const room = {
            id: randomUUID(),
            name,
            isPrivate,
            difficulty,
            players,
            code: randomUUID().slice(0, 6).toUpperCase(),
            createdAt: new Date().toISOString()
        }

        registerRoom(room)
        return reply.code(201).send({ room })
    })
}