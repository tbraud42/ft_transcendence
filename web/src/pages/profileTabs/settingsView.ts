import i18n from '../../utils/lang/i18n';
import { createInput } from '../../components/input';
import { createButton } from '../../components/button';
import { changeUserPass } from '../../api/methode';

export function renderSettingsView(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'h-full flex justify-center items-center';

    const container = document.createElement('div');
    container.className = 'space-y-6 max-w-md text-center';

    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold text-gray-800 dark:text-white';
    title.textContent = i18n.t('settings_title');

    const form = document.createElement('form');
    form.className = 'space-y-4';

    const newPasswordInput = createInput('password', i18n.t('settings_new_password'));
    const confirmNewPasswordInput = createInput('password', i18n.t('settings_confirm_new_password'));
    const currentPasswordInput = createInput('password', i18n.t('settings_current_password'));

    const message = document.createElement('p');
    message.className = 'text-sm text-green-500 h-5';

    const submitBtn = createButton(i18n.t('settings_submit'), 'submit', 'black');

    form.onsubmit = async (e) => {
        e.preventDefault();

        const newPass = newPasswordInput.value.trim();
        const confirmNewPass = confirmNewPasswordInput.value.trim();
        const current = currentPasswordInput.value.trim();

        if (!confirmNewPass || !newPass || !current) {
            message.textContent = i18n.t('settings_error_empty_fields');
            return;
        }
        if (newPass !== confirmNewPass) {
            message.textContent = i18n.t('settings_error_mismatch');
            return;
        }
        try {
            await changeUserPass(current, newPass);
            message.textContent = i18n.t('settings_success_update');
            newPasswordInput.value = '';
            confirmNewPasswordInput.value = '';
            currentPasswordInput.value = '';
        } catch (err) {
            if (err === 'incorrect_password') {
                message.textContent = i18n.t('settings_error_incorrect_password');
            } else {
                console.log(err)
                message.textContent = String(err);
            }
        }
    };

    form.append(newPasswordInput, confirmNewPasswordInput, currentPasswordInput, submitBtn, message);
    container.append(title, form);
    wrapper.appendChild(container);

    return wrapper;
}
