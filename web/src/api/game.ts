import { env } from '../utils/env'
import {getToken} from "../utils/auth/auth";

const API_URL = env.API_URL || 'game-api.example.com'
const PONG_WS_URL = env.PONG_WS_URL || 'pong.ws.example.com'

export async function fetchTournaments(): Promise<any[]> {
    const url = `https://${API_URL}/tournaments`

    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    })

    if (!res.ok) {
        const err = await res.text().catch(() => '')
        throw new Error(`Failed to fetch tournaments: ${res.status} ${err}`)
    }

    return res.json()
}

export function createTournament(
    name: string,
    isPrivate: boolean,
    difficulty: string
): Promise<any> {
    const url = `https://${API_URL}/tournaments`

    const body = {
        name,
        isPrivate,
        difficulty
    }

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
    }).then(res => {
        if (!res.ok) {
            const err = res.text().catch(() => '')
            throw new Error(`Failed to create tournament: ${res.status} ${err}`)
        }
        return res.json()
    })
}