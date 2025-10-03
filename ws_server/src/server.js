import { WebSocketServer } from 'ws'
import { registerHandlers } from './core/handlers/index.js'
import { getTournamentManager } from './core/game/GamesManager.js'

const wss = new WebSocketServer({ port: 3000 })
const NODE_ENV = process.env.NODE_ENV

if (NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

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
            } catch {} ; continue 
        }
        client.isAlive = false
        try {
            client.ping() 
        } catch {}
    }
}, 15000)

process.on('SIGINT', () => {
    try {
        getTournamentManager().shutdown() 
    } catch {}
    process.exit(0)
})