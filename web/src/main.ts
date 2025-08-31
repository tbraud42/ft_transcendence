import './style.css'
import { router } from './utils/router'
import faviconUrl from './img/favicon.webp'
import {getTheme} from "./utils/storage";

const link = document.createElement('link')
link.rel = 'icon'
link.type = 'image/webp'
link.href = faviconUrl
document.head.appendChild(link)

const savedTheme = getTheme()
if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
}

window.addEventListener('DOMContentLoaded', router)
window.addEventListener('hashchange', router)
