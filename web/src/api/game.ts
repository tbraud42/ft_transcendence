import { env } from '../utils/env'

const API_URL = env.API_URL || 'game-api.example.com'
const PONG_WS_URL = env.PONG_WS_URL || 'pong.ws.example.com'

export async function fetchPublicRooms(): Promise<any[]> {
    try {
        const res = await fetch(`https://${API_URL}/room/get/public`)
        if (!res.ok) {
            throw new Error('API error')
        }
        const data = await res.json()
        return data.rooms
    } catch (e) {
        console.error('Error API game:', e)
        return []
    }
}

export function createRoom(
    name: string,
    isPrivate: boolean,
    difficulty: string,
    playerId: string
): WebSocket {
    const token = ""
    if (!token) {
        throw new Error('Token JWT missing')
    }

    const socket = new WebSocket(`wss://${PONG_WS_URL}/?token=${token}`)

    socket.onopen = () => {
        console.log('WebSocket connected')
        socket.send(
            JSON.stringify({
                type: 'create_room',
                name,
                creatorId: playerId,
                difficulty,
                isPrivate
            })
        )
    }

    socket.onerror = (err) => {
        console.error('WebSocket error:', err)
    }

    return socket
}