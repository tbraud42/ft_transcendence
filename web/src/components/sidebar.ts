import { createSidebarButton } from './sidebarButton'

interface SidebarButtonConfig {
    label: string
    href: string | (() => void)
    color?: 'default' | 'red'
}

export function createSidebar(buttons: SidebarButtonConfig[]): HTMLElement {
    const sidebar = document.createElement('aside')
    sidebar.className = 'w-48 bg-gray-800 text-white p-4 flex flex-col gap-4 rounded-r-xl'

    for (const btn of buttons) {
        const buttonEl =
            typeof btn.href === 'string'
                ? createSidebarButton(btn.label, btn.href, btn.color)
                : createSidebarButton(btn.label, 'button', btn.color)

        if (typeof btn.href === 'function') {
            buttonEl.onclick = btn.href
        }

        sidebar.appendChild(buttonEl)
    }

    return sidebar
}