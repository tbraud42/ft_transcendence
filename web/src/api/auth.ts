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

    const data = await res.json()
    const info = data.info


    if (data.error === true || !res.ok) {
        switch (data.code) {
            case "VALIDATION_MISSING_OR_INVALID_FIELD": // singup | login
                throw new Error(i18n.t(''));
                break;
            case "USERNAME_ALREADY_USED":               // singup
                throw new Error(i18n.t(''));
                break;
            case "INVALID_USERNAME_SUFFIX_42":          // singup
                throw new Error(i18n.t(''));
                break;
            case "INVALID_PASSWORD_POLICY":             // singup
                throw new Error(i18n.t(''));
                break;
            case "USER_NOT_FOUND":                      // login
                throw new Error(i18n.t('user_not_found'));
                break;
            case "AUTH_INVALID_PASSWORD":               // login
                throw new Error(i18n.t(''));
                break;
            default:
                throw new Error("login error : ${data.code}");
        }
    }

    if (data.info.twofa_required) {
        return { token: data.info.tmp_token, twofa_required: true }
    }

    return { token: data.info.token, twofa_required: false }
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

    const data = await res.json()

    if (data.error === true || !res.ok) {
        switch (data.code) {
            case "INVALID_CODE":
                throw new Error(i18n.t('INVALID_CODE'));
                break;
            case "INVALID_STATE":
                throw new Error(i18n.t('INVALID_STATE'));
                break;
            case "TOKEN_EXCHANGE_FAILED":
                throw new Error(i18n.t('TOKEN_EXCHANGE_FAILED'));
                break;
            case "PROFILE_FETCH_FAILED":
                throw new Error(i18n.t('PROFILE_FETCH_FAILED'));
                break;
            default:
                throw new Error("login error : ${data.code}");
        }
    }

    return await data
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

    const data = await res.json()

    if (data.error === true || !res.ok) {
        switch (data.code) {
            case "AUTH_42_PASSWORD_CHANGE_FORBIDDEN":
                throw new Error(i18n.t(''));
                break;
            case "VALIDATION_MISSING_OR_INVALID_CREDENTIALS":
                throw new Error(i18n.t(''));
                break;
            case "AUTH_ACCESS_DENIED":
                throw new Error(i18n.t(''));
                break;
            case "PASSWORD_CHANGE_REQUIRED":
                throw new Error(i18n.t(''));
                break;
            case "INVALID_PASSWORD_POLICY":
                throw new Error(i18n.t(''));
                break;
            default:
                throw new Error("mismatch ${data.code}");
        }
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

    const data = await res.json()

    if (data.error === true || !res.ok) {
        switch (data.code) {
            case "TFA_NOT_ALLOWED_42":
                throw new Error(i18n.t(''));
                break;
            case "TFA_ALREADY_ENABLED":
                throw new Error(i18n.t(''));
                break;
            default:
                throw new Error("setup faild ${data.code}");
        }
    }

    return await data
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

    const data = await res.json()
    if (data.error === true || !res.ok) {
        switch (data.code) {
            case "TFA_ALREADY_VERIFIED":
                throw new Error(i18n.t(''));
                break;
            case "TFA_INVALID_CODE":
                throw new Error(i18n.t(''));
                break;
            default:
                throw new Error("verify faild ${data.code}");
        }
    }

    if (data?.token) {
        if (isTmpToken) {
            removeItem(TMP_TOKEN_KEY)
        }
        setToken(data.token)
        return true
    }
    return false
}
