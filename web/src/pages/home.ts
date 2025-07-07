import i18next from '../i18n.ts'
import { getUsername, logout } from '../auth.ts'

export function renderHome(): HTMLElement {
    const div = document.createElement('div')
    div.className = 'text-center space-y-4'

    const title = document.createElement('h1')
    title.className = 'text-2xl font-bold'
    title.textContent = i18next.t('home_welcome', { user: getUsername() || '...' })

    const logoutBtn = document.createElement('button')
    logoutBtn.className = 'bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white'
    logoutBtn.textContent = i18next.t('home_logout')
    logoutBtn.onclick = logout

    div.appendChild(title)
    div.appendChild(logoutBtn)
    return div
}