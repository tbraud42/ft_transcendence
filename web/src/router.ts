import { isLoggedIn } from './auth.ts'
import { renderLogin } from './pages/login.ts'
import { renderHome } from './pages/home.ts'
import { createHeader } from './components/header.ts'
import { createFooter } from './components/footer.ts'
import {renderProfile} from "./pages/profile";

export function router(): void {
    const app = document.getElementById('app')
    if (!app) return

    app.innerHTML = ''
    app.appendChild(createHeader())

    const main = document.createElement('main')
    main.className = 'flex-grow p-0 flex justify-center items-center min-h-[70vh]'

    const route = window.location.hash

    if (!isLoggedIn()) {
        const isSignup = route === '#/signup'
        main.appendChild(renderLogin(isSignup))
    } else if (route.startsWith('#/profile')) {
        main.appendChild(renderProfile())
        app.appendChild(main)
        app.appendChild(createFooter())
        return
    } else {
        switch (route) {
            case '#/home':
                main.appendChild(renderHome())
                break
            default:
                window.location.hash = '#/home'
                return
        }
    }

    app.appendChild(main)
    app.appendChild(createFooter())
}