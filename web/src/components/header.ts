import i18next from '../i18n.ts'
import { router } from '../router.ts'

export function createHeader(): HTMLElement {
    const header = document.createElement('header')
    header.className = 'bg-gray-800 text-white p-4 flex justify-between items-center'

    const title = document.createElement('h1')
    title.className = 'text-xl font-bold'
    title.textContent = i18next.t('app_title')

    const langSelect = document.createElement('select')
    langSelect.className = 'bg-gray-700 text-white p-1 rounded'

    for (const lang of ['en', 'fr']) {
        const opt = document.createElement('option')
        opt.value = lang
        opt.text = lang.toUpperCase()
        if (lang === i18next.language) opt.selected = true
        langSelect.appendChild(opt)
    }

    langSelect.onchange = () => {
        i18next.changeLanguage(langSelect.value).then(() => {
            localStorage.setItem('lang', langSelect.value)
            router()
        })
    }

    header.appendChild(title)
    header.appendChild(langSelect)
    return header
}