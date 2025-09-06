import i18n from './lang/i18n'
import {login, setTmpToken, setUsername} from './storage'
import { apiSignup, apiLogin } from "../api/auth";
import {env} from "./env";

const API_URL = env.API_URL

export async function handleLogin(
    e: Event,
    pseudoInput: HTMLInputElement,
    passwordInput: HTMLInputElement,
    errorMsg: HTMLElement
): Promise<boolean> {
    e.preventDefault()
    const user = pseudoInput.value.trim()
    const pass = passwordInput.value

    if (!user || !pass) {
        errorMsg.textContent = i18n.t('login_error_empty')
        return false
    }

    try {
        const res = await apiLogin(user, pass)
        if (res) {
            if (res.twofa_required) {
                setUsername(user)
                setTmpToken(res.token)
                return true
            } else {
                login(res.token, user)
                return false
            }
        }
    } catch (err) {
        errorMsg.textContent = (err as Error).message
    }
    return false
}

export async function handleSignup(
    e: Event,
    pseudoInput: HTMLInputElement,
    passwordInput: HTMLInputElement,
    passwordConfirm: HTMLInputElement,
    errorMsg: HTMLElement
): Promise<void> {
    e.preventDefault()
    const user = pseudoInput.value.trim()
    const pass = passwordInput.value
    const confirm = passwordConfirm.value

    if (!user || !pass || !confirm) {
        errorMsg.textContent = i18n.t('login_error_empty')
        return
    }

    if (pass !== confirm) {
        errorMsg.textContent = i18n.t('signup_error_mismatch')
        return
    }

    try {
        const res = await apiSignup(user, pass)
        if (res) {
            login(res.token, user)
        }
    } catch (err) {
        errorMsg.textContent = (err as Error).message
    }
}

export function handleFtLogin(): void {
    const apiBaseUrl = `https://${API_URL}`;
    const authUrl = `${apiBaseUrl.replace(/\/+$/, '')}/auth/42/login`;
    window.location.assign(authUrl);
}
