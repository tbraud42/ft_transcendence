import { GDPROverlay } from "./GDPROverlay";
import i18n from "../utils/lang/i18n";

export function createFooter(): HTMLElement {
    const footer = document.createElement('footer');
    footer.className = 'bg-gray-800 text-white text-center px-4 py-3 mt-auto rounded-t-xl flex flex-col items-center gap-2';

    const text = document.createElement('p');
    text.textContent = 'ft_transcendence project';

    const gdprBtn = document.createElement('button');
    gdprBtn.className = 'text-xs text-gray-400 hover:text-white underline transition';
    gdprBtn.textContent = i18n.t('terms_title')
    gdprBtn.onclick = () => {
        const overlay = GDPROverlay();
        document.body.appendChild(overlay.element);
    };

    footer.append(text, gdprBtn);
    return footer;
}