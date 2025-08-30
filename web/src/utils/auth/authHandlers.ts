import i18next from '../lang/i18n'
import { login } from './auth'
import { apiSignup, apiLogin } from "../../api/auth";

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
        errorMsg.textContent = i18next.t('login_error_empty')
        return
    }

    const token = await apiLogin(user, pass)

    if (token) {
        login(token, user)
    } else {
        errorMsg.textContent = i18next.t('login_error_failed')
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
        login(token, user)
    } catch {
        errorMsg.textContent = i18next.t('signup_error_failed')
    }
}

export function handleFtLogin(): void {
    login('User_42', 'User_42')
}