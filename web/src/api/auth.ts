import { env } from '../utils/env'

const API_URL = env.API_URL || 'game-api.example.com'

async function requestAuth(
    endpoint: 'signup' | 'login',
    username: string,
    password: string
): Promise<string | null> {
    if (!username || !password) {
        return null
    }

    const url = `https://${API_URL}/auth/${endpoint}`

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    })

    if (res.status === 401 || res.status === 404) {
        return null
    }

    if (!res.ok) {
        return null
    }

    const data = await res.json()
    return data.token || null
}

export const apiSignup = (name: string, password: string) =>
    requestAuth('signup', name, password)

export const apiLogin = (name: string, password: string) =>
    requestAuth('login', name, password)