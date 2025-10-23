import jwt from 'jsonwebtoken'
import {getClientManager} from "../game/GamesManager.js";

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key'

// { 0, token: '' }

export default function handleAuth(msg, socket) {
    const token = msg?.token
    if (!token) {
        try {
            socket.send(JSON.stringify({ type: 'error', error: 'auth_missing' })) 
        } catch {}
        try {
            socket.close() 
        } catch {}
        return
    }

    let payload

    try {
        payload = jwt.verify(token, JWT_SECRET)
        if (!payload?.id || !payload?.username) {
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
        socket.__client = getClientManager().createClient(
            socket,
            true,
            payload.id,
            payload.username,
            token
        );
    }
    socket.__client.send({ type: 'auth_ok', username: payload.username })
}