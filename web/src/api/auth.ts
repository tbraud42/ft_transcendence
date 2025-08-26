import { env } from '../utils/env'

const API_URL = env.API_URL || 'game-api.example.com'

async function requestAuth(
    endpoint: 'signup' | 'login',
    username: string,
    password: string
): Promise<string> {
    if (!username || !password) {
        throw new Error('Name and password are required')
    }

    const url = `https://${API_URL}/auth/${endpoint}`

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
        const errText = await res.text().catch(() => '')
        console.error(`${endpoint} error:`, res.status, errText)
        throw new Error(`Failed to ${endpoint}`)
    }

    const data = await res.json()
    if (!data.token) {
        throw new Error(`No token received from ${endpoint}`)
    }

    return data.token
}

export const apiSignup = (name: string, password: string) =>
    requestAuth('signup', name, password)

export const apiLogin = (name: string, password: string) =>
    requestAuth('login', name, password)