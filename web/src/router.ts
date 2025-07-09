import { isLoggedIn } from './auth'
import { renderLogin } from './pages/login'
import { renderHome } from './pages/home'
import { renderPong } from './pages/pongMenu'
import { renderProfile } from './pages/profile'
import { renderPongPlay } from './pages/pongPlay'
import { createHeader } from './components/header'
import { createFooter } from './components/footer'

export function router(): void {
    const app = document.getElementById('app')
    if (!app) {
        return
    }

    app.innerHTML = ''
    app.appendChild(createHeader())

    const main = document.createElement('main')
    main.className = 'flex-grow p-4'

    const route = window.location.hash.split('?')[0]

    if (!isLoggedIn()) {
        if (route !== '#/login' && route !== '#/signup') {
            window.location.hash = '#/login'
        }
        main.appendChild(renderLogin(route === '#/signup'))
    } else if (route === '#/pong/play') {
        main.appendChild(renderPongPlay())
    } else if (route === '#/pong') {
        main.appendChild(renderPong())
    } else if (route.startsWith('#/profile')) {
        main.appendChild(renderProfile())
    } else {
        main.appendChild(renderHome())
    }

    app.appendChild(main)
    app.appendChild(createFooter())
}