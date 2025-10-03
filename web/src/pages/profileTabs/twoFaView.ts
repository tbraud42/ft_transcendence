
export function render2faView(): HTMLElement {
    const section = h('section', 'h-full flex flex-col justify-center items-center text-center gap-4')
    const title = h('h2', 'text-2xl font-bold text-gray-800 dark:text-white', i18n.t('2fa_title'))
    const desc = h('p', 'text-gray-600 dark:text-gray-300', i18n.t('2fa_subtitle'))
    const status = h('p', 'min-h-[1.25rem] text-sm', '')
    section.append(title, desc, status)

    const btnSetup = createButton(i18n.t('2fa_enable'), 'button', 'black')
    const qrImg = document.createElement('img')
    qrImg.className = 'mx-auto rounded shadow hidden'
    qrImg.alt = '2FA QR Code'

    const secretWrap = h('div', 'hidden w-full max-w-md text-left space-y-2')
    const secretRow = h('div', 'flex gap-2')
    const secretInput = document.createElement('input')
    secretInput.type = 'text'
    secretInput.readOnly = true
    secretInput.className = 'flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 px-3 py-2 text-sm'
    const copyBtn = createButton(i18n.t('2fa_copy'), 'button', 'black') as HTMLButtonElement
    copyBtn.type = 'button'
    copyBtn.disabled = true
    secretRow.append(secretInput, copyBtn)
    secretWrap.append(secretRow)

    copyBtn.onclick = () => copy(secretInput.value, status)

    const form = document.createElement('form')
    form.className = 'space-y-3 hidden'
    const codeInput = createInput('text', i18n.t('2fa_code'))
    codeInput.maxLength = 6
    codeInput.inputMode = 'numeric'
    codeInput.placeholder = '123456'
    const btnVerify = createButton(i18n.t('2fa_submit'), 'submit', 'black')
    form.append(codeInput, btnVerify)

    btnSetup.onclick = async () => {
        setToast(status, 'info', i18n.t('2fa_generating'))
        const data = await api2faSetup()
        if (!data) {
            setToast(status, 'success', i18n.t('2fa_already_enabled'))
            return
        }
        if (data.qrCode) {
            qrImg.src = data.qrCode
            qrImg.classList.remove('hidden')
        }
        secretInput.value = data.secret || ''
        copyBtn.disabled = !data.secret
        secretWrap.classList.remove('hidden')
        form.classList.remove('hidden')
        setToast(status, 'info', i18n.t('2fa_scan_qr'))
    }

    form.onsubmit = async (e) => {
        e.preventDefault()
        const code = codeInput.value.trim()
        if (!code) {
            setToast(status, 'error', i18n.t('2fa_code_required'))
            return
        }
        setToast(status, 'info', i18n.t('2fa_verifying'))
        const ok = await twofaVerify(code)
        if (ok) {
            setToast(status, 'success', i18n.t('2fa_success_enabled'))
            codeInput.value = ''
            hideSetupUI()
        } else {
            setToast(status, 'error', i18n.t('2fa_error_invalid'))
        }
    }

    function hideSetupUI() {
        btnSetup.classList.add('hidden')
        qrImg.classList.add('hidden')
        secretWrap.classList.add('hidden')
        form.classList.add('hidden')
    }

    section.append(btnSetup, qrImg, secretWrap, form)
    return section
}

function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, txt?: string) {
    const n = document.createElement(tag)
    n.className = cls
    if (txt) {
        n.textContent = txt
    }
    return n
}

async function copy(text: string, status: HTMLParagraphElement) {
    if (!text) {
        return
    }
    try {
        await navigator.clipboard.writeText(text)
        setToast(status, 'success', i18n.t('2fa_copied'))
    } catch {
        setToast(status, 'error', i18n.t('2fa_copy_failed'))
    }
}
