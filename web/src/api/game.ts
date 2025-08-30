import { env } from '../utils/env'
import { getToken } from "../utils/auth/auth";
import {refreshToken} from "./auth";

const API_URL = env.API_URL

export async function fetchTournaments(): Promise<any[]> {
    await refreshToken();

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

export async function createTournament(
    name: string,
    difficulty: string
): Promise<any> {
    await refreshToken();

    const url = `https://${API_URL}/tournaments`

    const body = {
        name,
        description: '',
        difficulty,
        maxPlayers: 2,
        isPrivate: false
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

export async function getTournament(id: number): Promise<any> {
    await refreshToken();

    const url = `https://${API_URL}/tournaments/${id}`

    return fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        }
    }).then(res => {
        if (!res.ok) {
            const err = res.text().catch(() => '')
            throw new Error(`Failed to fetch tournament: ${res.status} ${err}`)
        }
        return res.json()
    })
}