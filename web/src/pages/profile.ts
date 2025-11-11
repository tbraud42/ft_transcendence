import i18n from '../utils/lang/i18n';
import { createSidebar } from '../components/sidebar';
import { renderProfileView } from './profileTabs/profileView';
import { renderSettingsView } from './profileTabs/settingsView';
import { render2faView } from './profileTabs/twoFaView';
import {logoutUser} from "../api/auth";

export function renderProfile(activeTabId: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'flex min-h-[70vh] w-full';

    const sidebar = createSidebar([
        { label: i18n.t('profile_sidebar_home'), href: '/home' },
        { label: i18n.t('profile_sidebar_profile'), href: '/profile' },
        { label: i18n.t('profile_sidebar_settings'), href: '/profile/settings' },
        { label: i18n.t('profile_sidebar_2fa'), href: '/profile/2fa' },
        { label: i18n.t('home_logout'), href: () => logoutUser(), color: 'red' },
    ]);

    const contentWrap = document.createElement('div');
    contentWrap.className =
        'flex-1 p-6 ml-4 mr-4 bg-white/70 dark:bg-gray-800/80 rounded-xl backdrop-blur transition-all duration-300 ease-in-out';

    let content: HTMLElement;
    switch (activeTabId) {
    case 'settings':
        content = renderSettingsView();
        break;
    case '2fa':
        content = render2faView();
        break;
    case 'profile':
    case '':
        content = renderProfileView();
        break;
    default:
        content = document.createElement('div');
        content.textContent = i18n.t('profile_not_found');
        break;
    }

    contentWrap.appendChild(content);
    container.append(sidebar, contentWrap);
    return container;
}