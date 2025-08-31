import i18n from '../../utils/lang/i18n';

export function renderProfileView(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'h-full flex flex-col justify-center items-center text-center gap-4';

    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold text-gray-800 dark:text-white';
    title.textContent = i18n.t('profile_title');

    const desc = document.createElement('p');
    desc.className = 'text-gray-600 dark:text-gray-300';
    desc.textContent = i18n.t('profile_welcome');

    section.append(title, desc);
    return section;
}