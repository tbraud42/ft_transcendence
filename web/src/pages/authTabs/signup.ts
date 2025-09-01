import i18n from '../../utils/lang/i18n'
import { createInput } from '../../components/input'
import { createButton } from '../../components/button'
import { createAuthContainer } from '../../components/authContainer'
import { handleSignup } from '../../utils/auth'

export function renderSignupTab(): HTMLElement {
    const container = createAuthContainer()

    const title = document.createElement('h2')
    title.className = 'text-2xl font-bold text-center'
    title.textContent = i18n.t('login_signup')

    const form = document.createElement('form')
    form.className = 'space-y-4'
    form.method = 'post'

    const pseudoInput = createInput('text', i18n.t('login_pseudo'))
    pseudoInput.name = 'username'

    const passwordInput = createInput('password', i18n.t('login_password'))
    passwordInput.name = 'password'

    const passwordConfirm = createInput('password', i18n.t('signup_password_confirm'))
    passwordConfirm.name = 'password_confirm'

    const errorMsg = document.createElement('p')
    errorMsg.className = 'text-red-500 text-sm h-5'

    const submitBtn = createButton(i18n.t('login_signup'), 'submit', 'black')

    const switchBtn = document.createElement('button')
    switchBtn.type = 'button'
    switchBtn.className = 'text-sm text-gray-500 dark:text-gray-300 hover:underline'
    switchBtn.textContent = i18n.t('signup_switch_to_login')
    switchBtn.onclick = () => {
        window.location.hash = '#/login' 
    }

    form.onsubmit = (e) => handleSignup(e, pseudoInput, passwordInput, passwordConfirm, errorMsg)
    form.append(pseudoInput, passwordInput, passwordConfirm, errorMsg, submitBtn)

    container.append(title, form, switchBtn)
    return container
}