import i18next from '../lang/i18n'
import { login } from './auth'

export function handleLogin(
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

    login(user)
}

export function handleSignup(
    pseudoInput: HTMLInputElement,
    passwordInput: HTMLInputElement,
    passwordConfirm: HTMLInputElement,
    errorMsg: HTMLElement
): void {
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

    login(user)
}

export function handleGoogleLogin(): void {
    login('GoogleUser')
}