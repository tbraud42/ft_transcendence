import { env } from '../utils/env'

const GAME_API_URL = env.GAME_API_URL || 'game-api.example.com'

export async function fetchPublicRooms(): Promise<any[]> {
    try {
        const res = await fetch(`https://${GAME_API_URL}/room/get/public`)
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        return data.rooms
    } catch (e) {
        console.error('Erreur API game:', e)
        return []
    }
}

export async function createRoom(name: string, isPrivate: boolean, difficulty: string, playerId: string): Promise<any> {
    try {
        const res = await fetch(`https://${GAME_API_URL}/room/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                isPrivate,
                difficulty,
                playerId
            })
        })
        if (!res.ok) throw new Error('API error')
        return await res.json()
    } catch (e) {
        console.error('Erreur API game:', e)
        throw e
    }
}