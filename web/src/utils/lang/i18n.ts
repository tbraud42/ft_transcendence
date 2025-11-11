// @ts-ignore
import i18n from 'i18next'
// @ts-ignore
import en from '../../lang/en.json'
// @ts-ignore
import fr from '../../lang/fr.json'
// @ts-ignore
import bzh from '../../lang/bzh.json'
import {getLanguage} from "../storage";

const savedLang = getLanguage()
const browserLang = navigator.language.slice(0, 2)
const supportedLangs = ['en', 'fr', 'bzh']
const initialLang = savedLang || (supportedLangs.includes(browserLang) ? browserLang : 'en')

i18n.init({
    lng: initialLang,
    fallbackLng: 'en',
    resources: {
        en: { translation: en },
        fr: { translation: fr },
        bzh: { translation: bzh },
    }
})

export function getLangs(): Record<string, string> {
    return {
        en: '🇬🇧',
        fr: '🇫🇷',
        bzh: '🏴‍☠️'
    }
}

export default i18n