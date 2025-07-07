import { isLoggedIn } from './auth.ts'
import { renderLogin } from './pages/login.ts'
import { renderHome } from './pages/home.ts'
import { createHeader } from './components/header.ts'
import { createFooter } from './components/footer.ts'

export function router(): void {
    const app = document.getElementById('app')
    if (!app) return

    app.innerHTML = ''
    app.appendChild(createHeader())

    const main = document.createElement('main')
    main.className = 'flex-grow p-4 flex justify-center items-center'

    const route = window.location.hash

    if (!isLoggedIn()) {
        const isSignup = route === '#/signup'
        main.appendChild(renderLogin(isSignup))
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