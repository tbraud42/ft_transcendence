// @ts-ignore
import i18n from 'i18next'
// @ts-ignore
import en from '../../lang/en.json'
// @ts-ignore
import fr from '../../lang/fr.json'
import {getLanguage} from "../storage";

const savedLang = getLanguage()
const browserLang = navigator.language.slice(0, 2)
const supportedLangs = ['en', 'fr']
const initialLang = savedLang || (supportedLangs.includes(browserLang) ? browserLang : 'fr')

i18n.init({
    lng: initialLang,
    fallbackLng: 'en',
    resources: {
        en: { translation: en },
        fr: { translation: fr }
    }
})

export default i18n