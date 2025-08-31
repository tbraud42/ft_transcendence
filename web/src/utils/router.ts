import { isLoggedIn } from './storage'
import { renderHome } from '../pages/home'
import { renderPong } from '../pages/pongMenu'
import { renderProfile } from '../pages/profile'
import { renderPongPlay } from '../pages/pongPlay'
import { renderPongLobby } from '../pages/pongLobby'
import { createHeader } from '../components/header'
import { createFooter } from '../components/footer'
import {env} from "./env"
import {renderAuth} from "../pages/auth";

const PONG_WS_URL = env.PONG_WS_URL

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

    app.innerHTML = ''
    app.appendChild(createHeader())

    const main = document.createElement('main')
    main.className = 'flex-grow p-4'

    if (!isLoggedIn()) {
        main.appendChild(renderAuth(mainPage as 'login' | 'signup' | '2fa'))
    } else {
        switch (mainPage) {
        case 'pong':
            if (subPage === 'play') {
                main.appendChild(renderPongPlay());
            } else if (subPage === 'lobby' && param) {
                main.appendChild(renderPongLobby(param, "wss://" + PONG_WS_URL));
            } else {
                const activeTab = subPage || 'online';
                main.appendChild(renderPong(activeTab));
            }
            break;
        case 'profile': {
            main.appendChild(renderProfile(subPage))
            break
        }
        case '':
            main.appendChild(renderHome())
            break
        default:
            main.appendChild(renderHome())
            window.location.hash = '#/'
            break
        }
    }

    app.appendChild(main)
    app.appendChild(createFooter())
}