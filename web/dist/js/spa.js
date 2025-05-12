var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import LoginPage from './pages/LoginPage.js';
import HomePage from './pages/HomePage.js';
import { loadLanguage, getCurrentLang } from './lang/i18n.js';
import { applyTranslations } from './lang/i18n-dom.js';
const routes = {
    '/': LoginPage,
    '/home': HomePage,
};
function router() {
    const path = window.location.pathname;
    const contentDiv = document.getElementById('content');
    if (!contentDiv) {
        return;
    }
    const view = routes[path];
    if (view) {
        contentDiv.innerHTML = view();
    }
    else {
        contentDiv.innerHTML = '<h1>404 Not Found</h1>';
    }
    const styles = document.querySelectorAll('link[rel="stylesheet"][data-page-css]');
    styles.forEach((style) => {
        if (style.getAttribute('data-page-css') !== path) {
            style.remove();
        }
    });
    const scripts = document.querySelectorAll('script[data-page-js]');
    scripts.forEach((script) => {
        if (script.getAttribute('data-page-js') === path) {
            script.remove();
        }
    });
    applyTranslations();
}
function createLanguageSelector() {
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
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    yield loadLanguage(localStorage.getItem('lang') || 'fr-FR');
    const langSelector = createLanguageSelector();
    langSelector.value = getCurrentLang();
    langSelector.addEventListener('change', (e) => __awaiter(void 0, void 0, void 0, function* () {
        const target = e.target;
        yield loadLanguage(target.value);
        applyTranslations();
    }));
    const app = document.getElementById('app');
    const contentDiv = document.createElement('div');
    contentDiv.id = 'content';
    app.appendChild(contentDiv);
    router();
}));
window.addEventListener('popstate', router);
