import {getToken, isLoggedIn, login} from './storage'
import { renderHome } from '../pages/home'
import { renderProfile } from '../pages/profile'
import { renderPongPlay } from '../pages/pongPlay'
import {renderLobby} from '../pages/pongLobby'
import { createHeader } from '../components/header'
import { createFooter } from '../components/footer'
import {env} from "./env"
import {renderAuth} from "../pages/auth";
import {request42Auth} from "../api/auth";

const PONG_WS_URL = env.PONG_WS_URL

export function router(): void {
    const app = document.getElementById('app')
    if (!app) {
        return
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

            const query = window.location.search;
            console.log(query)
            const params = new URLSearchParams(query);

            const code = params.get('code');
            const state = params.get('state');

            if (code && state) {
                request42Auth(code, state).then((res) => {
                    if (!res || !res.token || !res.user || !res.user.username) {
                        navigateTo('/login')
                        return
                    }
                    login(res.token, res.user.username);
                    navigateTo('/home')
                }).catch(() => {
                    navigateTo('/login')
                })
            } else {
                console.error('42 login failed: missing token or username in callback');
                navigateTo('/login')
            }
        } else {
            main.appendChild(renderAuth(mainPage as 'login' | 'signup' | '2fa'))
        }
    } else {
        switch (mainPage) {
        case 'pong':
            if (subPage === 'play') {
                main.appendChild(renderPongPlay(param));
            } else if (subPage === 'lobby' && param) {
                main.appendChild(renderLobby(param, "wss://" + PONG_WS_URL, getToken()));
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
            navigateTo('/', false)
            break
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