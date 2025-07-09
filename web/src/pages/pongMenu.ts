import i18next from '../i18n'
import { createButton } from '../components/button'
import { createInput } from '../components/input'
import {setSelectedDifficulty, setSelectedGameMode} from '../games/pong/pongState'

export function renderPong(): HTMLElement {
    const pageWrapper = document.createElement('div')
    pageWrapper.className = 'relative min-h-screen w-full flex items-center justify-center bg-transparent text-white px-4 py-12'
    document.body.classList.add('pong-mode')

    // Back button
    const backBtn = createButton(i18next.t('pong_back_home'), 'button', 'red')
    backBtn.classList.add('absolute', 'top-4', 'left-4', 'z-10', 'w-40')
    backBtn.onclick = () => {
        document.body.classList.remove('pong-mode')
        window.location.hash = '#/home'
    }

    // Page content container (centered)
    const container = document.createElement('div')
    container.className = 'flex flex-col md:flex-row gap-8 w-full justify-center items-stretch max-w-5xl'

    // === Online section ===
    const onlineSection = document.createElement('div')
    onlineSection.className = 'bg-black/50 p-6 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-4'

    const onlineTitle = document.createElement('h2')
    onlineTitle.textContent = i18next.t('pong_online_title')
    onlineTitle.className = 'text-lg font-bold'

    const statusText = document.createElement('p')
    statusText.textContent = i18next.t('pong_online_loading')
    statusText.className = 'text-sm italic text-gray-300'

    const roomInput = createInput('text', i18next.t('pong_online_code'))
    const joinBtn = createButton(i18next.t('pong_online_join'))
    const createPublicBtn = createButton(i18next.t('pong_online_create_public'), 'button', 'black')
    const createPrivateBtn = createButton(i18next.t('pong_online_create_private'), 'button', 'black')

    onlineSection.append(onlineTitle, statusText, roomInput, joinBtn, createPublicBtn, createPrivateBtn)

    // === Local Game Section ===
    const localSection = document.createElement('div')
    localSection.className = 'bg-black/50 p-6 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-4'

    const localTitle = document.createElement('h2')
    localTitle.textContent = i18next.t('pong_local_title') // ex: "Partie locale"
    localTitle.className = 'text-lg font-bold'

    // Selecteur de difficulté pour IA
    const difficultySelect = document.createElement('select')
    difficultySelect.className = 'bg-gray-800 text-white p-2 rounded'

    for (const [value, label] of [
        ['easy', i18next.t('pong_ai_difficulty_easy')],
        ['medium', i18next.t('pong_ai_difficulty_medium')],
        ['hard', i18next.t('pong_ai_difficulty_hard')],
    ]) {
        const opt = document.createElement('option')
        opt.value = value
        opt.textContent = label
        difficultySelect.appendChild(opt)
    }

    // Bouton 2 joueurs locaux
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

    localSection.append(localTitle)

    // Then the AI difficulty selection and play button
    localSection.append(difficultySelect, localPvpBtn);

    // Separator line with centered text
    const orDivider = document.createElement('div')
    orDivider.className = 'flex items-center text-gray-400 text-sm my-4'

    const lineLeft = document.createElement('div')
    lineLeft.className = 'flex-grow border-t border-gray-600'

    const orText = document.createElement('span')
    orText.className = 'mx-4 whitespace-nowrap text-gray-400 text-sm'
    orText.textContent = i18next.t('pong_local_or_ai')

    const lineRight = document.createElement('div')
    lineRight.className = 'flex-grow border-t border-gray-600'

    orDivider.append(lineLeft, orText, lineRight)
    localSection.appendChild(orDivider)

    // Add the AI play button
    localSection.append(playAIButton)

    // === Final assembly ===
    container.append(onlineSection, localSection)
    pageWrapper.append(backBtn, container)

    return pageWrapper
}