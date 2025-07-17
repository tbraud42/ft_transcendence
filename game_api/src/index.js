import Fastify from 'fastify'
import cors from '@fastify/cors'
import createRoom from './routes/rooms/create.js'
import getPublicRoomsRoute from "./routes/rooms/getPublicRooms.js";
import pingRoutes from './routes/ping.js'
import removeRoomRoute from "./routes/rooms/remove.js";

const fastify = Fastify({ logger: true })

//TODO: allow only specific domain name for dev and production
await fastify.register(cors, {
    origin: true
})

// Routes
fastify.register(pingRoutes, { prefix: '/ping' })
fastify.register(createRoom, { prefix: '/room/create' })
fastify.register(removeRoomRoute, { prefix: '/room/remove' })
fastify.register(getPublicRoomsRoute, { prefix: '/room/get/public' })

try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}