import './style.css'
import { router } from './utils/router.ts'
import faviconUrl from './img/favicon.webp'

const link = document.createElement('link')
link.rel = 'icon'
link.type = 'image/webp'
link.href = faviconUrl
document.head.appendChild(link)

const savedTheme = localStorage.getItem('theme')
if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
}

window.addEventListener('DOMContentLoaded', router)
window.addEventListener('hashchange', router)