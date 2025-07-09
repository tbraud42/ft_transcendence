import i18next from '../i18n'
import { createButton } from '../components/button'
import { createInput } from '../components/input'
import { setSelectedDifficulty, setSelectedGameMode } from '../games/pong/pongState'

export function renderPong(): HTMLElement {
    document.body.classList.add('pong-mode')

    const pageWrapper = document.createElement('div')
    pageWrapper.className = 'relative min-h-screen w-full flex items-center justify-center text-white px-4 py-12'

    // === Back button ===
    const backBtn = createButton(i18next.t('pong_back_home'), 'button', 'red')
    backBtn.classList.add('absolute', 'top-4', 'left-4', 'z-10', 'w-40')
    backBtn.onclick = () => {
        document.body.classList.remove('pong-mode')
        window.location.hash = '#/home'
    }

    // === Main content container ===
    const content = document.createElement('div')
    content.className = 'flex flex-col md:flex-row gap-8 w-full justify-center items-stretch max-w-5xl'

    // === Online Game Section ===
    const onlineSection = createCardSection([
        createSectionTitle(i18next.t('pong_online_title')),
        createStatusText(i18next.t('pong_online_loading')),
        createInput('text', i18next.t('pong_online_code')),
        createButton(i18next.t('pong_online_join')),
        createButton(i18next.t('pong_online_create_public'), 'button', 'black'),
        createButton(i18next.t('pong_online_create_private'), 'button', 'black'),
    ])

    // === Local Game Section ===
    const difficultySelect = createDifficultySelect()

    const localPvpBtn = createButton(i18next.t('pong_local_2p'))
    localPvpBtn.onclick = () => {
        setSelectedDifficulty(difficultySelect.value as 'easy' | 'medium' | 'hard')
        setSelectedGameMode('pvp')
        window.location.hash = '#/pong/play'
    }

    const playAIButton = createButton(i18next.t('pong_ai_play'))
    playAIButton.onclick = () => {
        setSelectedDifficulty(difficultySelect.value as 'easy' | 'medium' | 'hard')
        setSelectedGameMode('ai')
        window.location.hash = '#/pong/play'
    }

    const localSection = createCardSection([
        createSectionTitle(i18next.t('pong_local_title')),
        difficultySelect,
        localPvpBtn,
        createDivider(i18next.t('pong_local_or_ai')),
        playAIButton
    ])

    // === Assemble Page ===
    content.append(onlineSection, localSection)
    pageWrapper.append(backBtn, content)

    return pageWrapper
}

// === Helpers ===

function createCardSection(children: HTMLElement[]): HTMLDivElement {
    const section = document.createElement('div')
    section.className = 'bg-black/50 p-6 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-4'
    children.forEach(el => section.appendChild(el))
    return section
}

function createSectionTitle(text: string): HTMLHeadingElement {
    const h2 = document.createElement('h2')
    h2.textContent = text
    h2.className = 'text-lg font-bold'
    return h2
}

function createStatusText(text: string): HTMLParagraphElement {
    const p = document.createElement('p')
    p.textContent = text
    p.className = 'text-sm italic text-gray-300'
    return p
}

function createDifficultySelect(): HTMLSelectElement {
    const select = document.createElement('select')
    select.className = 'bg-gray-800 text-white p-2 rounded'

    const difficulties: [string, string][] = [
        ['easy', i18next.t('pong_ai_difficulty_easy')],
        ['medium', i18next.t('pong_ai_difficulty_medium')],
        ['hard', i18next.t('pong_ai_difficulty_hard')],
    ]

    for (const [value, label] of difficulties) {
        const option = document.createElement('option')
        option.value = value
        option.textContent = label
        select.appendChild(option)
    }

    return select
}

function createDivider(text: string): HTMLDivElement {
    const divider = document.createElement('div')
    divider.className = 'flex items-center text-gray-400 text-sm my-4'

    const left = document.createElement('div')
    left.className = 'flex-grow border-t border-gray-600'

    const middle = document.createElement('span')
    middle.className = 'mx-4 whitespace-nowrap text-gray-400 text-sm'
    middle.textContent = text

    const right = document.createElement('div')
    right.className = 'flex-grow border-t border-gray-600'

    divider.append(left, middle, right)
    return divider
}