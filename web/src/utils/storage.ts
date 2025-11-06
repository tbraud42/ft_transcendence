import {navigateTo} from "./router";

export const USERNAME_KEY = 'username'
export const TMP_TOKEN_KEY = 'tmpToken'
export const TOKEN_KEY = 'token'
export const LAST_REFRESH_KEY = 'lastTokenRefresh'
export const LANGUAGE_KEY = 'lang'
export const AVATAR_KEY = 'avatar'

export function isLoggedIn(): boolean {
    return !!getToken();
}

export function login(token: string, username: string): void {
    setToken(token)
    setUsername(username)
    if (getTmpToken()) {
        removeItem(TMP_TOKEN_KEY)
    }
    navigateTo('/home')
}

export function logout(): void {
    removeItem(USERNAME_KEY)
    removeItem(TOKEN_KEY)
    removeItem(AVATAR_KEY)
    navigateTo('/')
}

export function setUsername(username: string): void {
    localStorage.setItem(USERNAME_KEY, username)
}

export function getUsername(): string {
    return localStorage.getItem(USERNAME_KEY) || ''
}

export function setTmpToken(token: string): void {
    localStorage.setItem(TMP_TOKEN_KEY, token)
}

export function getTmpToken(): string {
    return localStorage.getItem(TMP_TOKEN_KEY) || ''
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(LAST_REFRESH_KEY, Date.now().toString())
}

export function getToken(): string {
    return localStorage.getItem(TOKEN_KEY) || ''
}

export function getLastTokenRefresh(): number {
    return parseInt(localStorage.getItem(LAST_REFRESH_KEY) || '0', 10)
}

export function setLanguage(lang: string): void {
    localStorage.setItem(LANGUAGE_KEY, lang)
}

export function getLanguage(): string {
    return localStorage.getItem(LANGUAGE_KEY) || 'en'
}

export function removeItem(key: string): void {
    localStorage.removeItem(key)
}

export function setAvatar(avatar: string): void {
    localStorage.setItem(AVATAR_KEY, avatar)
}

export function getAvatar(): string {
    return localStorage.getItem(AVATAR_KEY) || ''
}

export function clearStorage(): void {
    localStorage.clear()
}
