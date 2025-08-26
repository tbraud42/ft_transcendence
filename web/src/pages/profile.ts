import i18next from '../utils/lang/i18n'
import { createInput } from '../components/input'
import { createButton } from '../components/button'
import { createSidebar } from '../components/sidebar'
import {getUsername, logout} from '../utils/auth/auth'
import {env} from "../utils/env";

export function renderProfile(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'flex min-h-[70vh] w-full'

    const sidebar = createSidebar([
        { label: i18next.t('profile_sidebar_home'), href: '#/home' },
        { label: i18next.t('profile_sidebar_profile'), href: '#/profile' },
        { label: i18next.t('profile_sidebar_settings'), href: '#/profile/settings' },
        { label: i18next.t('profile_sidebar_2fa'), href: '#/profile/2fa' },
        { label: i18next.t('home_logout'), href: () => logout(), color: 'red' },
    ])

    const content = document.createElement('div')
    content.className =
        'flex-1 p-6 ml-4 mr-4 bg-white/70 dark:bg-gray-800/80 rounded-xl backdrop-blur transition-all duration-300 ease-in-out'

    const hash = window.location.hash
    if (hash === '#/profile/settings') {
        content.appendChild(renderSettingsView())
    } else if (hash === '#/profile/2fa') {
        content.appendChild(render2faView())
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

    const newPasswordInput = createInput('password', i18next.t('settings_new_password'))
    const confirmNewPasswordInput = createInput('password', i18next.t('settings_confirm_new_password'))
    const currentPasswordInput = createInput('password', i18next.t('settings_current_password'))

    const message = document.createElement('p')
    message.className = 'text-sm text-green-500 h-5'

    const submitBtn = createButton(i18next.t('settings_submit'), 'submit', 'black')

    form.onsubmit = (e) => {
        e.preventDefault()
        const newPass = newPasswordInput.value.trim()
        const confirmNewPass = confirmNewPasswordInput.value.trim()
        const current = currentPasswordInput.value.trim()

        if (!confirmNewPass || !newPass || !current) {
            message.textContent = i18next.t('settings_error_empty_fields')
            return
        }

        const url = `https://${env.API_URL}/users`
        fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: getUsername(), oldPassword: current, newPassword: newPass }),
        }).then(res => {
            if (!res.ok) {
                if (res.status === 401) {
                    message.textContent = i18next.t('settings_error_incorrect_password')
                } else {
                    message.textContent = i18next.t('settings_error_mismatch')
                }
                return
            }
            message.textContent = i18next.t('settings_success_update')
            newPasswordInput.value = ''
            confirmNewPasswordInput.value = ''
            currentPasswordInput.value = ''
        })
    }

    form.append(newPasswordInput, confirmNewPasswordInput, currentPasswordInput, submitBtn, message)
    container.append(title, form)
    wrapper.appendChild(container)

    return wrapper
}

export function render2faView(): HTMLElement {
    const section = document.createElement('section')
    section.className = 'h-full flex flex-col justify-center items-center text-center gap-4'

    const title = document.createElement('h2')
    title.className = 'text-2xl font-bold text-gray-800 dark:text-white'
    title.textContent = i18next.t('2fa_title')

    const desc = document.createElement('p')
    desc.className = 'text-gray-600 dark:text-gray-300'
    desc.textContent = i18next.t('2fa_subtitle')

    section.append(title, desc)
    return section
}
