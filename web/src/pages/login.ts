import i18next from '../i18n.ts'
import { login } from '../auth.ts'
import googleIcon from '../img/google.webp'
import { createInput } from '../components/input.ts'
import { createButton } from '../components/button.ts'

export function renderLogin(isSignupDefault: boolean = false): HTMLElement {
    const isSignup = { value: isSignupDefault }

    const container = document.createElement('div')
    container.className =
        'w-full max-w-md mx-auto px-8 py-10 bg-white/70 dark:bg-gray-800/80 ' +
        'backdrop-blur-md shadow-xl rounded-3xl space-y-6 text-center transition'

    const title = document.createElement('h2')
    title.className = 'text-2xl font-bold text-center'
    title.textContent = isSignup.value
        ? i18next.t('login_title')
        : i18next.t('login_signup')

    const form = document.createElement('form')
    form.className = 'space-y-4'

    const pseudoInput = createInput('text', i18next.t('login_pseudo'))
    const passwordInput = createInput('password', i18next.t('login_password'))
    const passwordConfirm = createInput('password', i18next.t('signup_password_confirm'))
    if (!isSignup.value) {
        passwordConfirm.classList.add('hidden')
        passwordConfirm.disabled = true
    }

    const errorMsg = document.createElement('p')
    errorMsg.className = 'text-red-500 text-sm h-5'

    const submitBtn = createButton(isSignup.value ? i18next.t('login_signup') : i18next.t('login_login'), 'submit', 'black')

    const switchLink = document.createElement('button')
    switchLink.type = 'button'
    switchLink.className = 'text-sm text-gray-500 dark:text-gray-300 hover:underline'

    switchLink.textContent = isSignup.value
        ? i18next.t('signup_switch_to_login')
        : i18next.t('login_switch_to_signup')

    form.onsubmit = isSignup.value ? handleSignup : handleLogin

    switchLink.onclick = () => {
        isSignup.value = !isSignup.value
        window.location.hash = isSignup.value ? '#/signup' : '#/'
    }

    form.appendChild(pseudoInput)
    form.appendChild(passwordInput)
    form.appendChild(passwordConfirm)
    form.appendChild(errorMsg)
    form.appendChild(submitBtn)

    // Bouton Google avec icône
    const googleBtn = document.createElement('button')
    googleBtn.className =
        'flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-gray-300 dark:border-gray-600 ' +
        'bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition'
    googleBtn.onclick = () => login('GoogleUser')

    const icon = document.createElement('img')
    icon.src = googleIcon
    icon.alt = 'Google logo'
    icon.className = 'w-5 h-5'

    const text = document.createElement('span')
    text.textContent = i18next.t('login_google')

    googleBtn.appendChild(icon)
    googleBtn.appendChild(text)

    container.appendChild(title)
    container.appendChild(form)
    container.appendChild(switchLink)

    const orDivider = document.createElement('div')
    orDivider.className = 'flex items-center text-gray-400 text-sm my-4'

    const lineLeft = document.createElement('div')
    lineLeft.className = 'flex-grow border-t border-gray-300 dark:border-gray-600'

    const orText = document.createElement('span')
    orText.className = 'mx-4 whitespace-nowrap text-gray-500 dark:text-gray-400'
    orText.textContent = i18next.t('login_or')

    const lineRight = document.createElement('div')
    lineRight.className = 'flex-grow border-t border-gray-300 dark:border-gray-600'

    orDivider.appendChild(lineLeft)
    orDivider.appendChild(orText)
    orDivider.appendChild(lineRight)

    container.appendChild(orDivider)

    container.appendChild(googleBtn)

    // Handlers
    function handleLogin(e: SubmitEvent) {
        e.preventDefault()
        const user = pseudoInput.value
        const pass = passwordInput.value
        if (!user || !pass) {
            errorMsg.textContent = i18next.t('login_error_empty')
            return
        }
        login(user)
    }

    function handleSignup(e: SubmitEvent) {
        e.preventDefault()
        const user = pseudoInput.value
        const pass = passwordInput.value
        const confirm = passwordConfirm.value

        if (pass !== confirm) {
            errorMsg.textContent = i18next.t('signup_error_mismatch')
            return
        }
        login(user)
    }

    return container
}