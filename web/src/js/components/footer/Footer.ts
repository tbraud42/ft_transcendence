import { loadLanguage, getCurrentLang } from '../../lang/i18n.js';
import { applyTranslations } from '../../lang/i18n-dom.js';

export function AddFooter(parent: HTMLElement | null) {
    if (!parent) {
        throw new Error('Parent element for Footer is null');
    }

    const footer = document.createElement('footer');
    footer.id = 'footer';

    const langMenu = document.createElement('div');
    langMenu.id = 'lang-menu';

    const select = document.createElement('select');
    select.id = 'lang-selector';

    const languages = [
        'en-US',
        'fr-FR',
    ];

    for (const lang of languages) {
        const option = document.createElement('option');
        option.value = lang;
        option.setAttribute('data-i18n', `langs.${lang}`);
        select.appendChild(option);
    }

    select.value = getCurrentLang();

    select.addEventListener('change', async (e: Event) => {
        const target = e.target as HTMLSelectElement;
        await loadLanguage(target.value);
        applyTranslations();
        localStorage.setItem('lang', target.value);
    });

    langMenu.appendChild(select);
    footer.appendChild(langMenu);
    parent.appendChild(footer);
}