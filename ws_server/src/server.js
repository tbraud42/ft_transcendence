import { WebSocketServer } from 'ws'
import { Client } from './core/client/Client.js'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
    console.error('Missing JWT_SECRET env var')
    process.exit(1)
}

const PORT = process.env.PORT || 3000

function startHeartbeat(wss) {
    setInterval(() => {
        for (const ws of wss.clients) {
            if (ws.isAlive === false) {
                ws.terminate()
                continue
            }
            ws.isAlive = false
            ws.ping()
        }
    }, 30000)
}

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws) => {
    new Client(ws, wss)
})

startHeartbeat(wss)
console.log(`WS Pong server listening on ws://localhost:${PORT}`)