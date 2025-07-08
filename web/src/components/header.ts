import i18next from '../i18n.ts'
import { router } from '../router.ts'
import profileIcon from '../img/profile-icon.svg'
import {createButton} from "./button";

export function createHeader(): HTMLElement {
    const header = document.createElement('header')
    header.className = 'bg-gray-800 text-white px-6 py-4 flex justify-between items-center rounded-b-2xl shadow-md'

    const title = document.createElement('button')
    title.className = 'text-xl font-bold hover:underline'
    title.textContent = i18next.t('app_title')
    title.onclick = () => {
        window.location.hash = '#/home'
    }

    const controls = document.createElement('div')
    controls.className = 'flex items-center gap-3'

    const langSelect = document.createElement('select')
    langSelect.className =
        'bg-gray-700 text-white dark:bg-gray-700 dark:text-white px-3 py-2 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition'

    for (const lang of ['en', 'fr']) {
        const opt = document.createElement('option')
        opt.value = lang
        opt.text = lang === 'en' ? '🇬🇧' : '🇫🇷'
        if (lang === i18next.language) {
            opt.selected = true
        }
        langSelect.appendChild(opt)
    }

    langSelect.onchange = () => {
        i18next.changeLanguage(langSelect.value).then(() => {
            localStorage.setItem('lang', langSelect.value)
            router()
            updateThemeLabel()
        })
    }

    const themeToggle = document.createElement('button')
    themeToggle.className =
        'px-3 py-2 rounded-xl bg-gray-700 text-white text-sm hover:bg-gray-600 dark:hover:bg-gray-500 transition shadow-sm'

    function updateThemeLabel() {
        const isDark = document.documentElement.classList.contains('dark')
        themeToggle.textContent = isDark
            ? `☀️`
            : `🌙`
    }

    updateThemeLabel()

    themeToggle.onclick = () => {
        document.documentElement.classList.toggle('dark')
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
        updateThemeLabel()
    }

    const profileBtn = createButton('', 'button', 'black')
    profileBtn.className = 'w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition'

    const icon = document.createElement('img')
    icon.src = profileIcon
    icon.alt = 'Profile Icon'
    icon.className = 'w-5 h-5'

    profileBtn.appendChild(icon)
    profileBtn.title = i18next.t('header_profile')
    profileBtn.onclick = () => {
        if (window.location.hash === '#/profile') {
            window.location.hash = '#/home'
        } else {
            window.location.hash = '#/profile'
        }
    }

    controls.appendChild(langSelect)
    controls.appendChild(themeToggle)
    controls.appendChild(profileBtn)

    header.appendChild(title)
    header.appendChild(controls)

    return header
}