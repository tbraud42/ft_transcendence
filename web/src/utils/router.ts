import { isLoggedIn } from './auth/auth'
import { renderLogin } from '../pages/login'
import { renderHome } from '../pages/home'
import { renderPong } from '../pages/pongMenu'
import { renderProfile } from '../pages/profile'
import { renderPongPlay } from '../pages/pongPlay'
import { renderPongLobby } from '../pages/pongLobby'
import { createHeader } from '../components/header'
import { createFooter } from '../components/footer'

export function router(): void {
    const app = document.getElementById('app')
    if (!app) {
        return
    }

    const hash = window.location.hash || '#/'
    const routeParts = hash.slice(2).split('/')

    const mainPage = routeParts[0] || ''
    const subPage = routeParts[1] || ''
    const param = routeParts[2] || ''

    // Redirection vers login si non connecté
    if (!isLoggedIn() && mainPage !== 'login' && mainPage !== 'signup') {
        window.location.hash = '#/login'
        return
    }

    app.innerHTML = ''
    app.appendChild(createHeader())

    const main = document.createElement('main')
    main.className = 'flex-grow p-4'

    if (!isLoggedIn()) {
        main.appendChild(renderLogin(mainPage === 'signup'))
    } else {
        switch (mainPage) {
            case 'login':
            case 'signup':
                main.appendChild(renderLogin(mainPage === 'signup'))
                break
            case 'pong':
                if (subPage === 'play') {
                    main.appendChild(renderPongPlay())
                } else if (subPage === 'lobby' && param) {
                    main.appendChild(renderPongLobby(param as unknown as number))
                } else {
                    main.appendChild(renderPong())
                }
                break
            case 'profile':
                main.appendChild(renderProfile())
                break
            case '':
                main.appendChild(renderHome())
                break
            default:
                main.appendChild(renderHome())
                break
        }
    }

    app.appendChild(main)
    app.appendChild(createFooter())
}