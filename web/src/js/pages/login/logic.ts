import { loadLanguage } from '../../lang/i18n.js';
import { applyTranslations } from '../../lang/i18n-dom.js';

(async function () {
    await loadLanguage(localStorage.getItem('lang') || 'fr-FR');
    applyTranslations();

    const form = document.getElementById('login-form') as HTMLFormElement | null;
    const loginButton = document.getElementById('loginBtn') as HTMLButtonElement | null;

    if (!form || !loginButton) return;

    form.addEventListener('submit', (e: Event) => {
        e.preventDefault();

        const usernameInput = document.getElementById('username') as HTMLInputElement | null;
        const passwordInput = document.getElementById('password') as HTMLInputElement | null;

        const username = usernameInput?.value.trim() || '';
        const password = passwordInput?.value.trim() || '';

        let errorDiv = document.getElementById('login-error') as HTMLDivElement | null;

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'login-error';
            loginButton.insertAdjacentElement('afterend', errorDiv);
        }

        errorDiv.textContent = '';

        console.log(`Username: ${username}, Password: ${password}`);

        if (!username || !password) {
            errorDiv.setAttribute('data-i18n', 'login.error_empty_fields');
            applyTranslations();

            if (!username) usernameInput?.focus();
            else passwordInput?.focus();
            return;
        }

        ///go to /home page
        window.location.href = '/home';
    });
})();