const USER_KEY = 'ft_user'

export function isLoggedIn(): boolean {
    return !!localStorage.getItem(USER_KEY)
}

export function login(token: string): void {
    localStorage.setItem(USER_KEY, token)
    window.location.hash = '#/home'
}

export function logout(): void {
    localStorage.removeItem(USER_KEY)
    window.location.hash = '#/'
}

export function getToken(): string | null {
    return localStorage.getItem(USER_KEY)
}