import { loadLanguage } from '../../js/lang/i18n.js';
import { applyTranslations } from '../../js/lang/i18n-dom.js';

(async function () {
    await loadLanguage(localStorage.getItem('lang') || 'fr-FR');
    applyTranslations();

    const form = document.getElementById('login-form');
    const loginButton = document.getElementById('loginBtn');

    if (!form) return;

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
            let errorDiv = document.getElementById('login-error');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'login-error';
                errorDiv.setAttribute('data-i18n', 'login.error_empty_fields');
                loginButton.insertAdjacentElement('afterend', errorDiv);
            }

            errorDiv.setAttribute('data-i18n', 'login.error_empty_fields');

            applyTranslations();
            if (!username) form.username.focus();
            else form.password.focus();
            return;
        }

        history.pushState(null, null, '/home');
        window.dispatchEvent(new PopStateEvent('popstate'));
    });
})();