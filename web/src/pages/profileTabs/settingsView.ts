import i18n from '../../utils/lang/i18n';
import { createInput } from '../../components/input';
import { createButton } from '../../components/button';
import {changeUserPass, deleteUser, userMe} from '../../api/methode';
import {createOverlayCard} from "../../components/overlayCard";
import {clearStorage} from "../../utils/storage";

export function renderSettingsView(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'h-full flex justify-center items-center';

    const container = document.createElement('div');
    container.className = 'space-y-6 max-w-md text-center';

    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold text-gray-800 dark:text-white';
    title.textContent = i18n.t('settings_title');

    const form = createPasswordForm();
    const deleteAccountSection = createDeleteAccountButton(i18n.t('settings_delete_account_title'));

    container.append(title, form, deleteAccountSection);
    wrapper.appendChild(container);

    return wrapper;
}

function createPasswordForm(): HTMLElement {
    const form = document.createElement('form');
    form.className = 'space-y-4';

    const newPasswordInput = createInput('password', i18n.t('settings_new_password'));
    newPasswordInput.id = 'newPassword';
    newPasswordInput.autocomplete = 'new-password';
    const confirmNewPasswordInput = createInput('password', i18n.t('settings_confirm_new_password'));
    confirmNewPasswordInput.id = 'confirm_new_password';
    confirmNewPasswordInput.autocomplete = 'new-password';
    const currentPasswordInput = createInput('password', i18n.t('settings_current_password'));
    currentPasswordInput.id = 'currentPassword';
    currentPasswordInput.autocomplete = 'current-password';

    const message = document.createElement('p');
    message.className = 'text-red-500 text-sm h-5'
    message.setAttribute('role', 'alert');
    message.setAttribute('aria-live', 'polite');

    const submitBtn = createButton(i18n.t('settings_submit'), 'submit', 'black');

    const setMsg = (text: string, kind: 'ok'|'err'|'') => {
        message.textContent = text || '';
        message.classList.remove('text-green-500','text-red-500');
        if (kind === 'ok') message.classList.add('text-green-500');
        if (kind === 'err') message.classList.add('text-red-500');
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        setMsg('', '');

        const newPass = newPasswordInput.value.trim();
        const confirmNewPass = confirmNewPasswordInput.value.trim();
        const current = currentPasswordInput.value.trim();

        if (!confirmNewPass || !newPass || !current) {
            setMsg(i18n.t('settings_error_empty_fields'), 'err');
            return;
        }
        if (newPass !== confirmNewPass) {
            setMsg(i18n.t('settings_error_mismatch'), 'err');
            return;
        }

        submitBtn.disabled = true;

        try {
            await changeUserPass(current, newPass);
            setMsg(i18n.t('settings_success_update'), 'ok');
            newPasswordInput.value = '';
            confirmNewPasswordInput.value = '';
            currentPasswordInput.value = '';
        } catch (err: any) {
            const msg = (err && err.message) ? err.message : i18n.t('error_generic');
            setMsg(msg, 'err');
        } finally {
            submitBtn.disabled = false;
        }
    };

    form.append(newPasswordInput, confirmNewPasswordInput, currentPasswordInput, submitBtn, message);
    return form;
}

const createDeleteAccountButton = (label: string): HTMLButtonElement => {
    const btn = createButton(label, 'button', 'red');

    btn.onclick = () => {
        const pwd = createInput('password', i18n.t('auth_password_placeholder'));
        pwd.id = 'delete-account-password-input';
        pwd.autocomplete = 'current-password';
        pwd.classList.add(
            'w-full',
            'text-center',
            'border',
            'border-neutral-600',
            'rounded-md',
            'px-3',
            'py-2',
            'bg-neutral-800',
            'text-white',
            'placeholder-neutral-400',
            'focus:outline-none',
            'focus:ring-2',
            'focus:ring-red-500'
        );

        const info = document.createElement('p');
        info.className = 'text-sm text-neutral-300 text-center mb-2';
        info.textContent = i18n.t('settings_delete_account_confirm_message');

        const warning = document.createElement('p');
        warning.className = 'text-sm text-red-500 text-center font-medium mb-4';
        warning.textContent =
            i18n.t('settings_delete_account_warning') ||
            '⚠ This action is irreversible. Once deleted, your account and data cannot be recovered.';

        const actions = document.createElement('div');
        actions.className = 'flex justify-center gap-3 mt-4';

        const cancel = createButton(i18n.t('common_cancel') || 'Cancel', 'button', 'gray');
        cancel.classList.add('px-6', 'py-2', 'rounded-md', 'bg-neutral-700', 'hover:bg-neutral-600');

        const confirm = createButton(i18n.t('common_confirm') || 'Confirm', 'button', 'red');
        confirm.classList.add('px-6', 'py-2', 'rounded-md', 'bg-red-600', 'hover:bg-red-700');

        actions.append(cancel, confirm);

        const overlay = createOverlayCard({
            title: i18n.t('settings_delete_account_confirm_title'),
            children: [info, warning, pwd, actions],
        });

        overlay.element.classList.add('flex', 'items-center', 'justify-center', 'bg-black/70');
        overlay.element.querySelector('.overlay-card')?.classList.add(
            'text-center',
            'bg-neutral-900',
            'text-white',
            'border',
            'border-neutral-700',
            'shadow-2xl',
            'p-6',
            'rounded-lg'
        );

        cancel.onclick = () => overlay.close();
        confirm.onclick = () => {
            const password = pwd.value.trim();
            userMe().then((user) => {
                deleteUser(user.info.id, password)
                    .then((res) => {
                        if (res.error) {
                            const errorOverlay = createOverlayCard({
                                title: i18n.t('settings_delete_account_password_error'),
                            })
                            document.body.appendChild(errorOverlay.element)
                            return;
                        }
                        overlay.close();
                        clearStorage()
                        window.location.href = '/';
                    })
            })
            overlay.close();
        };

        document.body.appendChild(overlay.element);
    };

    return btn;
};