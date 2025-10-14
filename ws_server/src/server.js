import { WebSocketServer } from 'ws'
import { registerHandlers } from './core/handlers/index.js'
import { getTournamentManager } from './core/game/GamesManager.js'

const wss = new WebSocketServer({ port: process.env.PORT ? Number(process.env.PORT) : 3000 })

wss.on('connection', (socket) => {
    socket.isAlive = true
    socket.on('pong', () => (socket.isAlive = true))
    registerHandlers(socket)
})

setInterval(() => {
    for (const client of wss.clients) {
        if (!client.isAlive) {
            try {
                client.terminate() 
            } catch {}
            continue;
        }
        client.isAlive = false
        try {
            client.ping() 
        } catch {}
    }
}, 15000)

process.on('SIGINT', () => {
    process.exit(0)
})