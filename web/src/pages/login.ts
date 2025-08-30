import i18next from '../utils/lang/i18n'
import ftIcon from '../img/42.webp'
import { createInput } from '../components/input'
import { createButton } from '../components/button'
import { createAuthContainer } from '../components/authContainer'
import { createDivider } from '../components/divider'
import {handleFtLogin, handleLogin, handleSignup} from '../utils/auth/authHandlers'

export function renderLogin(): HTMLElement {
    const isSignup = window.location.hash === '#/signup'
    const container = createAuthContainer()

    const title = document.createElement('h2')
    title.className = 'text-2xl font-bold text-center'
    title.textContent = isSignup
        ? i18next.t('login_signup')
        : i18next.t('login_login')

    const form = document.createElement('form')
    form.className = 'space-y-4'

    const pseudoInput = createInput('text', i18next.t('login_pseudo'))
    const passwordInput = createInput('password', i18next.t('login_password'))
    const passwordConfirm = createInput('password', i18next.t('signup_password_confirm'))

    if (!isSignup) {
        passwordConfirm.classList.add('hidden')
        passwordConfirm.disabled = true
    }

    const errorMsg = document.createElement('p')
    errorMsg.className = 'text-red-500 text-sm h-5'

    const submitBtn = createButton(
        isSignup ? i18next.t('login_signup') : i18next.t('login_login'),
        'submit',
        'black'
    )

    const switchLink = document.createElement('button')
    switchLink.type = 'button'
    switchLink.className = 'text-sm text-gray-500 dark:text-gray-300 hover:underline'
    switchLink.textContent = isSignup
        ? i18next.t('signup_switch_to_login')
        : i18next.t('login_switch_to_signup')
    switchLink.onclick = () => {
        window.location.hash = isSignup ? '#/' : '#/signup'
    }

    form.onsubmit = (e) => {
        if (isSignup) {
            handleSignup(e, pseudoInput, passwordInput, passwordConfirm, errorMsg)
        } else {
            handleLogin(e, pseudoInput, passwordInput, errorMsg)
        }
    }

    form.append(
        pseudoInput,
        passwordInput,
        passwordConfirm,
        errorMsg,
        submitBtn
    )

    const ftBtn = createFtButton()

    container.append(
        title,
        form,
        switchLink,
        createDivider(i18next.t('login_or')),
        ftBtn
    )

    return container
}

function createFtButton(): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.className = 'flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-gray-300 dark:border-gray-600 ' +
        'bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition'
    btn.onclick = (e) => {
        e.preventDefault()
        handleFtLogin()
    }

    const icon = document.createElement('img')
    icon.src = ftIcon
    icon.alt = '42 logo'
    icon.className = 'w-6 h-6'

    const text = document.createElement('span')

    btn.append(icon, text)
    return btn
}