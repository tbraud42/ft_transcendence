import i18next from '../i18n.ts'
import { getUsername, logout } from '../auth.ts'
import {createButton} from "../components/button";

export function renderHome(): HTMLElement {
    const div = document.createElement('div')
    div.className = 'text-center space-y-4'

    const title = document.createElement('h1')
    title.className = 'text-2xl font-bold text-center'
    title.textContent = i18next.t('home_welcome', { user: getUsername() || '...' })

    const logoutBtn = createButton(i18next.t('home_logout'), 'button', 'red')
    logoutBtn.onclick = logout

    div.appendChild(title)
    div.appendChild(logoutBtn)
    return div
}