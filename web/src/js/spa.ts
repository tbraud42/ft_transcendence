import LoginPage from './pages/LoginPage.js';
import HomePage from './pages/HomePage.js';

import { loadLanguage, getCurrentLang } from './lang/i18n.js';
import { applyTranslations } from './lang/i18n-dom.js';

type Route = {
    [key: string]: () => string;
};

const routes: Route = {
    '/': LoginPage,
    '/home': HomePage,
};

function router(): void {
    const path = window.location.pathname;
    const contentDiv = document.getElementById('content');
    if (!contentDiv) {
        return;
    }

    const view = routes[path];
    if (view) {
        contentDiv.innerHTML = view();
    } else {
        contentDiv.innerHTML = '<h1>404 Not Found</h1>';
    }

    const styles = document.querySelectorAll('link[rel="stylesheet"][data-page-css]');
    styles.forEach((style: Element) => {
        if (style.getAttribute('data-page-css') !== path) {
            style.remove();
        }
    });

    const scripts = document.querySelectorAll('script[data-page-js]');
    scripts.forEach((script: Element) => {
        if (script.getAttribute('data-page-js') === path) {
            script.remove();
        }
    });

    applyTranslations();
}

function createLanguageSelector(): HTMLSelectElement {
    const langMenu = document.createElement('div');
    langMenu.id = 'lang-menu';

    const select = document.createElement('select');
    select.id = 'lang-selector';

    const fr = document.createElement('option');
    fr.value = 'fr-FR';
    fr.textContent = 'Français';

    const en = document.createElement('option');
    en.value = 'en-US';
    en.textContent = 'English';

    select.appendChild(fr);
    select.appendChild(en);
    langMenu.appendChild(select);

    document.body.prepend(langMenu);

    return select;
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadLanguage(localStorage.getItem('lang') || 'fr-FR');

    const langSelector = createLanguageSelector();
    langSelector.value = getCurrentLang();
    langSelector.addEventListener('change', async (e: Event) => {
        const target = e.target as HTMLSelectElement;
        await loadLanguage(target.value);
        applyTranslations();
    });

    const app = document.getElementById('app') as HTMLElement;
    const contentDiv = document.createElement('div');
    contentDiv.id = 'content';
    app.appendChild(contentDiv);

    router();
});

window.addEventListener('popstate', router);