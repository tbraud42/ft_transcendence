import i18n from '../../utils/lang/i18n'
import { renderOnlineTab } from './tabs/online'
import { renderOfflineTab } from './tabs/offline'

export type TabDef = { id: string; label: string; render: () => HTMLElement; accent: string }

/**
 * Mount the Pong tabs UI into a root element.
 * - Centered tab header
 * - Transparent content, inner content centered
 */
export function buildPongTabs(root: HTMLElement, defaultTabId: string = 'offline') {
    root.className = 'w-full'

    const tabHeaders = document.createElement('div')
    tabHeaders.className = 'w-full flex flex-wrap items-center justify-center gap-2 mb-2'

    const tabContent = document.createElement('div')
    tabContent.className = 'rounded-2xl bg-transparent text-white p-4 min-h-[360px] flex items-center justify-center'

    let activeTabId = defaultTabId

    const tabs: TabDef[] = [
        { id: 'offline', label: i18n.t('pong_tab_offline'), render: () => renderOfflineTab(), accent: 'bg-emerald-500' },
        { id: 'online',  label: i18n.t('pong_tab_online'),  render: () => renderOnlineTab(),  accent: 'bg-indigo-500' },
    ]

    const updateTabs = () => {
        tabHeaders.replaceChildren()
        tabContent.replaceChildren()

        tabs.forEach((tab) => {
            const isActive = activeTabId === tab.id
            const btn = document.createElement('button')
            btn.className = `px-3 py-2 rounded-xl text-sm font-medium transition
        ${isActive ? `${tab.accent} text-white` : 'bg-white/10 text-white/80 hover:bg-white/20'}`
            btn.textContent = tab.label
            btn.onclick = () => {
                activeTabId = tab.id; updateTabs() 
            }
            tabHeaders.appendChild(btn)
        })

        const selected = tabs.find(t => t.id === activeTabId)!
        const inner = document.createElement('div')
        inner.className = 'w-full max-w-xl mx-auto flex flex-col items-center justify-center'
        inner.appendChild(selected.render())
        tabContent.appendChild(inner)
    }

    updateTabs()
    root.append(tabHeaders, tabContent)
}
