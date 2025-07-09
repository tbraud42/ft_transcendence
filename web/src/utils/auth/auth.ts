const USER_KEY = 'ft_user'

export function isLoggedIn(): boolean {
    return !!localStorage.getItem(USER_KEY)
}

export function login(pseudo: string): void {
    localStorage.setItem(USER_KEY, pseudo)
    window.location.hash = '#/home'
}

export function logout(): void {
    localStorage.removeItem(USER_KEY)
    window.location.hash = '#/'
}

export function getUsername(): string | null {
    return localStorage.getItem(USER_KEY)
}