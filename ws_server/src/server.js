import dotenv from 'dotenv'
import http from 'http'
import { WebSocketServer } from 'ws'
import url from 'url'

import { verifyToken } from './utils/auth.js'
import { ConnectionManager } from './core/ConnectionManager.js'
import { RoomManager } from './core/RoomManager.js'
import { messageHandlers } from './message/index.js'

dotenv.config()

const PORT = process.env.WS_PORT || 3000

export const connectionManager = new ConnectionManager()
export const roomManager = new RoomManager()

const server = http.createServer()
const wss = new WebSocketServer({ server })

wss.on('connection', (ws, req) => {
    const { query } = url.parse(req.url, true)
    const token = query.token

    if (!token) {
        ws.close(4001, 'Missing token')
        return
    }

    let payload
    try {
        payload = verifyToken(token)
    } catch (err) {
        ws.close(4002, 'Invalid token')
        return
    }

    console.log(`${payload.username} connected`)
    connectionManager.register(ws, payload)

    ws.on('message', (raw) => {
        let msg
        try {
            msg = JSON.parse(raw.toString())
        } catch (e) {
            ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }))
            return
        }

        if (!msg.type || !messageHandlers[msg.type]) {
            ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }))
            return
        }

        const handler = messageHandlers[msg.type]
        handler(ws, msg, payload)
    })

    ws.on('close', () => {
        console.log(`${payload.username} disconnected`)
        connectionManager.unregister(ws)
    })
})

server.listen(PORT, () => {
    console.log(`WebSocket server listening on ws://localhost:${PORT}`)
})