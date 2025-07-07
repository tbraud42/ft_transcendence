import i18next from 'i18next'
import en from './lang/en.json'
import fr from './lang/fr.json'

const savedLang = localStorage.getItem('lang')
const browserLang = navigator.language.slice(0, 2)
const supportedLangs = ['en', 'fr']
const initialLang = savedLang || (supportedLangs.includes(browserLang) ? browserLang : 'en')

i18next.init({
    lng: initialLang,
    fallbackLng: 'en',
    resources: {
        en: { translation: en },
        fr: { translation: fr }
    }
})

export default i18next