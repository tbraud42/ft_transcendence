let currentLang = localStorage.getItem('lang') || 'fr-FR';
let dictionary = {};

export async function loadLanguage(lang) {
    const res = await fetch(`/lang/${lang}.json`);
    dictionary = await res.json();
    currentLang = lang;
    localStorage.setItem('lang', lang);
}

export function t(key) {
    return dictionary[key] || `[${key}]`;
}

export function getCurrentLang() {
    return currentLang;
}