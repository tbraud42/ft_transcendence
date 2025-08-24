type Packet = {
    type: string
    [key: string]: any
}

type PacketHandler = (packet: Packet) => void

const handlers: Record<string, PacketHandler> = {
    room_update(packet) {
        console.log('Room updated:', packet.state)
        // TODO: update the room state in the UI
    },

    start_game(packet) {
        console.log('Starting game with players:', packet.players)
        // TODO: initiate the game logic
    },

    player_joined(packet) {
        console.log(`New player joined: ${packet.player.name} (${packet.player.id})`)
        // TODO: update the UI to reflect the new player
    },

    error(packet) {
        console.error('Server Error:', packet.message)
    },
}

export function handlePacket(packet: Packet) {
    const handler = handlers[packet.type]
    if (!handler) {
        console.warn(`No handler for packet type: ${packet.type}`)
        return
    }

    handler(packet)
}