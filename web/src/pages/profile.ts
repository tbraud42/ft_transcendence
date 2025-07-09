import i18next from '../utils/lang/i18n'
import { createInput } from '../components/input'
import { createButton } from '../components/button'
import { createSidebar } from '../components/sidebar'
import { logout } from '../utils/auth/auth'

export function renderProfile(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'flex min-h-[70vh] w-full'

    // Sidebar
    const sidebar = createSidebar([
        { label: i18next.t('profile_sidebar_home'), href: '#/home' },
        { label: i18next.t('profile_sidebar_profile'), href: '#/profile' },
        { label: i18next.t('profile_sidebar_settings'), href: '#/profile/settings' },
        { label: i18next.t('home_logout'), href: () => logout(), color: 'red' },
    ])

    // Main content
    const content = document.createElement('div')
    content.className =
        'flex-1 p-6 ml-4 mr-4 bg-white/70 dark:bg-gray-800/80 rounded-xl backdrop-blur transition-all duration-300 ease-in-out'

    const hash = window.location.hash
    if (hash === '#/profile/settings') {
        content.appendChild(renderSettingsView())
    } else {
        content.appendChild(renderProfileView())
    }

    container.append(sidebar, content)
    return container
}

export function renderProfileView(): HTMLElement {
    const section = document.createElement('section')
    section.className = 'h-full flex flex-col justify-center items-center text-center gap-4'

    const title = document.createElement('h2')
    title.className = 'text-2xl font-bold text-gray-800 dark:text-white'
    title.textContent = i18next.t('profile_title')

    const desc = document.createElement('p')
    desc.className = 'text-gray-600 dark:text-gray-300'
    desc.textContent = i18next.t('profile_welcome')

    section.append(title, desc)
    return section
}

export function renderSettingsView(): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'h-full flex justify-center items-center'

    const container = document.createElement('div')
    container.className = 'space-y-6 max-w-md text-center'

    const title = document.createElement('h2')
    title.className = 'text-2xl font-bold text-gray-800 dark:text-white'
    title.textContent = i18next.t('settings_title')

    const form = document.createElement('form')
    form.className = 'space-y-4'

    const pseudoInput = createInput('text', i18next.t('settings_new_username'))
    const currentPasswordInput = createInput('password', i18next.t('settings_current_password'))
    const newPasswordInput = createInput('password', i18next.t('settings_new_password'))

    const message = document.createElement('p')
    message.className = 'text-sm text-green-500 h-5'

    const submitBtn = createButton(i18next.t('settings_submit'), 'submit', 'black')

    form.onsubmit = (e) => {
        e.preventDefault()
        const pseudo = pseudoInput.value.trim()
        const current = currentPasswordInput.value.trim()
        const newPass = newPasswordInput.value.trim()

        if (!pseudo || !current || !newPass) {
            message.textContent = i18next.t('settings_error_empty_fields')
            return
        }

        // Simulate success
        setTimeout(() => {
            message.textContent = i18next.t('settings_success_update')
            pseudoInput.value = ''
            currentPasswordInput.value = ''
            newPasswordInput.value = ''
        }, 1000)
    }

    form.append(pseudoInput, currentPasswordInput, newPasswordInput, submitBtn, message)
    container.append(title, form)
    wrapper.appendChild(container)

    return wrapper
}