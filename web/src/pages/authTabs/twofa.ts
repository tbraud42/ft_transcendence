import i18n from '../../utils/lang/i18n'
import { createInput } from '../../components/input'
import { createButton } from '../../components/button'
import { createAuthContainer } from '../../components/authContainer'
import {twofaVerify} from "../../api/auth";

export function renderTwofaTab(): HTMLElement {
    const container = createAuthContainer()

    const title = document.createElement('h2')
    title.className = 'text-2xl font-bold text-center'
    title.textContent = i18n.t('2fa_title')

    const form = document.createElement('form')
    form.className = 'space-y-4'
    form.method = 'post'

    const codeInput = createInput('text', i18n.t('2fa_code'))
    codeInput.name = 'otp'
    codeInput.maxLength = 6
    codeInput.inputMode = 'numeric'
    codeInput.placeholder = '123456'

    const errorMsg = document.createElement('p')
    errorMsg.className = 'text-red-500 text-sm h-5'

    const submitBtn = createButton(i18n.t('2fa_submit'), 'submit', 'black')

    form.onsubmit = async (e) => {
        e.preventDefault()
        const code = codeInput.value.trim()
        if (!code) {
            errorMsg.textContent = i18n.t('2fa_code_required') || 'Please enter your 6-digit code.'
            return
        }
        errorMsg.textContent = ''
        twofaVerify(code).then((success) => {
            if (success) {
                window.location.hash = '#/home'
            } else {
                errorMsg.textContent = i18n.t('2fa_code_invalid')
            }
        }).catch(() => {
            errorMsg.textContent = i18n.t('2fa_code_invalid')
        })
    }

    form.append(codeInput, errorMsg, submitBtn)

    container.append(title, form)
    return container
}