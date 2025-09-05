module.exports = {
    type: 'join',
    requiresAuth: true,

    handle(msg, { ws, send, getOrCreateRoom, startGame, broadcast }) {
        const roomId = typeof msg?.roomId === 'string' ? msg.roomId.trim() : ''
        if (!roomId) {
            send(ws, { type: 'error', error: 'room_required' })
            return
        }

        const room = getOrCreateRoom(roomId)

        let slot = null
        if (!room.players[0]) {
            slot = 0
        } else if (!room.players[1]) {
            slot = 1
        }

        if (slot === null) {
            send(ws, { type: 'error', error: 'room_full' })
            return
        }

        room.players[slot] = ws
        ws.meta.roomId = roomId
        ws.meta.slot = slot

        send(ws, { type: 'joined', roomId, slot })

        const username = ws.meta?.username || `Player${slot + 1}`
        broadcast(room, {
            type: 'player_joined',
            username,
            slot,
            message: `${username} a rejoint la partie !`,
        })

        console.log(`Player joined slot ${slot} (username: ${username})`)

        if (room.players[0] && room.players[1] && !room.running) {
            console.log('Both players ready, starting game...')
            broadcast(room, { type: 'starting', tMinusMs: 5000 })
            startGame(room)
        }
    },
}