import i18next from '../utils/lang/i18n'
import {createButton} from '../components/button'
import {createInput} from '../components/input'
import {setSelectedDifficulty, setSelectedGameMode} from '../games/pong/pongState'
import {createOverlayCard} from "../components/overlayCard";
import {createOptionSelector} from "../components/optionSelector";

export function renderPong(): HTMLElement {
    document.body.classList.add('pong-mode')

    const pageWrapper = document.createElement('div')
    pageWrapper.className = 'relative min-h-screen w-full flex items-center justify-center text-white px-4 py-12'

    const backBtn = createButton(i18next.t('pong_back_home'), 'button', 'red')
    backBtn.classList.add('absolute', 'top-4', 'left-4', 'z-10', 'w-40')
    backBtn.onclick = () => {
        document.body.classList.remove('pong-mode')
        window.location.hash = '#/home'
    }

    const content = document.createElement('div')
    content.className = 'flex flex-col md:flex-row gap-8 w-full justify-center items-stretch max-w-5xl'

    const onlineSection = createOnlineSection()
    const localSection = createLocalSection()

    // === Assemble Page ===
    content.append(onlineSection, localSection)
    pageWrapper.append(backBtn, content)

    return pageWrapper
}

// === Helpers ===

function createOnlineSection(): HTMLDivElement {
    const lobbies = createStatusText(i18next.t('pong_online_loading'))

    // TODO: Simulate loading lobbies for now, replace with actual API call later
    setTimeout(() => {
        lobbies.textContent = i18next.t('pong_online_no_lobbies')
    }, 2000)



    const createLocalButton = (label: string, mode: 'public' | 'private'): HTMLButtonElement => {
        const button = createButton(label, 'button', mode === 'public' ? 'blue' : 'black')

        button.onclick = () => {
            const difficultySelect = createOptionSelector({
                label: i18next.t('pong_difficulty_label'),
                values: [
                    { value: 'easy', label: i18next.t('pong_ai_difficulty_easy') },
                    { value: 'medium', label: i18next.t('pong_ai_difficulty_medium') },
                    { value: 'hard', label: i18next.t('pong_ai_difficulty_hard') }
                ],
                selected: 'medium'
            })

            const confirmBtn = createButton(i18next.t('pong_start'), 'button', 'black')

            const overlay = createOverlayCard({
                title: i18next.t('pong_configuration'),
                children: [difficultySelect.element, confirmBtn]
            })

            confirmBtn.onclick = () => {
                setSelectedDifficulty(difficultySelect.getValue() as 'easy' | 'medium' | 'hard')
                setSelectedGameMode(mode)
                //TODO: Implement actual create public lobby logic with selectedDifficulty
                overlay.close()
            }

            document.body.appendChild(overlay.element)
        }

        return button
    }

    const createPublicBtn = createLocalButton(i18next.t('pong_online_create_public'), 'public')
    const createPrivateBtn = createLocalButton(i18next.t('pong_online_create_private'), 'private')

    const joinBtn = createButton(i18next.t('pong_online_private_join'), 'button', 'black')
    joinBtn.onclick = () => {
        const codeInput = createInput('text', i18next.t('pong_online_code'))
        const confirmBtn = createButton(i18next.t('pong_start'), 'button', 'black')
        confirmBtn.onclick = () => {
            //TODO: Implement actual join lobby logic with codeInput.value
        }

        const overlay = createOverlayCard({
            title: i18next.t('pong_configuration'),
            children: [codeInput, confirmBtn]
        })

        document.body.appendChild(overlay.element)
    }

    return createCardSection([
        createSectionTitle(i18next.t('pong_online_title')),
        lobbies,
        createPublicBtn,
        createPrivateBtn,
        joinBtn,
    ])
}

function createLocalSection(): HTMLDivElement {
    const createLocalButton = (label: string, mode: 'ai' | 'pvp'): HTMLButtonElement => {
        const button = createButton(label, 'button', 'blue')

        button.onclick = () => {
            const difficultySelect = createOptionSelector({
                label: i18next.t('pong_difficulty_label'),
                values: [
                    { value: 'easy', label: i18next.t('pong_ai_difficulty_easy') },
                    { value: 'medium', label: i18next.t('pong_ai_difficulty_medium') },
                    { value: 'hard', label: i18next.t('pong_ai_difficulty_hard') }
                ],
                selected: 'medium'
            })

            const confirmBtn = createButton(i18next.t('pong_start'), 'button', 'black')

            const overlay = createOverlayCard({
                title: i18next.t('pong_configuration'),
                children: [difficultySelect.element, confirmBtn]
            })

            confirmBtn.onclick = () => {
                setSelectedDifficulty(difficultySelect.getValue() as 'easy' | 'medium' | 'hard')
                setSelectedGameMode(mode)
                window.location.hash = '#/pong/play'
                overlay.close()
            }

            document.body.appendChild(overlay.element)
        }

        return button
    }

    const localPvpBtn = createLocalButton(i18next.t('pong_local_2p'), 'pvp')
    const aiBtn = createLocalButton(i18next.t('pong_ai_play'), 'ai')

    return createCardSection([
        createSectionTitle(i18next.t('pong_local_title')),
        localPvpBtn,
        createDivider(i18next.t('pong_local_or_ai')),
        aiBtn
    ])
}

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