var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { loadLanguage } from '../../js/lang/i18n.js';
import { applyTranslations } from '../../js/lang/i18n-dom.js';
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadLanguage(localStorage.getItem('lang') || 'fr-FR');
        applyTranslations();
        const form = document.getElementById('login-form');
        const loginButton = document.getElementById('loginBtn');
        if (!form || !loginButton)
            return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = form.querySelector('input[name="username"]');
            const passwordInput = form.querySelector('input[name="password"]');
            const username = (usernameInput === null || usernameInput === void 0 ? void 0 : usernameInput.value.trim()) || '';
            const password = (passwordInput === null || passwordInput === void 0 ? void 0 : passwordInput.value.trim()) || '';
            let errorDiv = document.getElementById('login-error');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'login-error';
                loginButton.insertAdjacentElement('afterend', errorDiv);
            }
            errorDiv.textContent = '';
            if (!username || !password) {
                errorDiv.setAttribute('data-i18n', 'login.error_empty_fields');
                applyTranslations();
                if (!username)
                    usernameInput === null || usernameInput === void 0 ? void 0 : usernameInput.focus();
                else
                    passwordInput === null || passwordInput === void 0 ? void 0 : passwordInput.focus();
                return;
            }
            history.pushState(null, '', '/home');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });
    });
})();
