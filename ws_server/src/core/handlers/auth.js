import jwt from 'jsonwebtoken'
import {getClientManager} from "../game/TournamentManager.js";
import {env} from "../../utils/env.js";

const JWT_SECRET = env.JWT_SECRET

/**
 * Handles authentication for a WebSocket connection.
 * Check JWT token validity and set up client session.
 * @param msg { type: number, token: string }
 * @param socket The socket connection that sent the message.
 */
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