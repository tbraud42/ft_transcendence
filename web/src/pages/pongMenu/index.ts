import i18n from '../../utils/lang/i18n'
import { buildPongTabs } from './tabs'

/**
 * Public API to render the embedded Pong menu (title + tabs).
 * Usage: container.appendChild(renderPongMenu())
 */
export function renderPongMenu(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'flex flex-col gap-4'

    // Centered title
    const header = document.createElement('div')
    header.className = 'w-full flex items-center justify-center'
    const title = document.createElement('h2')
    title.className = 'text-2xl font-semibold text-center'
    title.textContent = i18n.t('pong_menu_title')
    header.appendChild(title)

    // Tabs block
    const tabsRoot = document.createElement('div')
    buildPongTabs(tabsRoot)

    container.append(header, tabsRoot)
    return container
}
