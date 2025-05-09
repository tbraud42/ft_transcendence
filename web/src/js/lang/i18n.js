let dictionary = {};
let currentLang = localStorage.getItem('lang') || 'fr-FR';

export async function loadLanguage(lang) {
    const res = await fetch(`/lang/${lang}.json`);
    dictionary = await res.json();
    currentLang = lang;
    localStorage.setItem('lang', lang);
}

export function t(key) {
    const parts = key.split('.');
    let value = dictionary;

    for (const part of parts) {
        if (value && part in value) {
            value = value[part];
        } else {
            return `[${key}]`;
        }
    }

    return value;
}

export function getCurrentLang() {
    return currentLang;
}