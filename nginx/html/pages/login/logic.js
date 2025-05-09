import { t } from '../../core/i18n.js';
import { applyTranslations } from '../../core/i18n-dom.js';

(function () {
    const form = document.getElementById('login-form');
    if (!form) {
        console.warn("Form not found in logic.js");
        return;
    }

    const loginButton = document.getElementById('loginBtn');

    form.addEventListener('submit', e => {
        e.preventDefault();

        const username = form.username.value.trim();
        const password = form.password.value.trim();

        let errorDiv = document.getElementById('login-error');

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'login-error';
            loginButton.insertAdjacentElement('afterend', errorDiv);
        }

        errorDiv.textContent = '';

        if (!username || !password) {
            errorDiv.textContent = t("error_empty_fields");
            if (!username) {
                form.username.focus();
            } else {
                form.password.focus();
            }
            return;
        }

        history.pushState(null, null, '/home');
        window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Sélecteur de langue
    const langSelector = document.getElementById('lang-selector');
    if (langSelector) {
        langSelector.value = localStorage.getItem('lang') || 'fr-FR';

        langSelector.addEventListener('change', async (e) => {
            const lang = e.target.value;
            await import(`../../core/i18n.js`).then(({ loadLanguage }) => loadLanguage(lang));
            applyTranslations();
        });
    }
})();