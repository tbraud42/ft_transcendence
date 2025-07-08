import i18next from '../i18n'
import { createButton } from '../components/button'
import { createInput } from '../components/input'
import {setSelectedDifficulty, setSelectedGameMode} from '../games/pong/pongState'

export function renderPong(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'page-pong flex flex-col min-h-screen text-white items-center justify-center relative gap-12 px-4 py-12'
    document.body.classList.add('pong-mode')

    const backBtn = createButton(i18next.t('pong_back_home'), 'button', 'black')
    backBtn.classList.add('absolute', 'top-6', 'left-6')
    backBtn.onclick = () => {
        document.body.classList.remove('pong-mode')
        window.location.hash = '#/home'
    }
    container.appendChild(backBtn)

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

    const aiSection = document.createElement('div')
    aiSection.className = 'bg-black/50 p-6 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-4'

    const aiTitle = document.createElement('h2')
    aiTitle.textContent = i18next.t('pong_ai_title')
    aiTitle.className = 'text-lg font-bold'

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

    const playAIButton = createButton(i18next.t('pong_ai_play'))

    playAIButton.onclick = () => {
        setSelectedDifficulty(difficultySelect.value as 'easy' | 'medium' | 'hard')
        setSelectedGameMode('ai')
        window.location.hash = '#/pong/play'
    }

    aiSection.append(aiTitle, difficultySelect, playAIButton)

    const wrapper = document.createElement('div')
    wrapper.className = 'flex flex-col md:flex-row gap-8 w-full justify-center items-stretch px-4'
    wrapper.appendChild(onlineSection)
    wrapper.appendChild(aiSection)

    container.appendChild(wrapper)

    return container
}