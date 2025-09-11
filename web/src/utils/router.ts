import { getToken, isLoggedIn, login } from './storage'
import { renderHome } from '../pages/home'
import { renderProfile } from '../pages/profile'
import { renderPongPlay } from '../pages/pongPlay'
import { renderTournament } from '../pages/tournament'
import { createHeader } from '../components/header'
import { createFooter } from '../components/footer'
import { env } from './env'
import { renderAuth } from '../pages/auth'
import { request42Auth } from '../api/auth'

const PONG_WS_URL = env.PONG_WS_URL

let currentCleanup: (() => void) | null = null

export function router(): void {
    const app = document.getElementById('app')
    if (!app) return

    if (currentCleanup) {
        try { currentCleanup() } catch {}
        currentCleanup = null
    }

    const path = window.location.pathname || '/'
    const routeParts = path.slice(1).split('/')

    const mainPage = routeParts[0] || ''
    const subPage = routeParts[1] || ''
    const param = routeParts[2] || ''

    app.innerHTML = ''
    app.appendChild(createHeader())

    const main = document.createElement('main')
    main.className = 'flex-grow p-4'

    if (!isLoggedIn()) {
        if (mainPage === 'auth' && subPage === '42') {
            const query = window.location.search
            const params = new URLSearchParams(query)

            const code = params.get('code')
            const state = params.get('state')

            if (code && state) {
                request42Auth(code, state)
                    .then((res) => {
                        if (!res || !res.token || !res.user || !res.user.username) {
                            navigateTo('/login')
                            return
                        }
                        login(res.token, res.user.username)
                        navigateTo('/home')
                    })
                    .catch(() => {
                        navigateTo('/login')
                    })
            } else {
                console.error('42 login failed: missing token or username in callback')
                navigateTo('/login')
            }
        } else {
            main.appendChild(renderAuth(mainPage as 'login' | 'signup' | '2fa'))
        }
    } else {
        switch (mainPage) {
            case 'pong': {
                if (subPage === 'play') {
                    main.appendChild(renderPongPlay(param))
                } else if (subPage === 'lobby' && param) {
                    currentCleanup = renderTournament(app, 'wss://' + PONG_WS_URL, getToken(), param)
                } else {
                    main.appendChild(renderHome())
                    navigateTo('/', false)
                }
                break
            }

            case 'profile': {
                main.appendChild(renderProfile(subPage))
                break
            }

            case '': {
                main.appendChild(renderHome())
                break
            }

            default: {
                main.appendChild(renderHome())
                navigateTo('/', false)
                break
            }
        }
    }

    app.appendChild(main)
    app.appendChild(createFooter())
}

export function navigateTo(pathname: string, execRouter: boolean = true): void {
    window.history.pushState({}, '', pathname)
    if (execRouter) {
        router()
    }
}

window.addEventListener('popstate', () => router())