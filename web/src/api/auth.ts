import { env } from '../utils/env'
import {getToken, getLastTokenRefresh, setToken, logout} from "../utils/storage";

const API_URL = env.API_URL

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

export async function updatePassword(current: string, newPass: string) {
    await refreshToken();

    const url = `https://${API_URL}/users`;

    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
            oldPassword: current,
            newPassword: newPass,
        }),
    });

    if (!res.ok) {
        if (res.status === 401) {
            throw new Error('incorrect_password');
        }
        throw new Error('mismatch');
    }
}

/**
 * Refresh the JWT token if it is older than the given tolerance (default: 30 minute)
 * @param tolerance Time in milliseconds (1800000 = 30 minutes, 0 = always refresh)
 * @returns The new token or null if the refresh failed
 */
export async function refreshToken(tolerance: number = 1800000): Promise<string | null> {
    if (Date.now() - getLastTokenRefresh() < tolerance) {
        return getToken();
    }

    const url = `https://${API_URL}/auth/refreshAuth`;

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
    });

    if (!res.ok) {
        logout()
        return null;
    }

    const data = await res.json();
    setToken(data.token)
    return data.token || null;
}

export const apiSignup = (name: string, password: string) =>
    requestAuth('signup', name, password)

export const apiLogin = (name: string, password: string) =>
    requestAuth('login', name, password)