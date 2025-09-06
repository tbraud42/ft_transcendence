import jwt from 'jsonwebtoken';
import {getHandler} from "../handlers/index.js";

const JWT_SECRET = process.env.JWT_SECRET

/**
 * Manage a single WebSocket connection
 */
export class Client {
    /**
     * @param {import('ws').WebSocket} ws - WebSocket connection
     * @param {import('ws').WebSocketServer} wss - WebSocket server
     * @param {import('jsonwebtoken')} jwt - jsonwebtoken lib
     * @param {number} authTimeoutMs - Time in ms to wait for auth message
     */
    constructor(ws, wss, jwt, authTimeoutMs = 5000) {
        this.ws = ws
        this.wss = wss
        this.isAuthed = false
        this.token = null
        this.username = null
        this.tournament = null
        this.authTimeoutMs = authTimeoutMs
        this.authTimeout = null
        this.isAlive = true

        this.bindEvents()
        this.startAuthTimeout()
    }

    bindEvents() {
        this.ws.on('pong', this.onPong)
        this.ws.on('message', this.onMessage)
        this.ws.on('close', this.onClose)
        this.ws.on('error', this.onError)
    }

    startAuthTimeout() {
        this.authTimeout = setTimeout(() => {
            if (!this.isAuthed) {
                this.send({ type: 'error', error: 'auth_timeout' })
                this.ws.close(4001, 'Auth timeout')
            }
        }, this.authTimeoutMs)
    }

    clearAuthTimeout = () => {
        if (this.authTimeout) {
            clearTimeout(this.authTimeout)
            this.authTimeout = null
        }
    }

    onPong = () => {
        this.isAlive = true
    }

    onMessage = (data) => {
        let msg
        try {
            msg = JSON.parse(data.toString())
        } catch {
            this.send({ type: 'error', error: 'invalid_json' })
            return
        }

        const type = typeof msg?.type === 'string' ? msg.type : null
        if (!type) {
            this.send({ type: 'error', error: 'missing_type' })
            return
        }

        const handler = getHandler(type)
        if (!handler) {
            this.send({ type: 'error', error: 'unknown_message' })
            return
        }

        if (handler.requiresAuth && !this.isAuthed) {
            this.send({ type: 'error', error: 'auth_required' })
            return
        }

        try {
            handler.handle(msg, this)
        } catch (e) {
            console.error('Handler error:', e)
            this.send({ type: 'error', error: 'internal' })
        }
    }

    onClose = () => {
        this.clearAuthTimeout()
        if (this.tournament) {
            this.tournament.removeClient(this.username)
        }
    }

    onError = (e) => {
        console.error('WS error:', e)
    }

    auth(token) {

        const decoded = jwt.verify(token, JWT_SECRET);
        const username = typeof decoded?.username === 'string' ? decoded.username : null;
        if (!username) {
            return false
        }
        this.clearAuthTimeout();
        this.isAuthed = true;
        this.token = token;
        this.username = username;
        return true
    }

    send(payload) {
        try {
            if (this.ws.readyState === this.ws.OPEN) {
                this.ws.send(JSON.stringify(payload))
            }
        } catch (_) {}
    }

    setTournament(tournament) {
        if (this.tournament) {
            this.tournament.removeClient(this.username)
        }
        this.tournament = tournament
    }
}
