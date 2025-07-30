import i18next from '../lang/i18n'
import { login } from './auth'
import { apiSignup, apiLogin } from "../../api/auth";

export async function handleLogin(
    pseudoInput: HTMLInputElement,
    passwordInput: HTMLInputElement,
    errorMsg: HTMLElement
): void {
    event.preventDefault()
    const user = pseudoInput.value.trim()
    const pass = passwordInput.value

    if (!user || !pass) {
        errorMsg.textContent = i18next.t('login_error_empty')
        return
    }

    try {
        const token = await apiLogin(user, pass)
        if (!token) {
            errorMsg.textContent = i18next.t('login_error_failed')
            return
        }
        login(token)
    } catch {
        errorMsg.textContent = i18next.t('login_error_failed')
    }
}

export async function handleSignup(
    pseudoInput: HTMLInputElement,
    passwordInput: HTMLInputElement,
    passwordConfirm: HTMLInputElement,
    errorMsg: HTMLElement
): Promise<void> {
    event.preventDefault()
    const user = pseudoInput.value.trim()
    const pass = passwordInput.value
    const confirm = passwordConfirm.value

    if (!user || !pass || !confirm) {
        errorMsg.textContent = i18next.t('login_error_empty')
        return
    }

    if (pass !== confirm) {
        errorMsg.textContent = i18next.t('signup_error_mismatch')
        return
    }

    try {
        const token = await apiSignup(user, pass)
        if (!token) {
            errorMsg.textContent = i18next.t('signup_error_failed')
            return
        }
        login(token)
    } catch {
        errorMsg.textContent = i18next.t('signup_error_failed')
    }
}

export function handleGoogleLogin(): void {
    login('GoogleUser')
}