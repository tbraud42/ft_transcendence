import i18n from '../../utils/lang/i18n'
// @ts-ignore
import ftIcon from '../../img/42.webp'
import { createInput } from '../../components/input'
import { createButton } from '../../components/button'
import { createAuthContainer } from '../../components/authContainer'
import { createDivider } from '../../components/divider'
import { handleFtLogin, handleLogin } from '../../utils/auth'
import {navigateTo} from "../../utils/router";

export function renderLoginTab(): HTMLElement {
    const container = createAuthContainer()

    const title = document.createElement('h2')
    title.className = 'text-2xl font-bold text-center'
    title.textContent = i18n.t('login_login')

    const form = document.createElement('form')
    form.className = 'space-y-4'
    form.method = 'post'

    const pseudoInput = createInput('text', i18n.t('login_pseudo'))
    pseudoInput.name = 'username'
    pseudoInput.autocomplete = 'username'
    const passwordInput = createInput('password', i18n.t('login_password'))
    passwordInput.name = 'password'
    passwordInput.autocomplete = 'current-password';

    const errorMsg = document.createElement('p')
    errorMsg.className = 'text-red-500 text-sm min-h-[1.25rem]'

    const submitBtn = createButton(i18n.t('login_login'), 'submit', 'black')

    const switchBtn = document.createElement('button')
    switchBtn.type = 'button'
    switchBtn.className = 'text-sm text-gray-500 dark:text-gray-300 hover:underline'
    switchBtn.textContent = i18n.t('login_switch_to_signup')
    switchBtn.onclick = () => {
        navigateTo('/signup')
    }

    form.onsubmit = (e) => {
        handleLogin(e, pseudoInput, passwordInput, errorMsg).then((need_two_fa) => {
            if (need_two_fa) {
                navigateTo('/2fa')
            }
        })
    }
    form.append(pseudoInput, passwordInput, errorMsg, submitBtn)

    const ftBtn = createFtButton()

    container.append(title, form, switchBtn, createDivider(i18n.t('login_or')), ftBtn)
    return container
}

function createFtButton(): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-gray-300 dark:border-gray-600 ' +
        'bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition'
    btn.onclick = (e) => {
        e.preventDefault(); handleFtLogin() 
    }

    const icon = document.createElement('img')
    icon.src = ftIcon
    icon.alt = '42 logo'
    icon.className = 'w-6 h-6'

    const text = document.createElement('span')

    btn.append(icon, text)
    return btn
}