import handleAuth from './auth.js'
import handleJoin from './join.js'
import handleInput from './input.js'
import handleReady from './ready.js'
import handlePing from './ping.js'
import handleAddBot from './add_bot.js'
import handleSnapshot from './snapshot.js'

const HANDLERS = {
    auth: handleAuth,
    join: handleJoin,
    input: handleInput,
    ready: handleReady,
    ping: handlePing,
    add_bot: handleAddBot,
    snapshot: handleSnapshot,
}

export function registerHandlers(socket) {
    socket.on('message', (raw) => {
        let msg
        try {
            msg = JSON.parse(raw) 
        } catch {
            return 
        }
        const h = HANDLERS[msg?.type]
        if (!h) {
            return
        }
        h(msg, socket)
    })
    socket.on('close', () => {
        socket.__client?.onDisconnect()
    })
}