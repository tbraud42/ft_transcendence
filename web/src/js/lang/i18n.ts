type Dictionary = Record<string, any>;

let dictionary: Dictionary = {};
let currentLang: string = localStorage.getItem('lang') || 'fr-FR';

export async function loadLanguage(lang: string): Promise<void> {
    const res = await fetch(`/lang/${lang}.json`);
    dictionary = await res.json();
    currentLang = lang;
    localStorage.setItem('lang', lang);
}

export function t(key: string): string {
    const parts = key.split('.');
    let value: any = dictionary;

    for (const part of parts) {
        if (value && part in value) {
            value = value[part];
        } else {
            return `[${key}]`;
        }
    }

    return typeof value === 'string' ? value : `[${key}]`;
}

export function getCurrentLang(): string {
    return currentLang;
}