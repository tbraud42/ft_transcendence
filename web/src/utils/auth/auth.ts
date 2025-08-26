const USERNAME_KEY = 'username'
const TOKEN_KEY = 'token'

export function isLoggedIn(): boolean {
    return !!localStorage.getItem(TOKEN_KEY)
}

export function login(token: string, username: string): void {
    localStorage.setItem(TOKEN_KEY, token)
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

export function getToken(): string {
    return localStorage.getItem(TOKEN_KEY) || ''
}
