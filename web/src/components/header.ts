import i18n from '../utils/lang/i18n.ts'
import { router } from '../utils/router.ts'
import profileIcon from '../img/profile-icon.svg'
import { createButton } from './button'
import {setLanguage, setTheme} from "../utils/storage";

export function createHeader(): HTMLElement {
    const header = document.createElement('header')
    header.className =
        'bg-gray-800 text-white px-6 py-4 flex justify-between items-center rounded-b-2xl shadow-md'

    const title = createTitle()
    const controls = createControls()

    header.append(title, controls)
    return header
}

function createTitle(): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.className = 'text-xl font-bold hover:underline transition'
    btn.textContent = i18n.t('app_title')
    btn.onclick = () => {
        window.location.hash = '#/home'
    }
    return btn
}

function createControls(): HTMLDivElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'flex items-center gap-3'

    wrapper.append(
        createLangSelect(),
        createThemeToggle(),
        createProfileButton()
    )
    return wrapper
}

function createLangSelect(): HTMLSelectElement {
    const select = document.createElement('select')
    select.className =
        'bg-gray-700 text-white px-3 py-2 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition'

    const langs: Record<string, string> = {
        en: '🇬🇧',
        fr: '🇫🇷',
    }

    Object.entries(langs).forEach(([code, emoji]) => {
        const opt = document.createElement('option')
        opt.value = code
        opt.textContent = emoji
        if (i18n.language === code) {
            opt.selected = true
        }
        select.appendChild(opt)
    })

    select.onchange = () => {
        const lang = select.value
        i18n.changeLanguage(lang).then(() => {
            setLanguage(lang)
            router()
        })
    }

    return select
}

function createThemeToggle(): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.className =
        'px-3 py-2 rounded-xl bg-gray-700 text-white text-sm hover:bg-gray-600 dark:hover:bg-gray-500 transition shadow-sm'

    function updateThemeLabel() {
        btn.textContent = isDark() ? '☀️' : '🌙'
    }

    function isDark(): boolean {
        return document.documentElement.classList.contains('dark')
    }

    updateThemeLabel()

    btn.onclick = () => {
        document.documentElement.classList.toggle('dark')
        setTheme(isDark() ? 'dark' : 'light')
        updateThemeLabel()
    }

    return btn
}

function createProfileButton(): HTMLButtonElement {
    const btn = createButton('', 'button', 'black')
    btn.className = 'w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition'

    const icon = document.createElement('img')
    icon.src = profileIcon
    icon.alt = 'Profile Icon'
    icon.className = 'w-5 h-5'

    btn.appendChild(icon)
    btn.title = i18n.t('header_profile')

    btn.onclick = () => {
        const hash = window.location.hash
        window.location.hash = hash === '#/profile' ? '#/home' : '#/profile'
    }

    return btn
}