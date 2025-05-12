import { loadLanguage } from '../../js/lang/i18n.js';
import { applyTranslations } from '../../js/lang/i18n-dom.js';

(async function () {
    await loadLanguage(localStorage.getItem('lang') || 'fr-FR');
    applyTranslations();

    const form = document.getElementById('login-form') as HTMLFormElement | null;
    const loginButton = document.getElementById('loginBtn') as HTMLButtonElement | null;

    if (!form || !loginButton) return;

    form.addEventListener('submit', (e: Event) => {
        e.preventDefault();

        const usernameInput = form.querySelector<HTMLInputElement>('input[name="username"]');
        const passwordInput = form.querySelector<HTMLInputElement>('input[name="password"]');

        const username = usernameInput?.value.trim() || '';
        const password = passwordInput?.value.trim() || '';

        let errorDiv = document.getElementById('login-error') as HTMLDivElement | null;

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'login-error';
            loginButton.insertAdjacentElement('afterend', errorDiv);
        }

        errorDiv.textContent = '';

        if (!username || !password) {
            errorDiv.setAttribute('data-i18n', 'login.error_empty_fields');
            applyTranslations();

            if (!username) usernameInput?.focus();
            else passwordInput?.focus();
            return;
        }

        history.pushState(null, '', '/home');
        window.dispatchEvent(new PopStateEvent('popstate'));
    });
})();