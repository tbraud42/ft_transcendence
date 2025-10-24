// api/auth.ts

// FIX TO COMPILE
// src/pages/home.ts
// import {refreshToken} from "../api/auth"; -> import { refreshToken } from "../api/jwt";
// src/pages/pongMenu/tabs/online.ts
// import {createTournament, fetchTournaments} from '../../../api/game' -> import {createTournament, fetchTournaments} from '../../../api/methode';

import { env } from '../utils/env'
import {
    getToken,
    getLastTokenRefresh,
    setToken,
    logout,
    login,
    getUsername,
    setUsername,
    isLoggedIn, getTmpToken, removeItem, TMP_TOKEN_KEY
} from "../utils/storage";
import { refreshToken } from './jwt';
import i18n from "../utils/lang/i18n";

const API_URL = env.API_URL

async function requestAuth(
    endpoint: 'signup' | 'login',
    username: string,
    password: string
): Promise<{ token: string, twofa_required: boolean } | null> {
    if (!username || !password) {
        return null
    }
    const url = `${API_URL}/auth/${endpoint}`

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    })

    if (res.status === 429) {
        let msg = 'Too many attempts. Please try again later.';
        try {
            const j = await res.json();
            if (j?.message) {
                msg = j.message;
            }
        } catch {}
        alert(msg);
        throw new Error(msg);
    }

    if (!res.ok) {
        const errText = await res.text().catch(() => '')
        console.error(`${endpoint} error:`, res.status, errText)
        throw new Error(i18n.t('login_error_user_not_found'));
    }

    const data = await res.json()

    if (res.status === 401 && endpoint === 'signup') {
        throw new Error(i18n.t('signup_error_username_taken'))
    } else if (res.status === 404) {
        throw new Error(i18n.t('login_error_user_not_found'))
    }

    if (!res.ok) {
        throw new Error(i18n.t('login_error_failed'))
    }

    if (data.twofa_required) {
        return { token: data.tmp_token, twofa_required: true }
    }

    return { token: data.token, twofa_required: false }
}

export async function request42Auth(code: string, state: string): Promise<{ token: string, user: { id: number, username: string } } | null> {
    if (!code || !state) {
        return null
    }
    const url = `${API_URL}/auth/42/callback?code=${code}&state=${state}`

    const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
        return null;
    }

    return await res.json()
}

export async function updatePassword(current: string, newPass: string) {
    await refreshToken();

    const url = `${API_URL}/users`;

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

export const apiSignup = (name: string, password: string) =>
    requestAuth('signup', name, password)

export const apiLogin = (name: string, password: string) =>
    requestAuth('login', name, password)


export async function api2faSetup(): Promise<{ qrCode: string, secret: string, otpauthUrl: string } | null> {
    const url = `${API_URL}/auth/2fa/setup`
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({}),
    })

    if (!res.ok) {
        return null
    }
    return await res.json()
}


export async function twofaVerify(code: string): Promise<boolean> {
    if (!code) {
        return false
    }

    let isTmpToken
    let token
    if (!isLoggedIn()) {
        isTmpToken = true
        token = getTmpToken()
    } else {
        isTmpToken = false
        token = getToken()
    }

    const url = `${API_URL}/auth/2fa/verify`
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: code }),
    })

    if (!res.ok) {
        return false
    }

    const data = await res.json()
    if (data?.token) {
        if (isTmpToken) {
            removeItem(TMP_TOKEN_KEY)
        }
        setToken(data.token)
        return true
    }
    return false
}
