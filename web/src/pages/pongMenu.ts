import i18n from '../utils/lang/i18n'
import { createButton } from '../components/button'
import { renderOnlineTab } from './pongTabs/online'
import { renderOfflineTab } from './pongTabs/offline'
import { renderAITab } from './pongTabs/ai'
import {GameMode} from "../games/pong/pongState";

export function renderPong(activeTabId: string): HTMLElement {
    document.body.classList.add('pong-mode')

    const wrapper = document.createElement('div')
    wrapper.className = `
        relative h-screen w-full flex flex-col items-center 
        text-white px-4 py-12 pb-24 overflow-y-auto
    `

    const returnBtn = createButton(i18n.t('pong_back_home'), 'button', 'black')
    returnBtn.className = `
        fixed bottom-4 left-4 z-50 
        px-4 py-2 rounded-xl 
        bg-black/40 hover:bg-black/60 
        text-white text-sm font-medium 
        shadow-md transition-all pointer-events-auto
    `
    returnBtn.onclick = () => {
        document.body.classList.remove('pong-mode')
        window.location.hash = '#/home'
    }

    const tabContainer = document.createElement('div')
    tabContainer.className = 'flex flex-col items-center gap-6 w-full max-w-xs flex-1'

    const tabHeaders = document.createElement('div')
    tabHeaders.className = 'flex flex-row flex-wrap justify-center gap-3 md:flex-nowrap'

    const tabContent = document.createElement('div')
    tabContent.className = 'w-full flex justify-center px-2'

    const tabs = [
        { id: GameMode.ONLINE, label: i18n.t('pong_tab_online'), content: renderOnlineTab },
        { id: GameMode.LOCAL, label: i18n.t('pong_tab_offline'), content: renderOfflineTab },
        { id: GameMode.AI, label: i18n.t('pong_tab_ai'), content: renderAITab }
    ]

    const updateTabs = () => {
        tabContent.innerHTML = ''
        const active = tabs.find(t => t.id === activeTabId)
        if (active) {
            const content = active.content()
            content.classList.add('flex', 'justify-center', 'w-full', 'max-w-full')
            tabContent.appendChild(content)
        }

        tabHeaders.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('bg-gray-700', 'text-white')
            btn.classList.add('bg-gray-600', 'text-gray-300')
        })

        const activeBtn = tabHeaders.querySelector(`[data-tab="${activeTabId}"]`)
        if (activeBtn) {
            activeBtn.classList.add('bg-gray-700', 'text-white')
        }
    }

    tabs.forEach(tab => {
        const btn = createButton(tab.label, 'button', 'black')
        btn.dataset.tab = tab.id
        btn.classList.add(
            'px-4', 'py-2', 'rounded-xl',
            'bg-gray-600', 'text-gray-300',
            'hover:bg-gray-500', 'transition'
        )
        btn.onclick = () => {
            activeTabId = tab.id
            window.location.hash = `/pong/${tab.id}`;
            updateTabs()
        }
        tabHeaders.appendChild(btn)
    })

    updateTabs()

    tabContainer.append(tabHeaders, tabContent)
    wrapper.append(returnBtn, tabContainer)

    return wrapper
}