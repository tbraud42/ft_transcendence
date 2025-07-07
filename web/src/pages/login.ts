import i18next from '../i18n.ts'
import { login } from '../auth.ts'
import googleIcon from '../img/google.webp'

export function renderLogin(isSignupDefault: boolean = false): HTMLElement {
    const isSignup = { value: isSignupDefault }

    const container = document.createElement('div')
    container.className = 'max-w-md mx-auto text-center space-y-6'

    const title = document.createElement('h2')
    title.className = 'text-2xl font-bold'
    title.textContent = i18next.t('login_title')

    const form = document.createElement('form')
    form.className = 'space-y-4'

    const pseudoInput = document.createElement('input')
    pseudoInput.type = 'text'
    pseudoInput.placeholder = i18next.t('login_pseudo')
    pseudoInput.required = true
    pseudoInput.className = 'w-full p-2 rounded text-black'

    const passwordInput = document.createElement('input')
    passwordInput.type = 'password'
    passwordInput.placeholder = i18next.t('login_password')
    passwordInput.required = true
    passwordInput.className = 'w-full p-2 rounded text-black'

    const passwordConfirm = document.createElement('input')
    passwordConfirm.type = 'password'
    passwordConfirm.placeholder = i18next.t('signup_password_confirm')
    passwordConfirm.className = 'w-full p-2 rounded text-black'
    if (!isSignup.value) passwordConfirm.classList.add('hidden')

    const errorMsg = document.createElement('p')
    errorMsg.className = 'text-red-500 text-sm h-5'

    const submitBtn = document.createElement('button')
    submitBtn.type = 'submit'
    submitBtn.className = 'bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white rounded w-full'
    submitBtn.textContent = i18next.t('login_signup')

    const switchLink = document.createElement('button')
    switchLink.type = 'button'
    switchLink.className = 'text-blue-400 underline'
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
    googleBtn.className = 'bg-red-500 hover:bg-red-600 px-4 py-2 text-white rounded w-full flex items-center justify-center gap-2'
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