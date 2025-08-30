const USERNAME_KEY = 'username'
const TOKEN_KEY = 'token'
const LAST_REFRESH_KEY = 'lastTokenRefresh'

export function isLoggedIn(): boolean {
    return !!localStorage.getItem(TOKEN_KEY)
}

export function login(token: string, username: string): void {
    setToken(token)
    localStorage.setItem(USERNAME_KEY, username)
    window.location.hash = '#/home'
}

export function logout(): void {
    localStorage.removeItem(USERNAME_KEY)
    localStorage.removeItem(TOKEN_KEY)
    window.location.hash = '#/'
}

export function getUsername(): string {
    return localStorage.getItem(USERNAME_KEY) || ''
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

