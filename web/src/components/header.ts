import i18n, {getLangs} from '../utils/lang/i18n'
import { navigateTo, router } from '../utils/router'
// @ts-ignore
import { createButton } from './button'
import { getAvatar, isLoggedIn, setLanguage } from "../utils/storage";
import profileIcon from '../img/profile-icon.svg'
import friendsIcon from '../img/friends-icon.svg'
import { renderFriendsPage } from "../pages/friends";

function openModal(opener: HTMLElement, content: HTMLElement, titleText = i18n.t('friends_title')): void {
    let overlay = document.getElementById('friends-overlay') as HTMLDivElement | null
    if (!overlay) {
        overlay = document.createElement('div')
        overlay.id = 'friends-overlay'
        overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'
        overlay.setAttribute('role', 'dialog')
        overlay.setAttribute('aria-modal', 'true')
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
        document.body.appendChild(overlay)
    } else {
        overlay.innerHTML = ''
    }

    function close() {
        overlay?.remove()
        opener.focus()
        document.removeEventListener('keydown', onKeyDown)
    }

    function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)

    const wrapper = document.createElement('div')
    wrapper.className = 'relative w-[90%] max-w-2xl'

    const panel = document.createElement('div')
    panel.className = 'w-full bg-gray-800 text-white rounded-2xl shadow-xl border border-gray-700 p-4'
    panel.tabIndex = -1

    const h = document.createElement('h2')
    h.id = 'friends-modal-title'
    h.className = 'text-lg font-semibold mb-2'
    h.textContent = titleText
    overlay.setAttribute('aria-labelledby', h.id)

    const closeBtn = document.createElement('button')
    closeBtn.className = 'absolute top-4 right-4 text-gray-300 hover:text-white'
    closeBtn.setAttribute('aria-label', i18n.t('close'))
    closeBtn.innerHTML = '✕'
    closeBtn.onclick = close

    panel.append(h, content)
    wrapper.append(panel, closeBtn)
    overlay.appendChild(wrapper)

    panel.focus()
}

export function createHeader(): HTMLElement {
    const header = document.createElement('header')
    header.className = 'bg-gray-800 text-white px-6 py-4 flex justify-between items-center rounded-b-2xl shadow-md'
    const title = createTitle()
    const controls = createControls()
    header.append(title, controls)
    return header
}

function createTitle(): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.className = 'text-xl font-bold hover:underline transition'
    btn.textContent = i18n.t('app_title')
    btn.onclick = () => navigateTo('/home')
    return btn
}

function createControls(): HTMLDivElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'flex items-center gap-3'
    wrapper.append(createLangSelect())
    if (isLoggedIn()) {
        wrapper.append(createFriendsButton())
    }
    wrapper.append(createProfileButton())
    return wrapper
}

function createLangSelect(): HTMLSelectElement {
    const select = document.createElement('select')
    select.id = 'language-select'
    select.className = 'bg-gray-700 text-white px-3 py-2 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition'

    Object.entries(getLangs()).forEach(([code, emoji]) => {
        const opt = document.createElement('option')
        opt.value = code
        opt.textContent = emoji
        if (i18n.language === code) opt.selected = true
        select.appendChild(opt)
    })

    select.onchange = () => {
        const lang = select.value
        i18n.changeLanguage(lang).then(() => { setLanguage(lang); router() })
    }
    return select
}

function createFriendsButton(): HTMLButtonElement {
    const btn = createButton('', 'button', 'black')
    btn.className = 'w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition'
    const icon = document.createElement('img')
    icon.src = friendsIcon
    icon.alt = 'Friends Icon'
    icon.className = 'w-5 h-5'
    btn.appendChild(icon)
    btn.title = i18n.t('friends_title')

    btn.onclick = () => openModal(btn, renderFriendsPage())
    return btn
}

function createProfileButton(): HTMLButtonElement {
    const avatar = isLoggedIn() ? getAvatar() : profileIcon
    const btn = createButton('', 'button', 'black')
    btn.className = 'w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition'

    const icon = document.createElement('img')
    icon.src = avatar
    icon.alt = 'Profile Icon'
    icon.className = avatar.startsWith('data:image/') ? 'w-9 h-9 object-cover rounded-full' : 'w-5 h-5'

    btn.appendChild(icon)
    btn.title = i18n.t('header_profile')
    btn.onclick = () => {
        const p = window.location.pathname
        navigateTo(p === '/profile' ? '/home' : '/profile')
        router()
    }
    return btn
}