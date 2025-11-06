import i18n from '../utils/lang/i18n'
import {navigateTo, router} from '../utils/router'
// @ts-ignore
import { createButton } from './button'
import {getAvatar, isLoggedIn, setLanguage} from "../utils/storage";
import profileIcon from '../img/profile-icon.svg'

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
        navigateTo('/home')
    }
    return btn
}

function createControls(): HTMLDivElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'flex items-center gap-3'

    wrapper.append(
        createLangSelect(),
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

function createProfileButton(): HTMLButtonElement {
    let avatar = profileIcon
    if (isLoggedIn()) {
        avatar = getAvatar();
    }

    const btn = createButton('', 'button', 'black');
    btn.className = 'w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition';

    const icon = document.createElement('img');
    icon.src = avatar;
    icon.alt = 'Profile Icon';

    if (avatar.startsWith('data:image/')) {
        icon.className = 'w-9 h-9 object-cover rounded-full';
    } else {
        icon.className = 'w-5 h-5';
    }

    btn.appendChild(icon);
    btn.title = i18n.t('header_profile');

    btn.onclick = () => {
        const currentPath = window.location.pathname;
        navigateTo(currentPath === '/profile' ? '/home' : '/profile');
        router();
    };

    return btn;
}