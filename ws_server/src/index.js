import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { WebSocketServer } from 'ws'
import http from 'http'
import url from 'url'

dotenv.config()

const server = http.createServer()
const wss = new WebSocketServer({ server })

const JWT_SECRET = process.env.JWT_SECRET

wss.on('connection', (ws, req) => {
    const { query } = url.parse(req.url, true)
    const token = query.token

    if (!token) {
        ws.close(4001, 'Token required')
        return
    }

    let payload
    try {
        payload = jwt.verify(token, JWT_SECRET)
    } catch (err) {
        ws.close(4002, 'Invalid token')
        return
    }

    console.log('Client connected:', payload.username)

    ws.send('Welcome, ' + payload.username)

    ws.on('message', (message) => {
        console.log(`[${payload.username}] ${message}`)
    })

    ws.on('close', () => {
        console.log(`Connection closed: ${payload.username}`)
    })
})

server.listen(3000, () => {
    console.log(`WebSocket server running on ws://localhost:3000`)
})