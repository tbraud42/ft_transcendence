import './style.css'
import { router } from './router.ts'
import faviconUrl from './img/favicon.webp'

const link = document.createElement('link')
link.rel = 'icon'
link.type = 'image/webp'
link.href = faviconUrl
document.head.appendChild(link)

window.addEventListener('DOMContentLoaded', router)
window.addEventListener('hashchange', router)