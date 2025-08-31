import i18n from './lang/i18n'
import { login } from './storage'
import { apiSignup, apiLogin } from "../api/auth";
import {env} from "./env";

const API_URL = env.API_URL

export async function handleLogin(
    e: Event,
    pseudoInput: HTMLInputElement,
    passwordInput: HTMLInputElement,
    errorMsg: HTMLElement
): Promise<void> {
    e.preventDefault()
    const user = pseudoInput.value.trim()
    const pass = passwordInput.value

    if (!user || !pass) {
        errorMsg.textContent = i18n.t('login_error_empty')
        return
    }

    const token = await apiLogin(user, pass)

    if (token) {
        login(token, user)
    } else {
        errorMsg.textContent = i18n.t('login_error_failed')
    }
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
        const token = await apiSignup(user, pass)
        if (!token) {
            errorMsg.textContent = i18n.t('signup_error_failed')
            return
        }
        login(token, user)
    } catch {
        errorMsg.textContent = i18n.t('signup_error_failed')
    }
}

export function handleFtLogin(): void {
    const apiBaseUrl = `https://${API_URL}`;
    const authUrl = `${apiBaseUrl.replace(/\/+$/, '')}/auth/42/login`;
    window.location.assign(authUrl);
}

export function ftCallback(): void {

    if (!window.location.hash.startsWith('#/auth/42/callback')) {
        return;
    }

    const query = window.location.hash.split('?')[1] || '';
    const params = new URLSearchParams(query);

    const token = params.get('token');
    const username = params.get('username');

    if (token && username) {
        login(token, username);
        window.location.hash = '#/home';
    } else {
        console.error('42 login failed: missing token or username in callback');
        window.location.hash = '#/login';
    }
}