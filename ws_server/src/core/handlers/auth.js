import jwt from 'jsonwebtoken'
import { Client } from '../client/Client.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key'

export default function handleAuth(msg, socket) {
    const token = msg?.token
    const username = msg?.username ? String(msg.username) : null
    if (!token || !username) {
        try {
            socket.send(JSON.stringify({ type: 'error', error: 'auth_missing' })) 
        } catch {}
        try {
            socket.close() 
        } catch {}
        return
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET)
        // minimal claim check
        if (payload?.username && payload.username !== username) {
            try {
                socket.send(JSON.stringify({ type: 'error', error: 'token_mismatch' })) 
            } catch {}
            try {
                socket.close() 
            } catch {}
            return
        }
    } catch {
        try {
            socket.send(JSON.stringify({ type: 'error', error: 'auth_invalid' })) 
        } catch {}
        try {
            socket.close() 
        } catch {}
        return
    }

    if (!socket.__client) {
        socket.__client = new Client(socket)
    }
    socket.__client.auth = true
    socket.__client.username = username
    socket.__client.token = token
    socket.__client.send({ type: 'auth_ok', username })
}