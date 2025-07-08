import i18next from '../i18n.ts'
import {createSidebarButton} from "../components/sidebarButton";
import { createInput } from '../components/input.ts'
import { createButton } from '../components/button.ts'
import {logout} from "../auth";

export function renderProfile(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'flex min-h-[70vh] w-full'

    const sidebar = document.createElement('aside')
    sidebar.className = 'w-48 bg-gray-800 text-white p-4 flex flex-col gap-4 rounded-r-xl'

    const homeBtn = createSidebarButton(i18next.t('profile_sidebar_home'), '#/home')
    const profileBtn = createSidebarButton(i18next.t('profile_sidebar_profile'), '#/profile')
    const settingsBtn = createSidebarButton(i18next.t('profile_sidebar_settings'), '#/profile/settings')
    const logoutBtn = createSidebarButton(i18next.t('home_logout'), 'button', 'red')
    logoutBtn.onclick = logout

    sidebar.appendChild(homeBtn)
    sidebar.appendChild(profileBtn)
    sidebar.appendChild(settingsBtn)
    sidebar.appendChild(logoutBtn)

    const content = document.createElement('div')
    content.className = 'flex-1 p-6 ml-4 mr-4 bg-white/70 dark:bg-gray-800/80 rounded-xl backdrop-blur transition-all duration-300 ease-in-out'

    const hash = window.location.hash
    if (hash === '#/profile/settings') {
        content.appendChild(renderSettingsView())
    } else {
        content.appendChild(renderProfileView())
    }

    container.appendChild(sidebar)
    container.appendChild(content)

    return container
}

export function renderProfileView(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'h-full flex flex-col justify-center items-center text-center gap-4'

    const title = document.createElement('h2')
    title.className = 'text-2xl font-bold text-gray-800 dark:text-white'
    title.textContent = 'Your Profile'

    const text = document.createElement('p')
    text.className = 'text-gray-600 dark:text-gray-300'
    text.textContent = 'Welcome to your profile page.'

    container.appendChild(title)
    container.appendChild(text)

    return container
}

export function renderSettingsView(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'h-full flex justify-center items-center'

    const inner = document.createElement('div')
    inner.className = 'space-y-6 max-w-md text-center'

    const title = document.createElement('h2')
    title.className = 'text-2xl font-bold text-gray-800 dark:text-white'
    title.textContent = i18next.t('settings_title')

    const form = document.createElement('form')
    form.className = 'space-y-4'

    const pseudoInput = createInput('text', i18next.t('settings_new_username'))
    const currentPasswordInput = createInput('password', i18next.t('settings_current_password'))
    const confirmInput = createInput('password', i18next.t('settings_new_password'))

    const submitBtn = createButton(i18next.t('settings_submit'), 'submit', 'black')

    const message = document.createElement('p')
    message.className = 'text-sm text-green-500 h-5'

    form.onsubmit = (e) => {
        e.preventDefault()
        const pseudo = pseudoInput.value.trim()
        const currentPassword = currentPasswordInput.value.trim()
        const newPassword = confirmInput.value.trim()

        if (!pseudo || !currentPassword || !newPassword) {
            message.textContent = i18next.t('settings_error_empty_fields')
            return
        }

        setTimeout(() => {
            message.textContent = i18next.t('settings_success_update')
            pseudoInput.value = ''
            currentPasswordInput.value = ''
            confirmInput.value = ''
        }, 1000)
    }

    form.appendChild(pseudoInput)
    form.appendChild(currentPasswordInput)
    form.appendChild(confirmInput)
    form.appendChild(submitBtn)
    form.appendChild(message)

    inner.appendChild(title)
    inner.appendChild(form)
    container.appendChild(inner)

    return container
}