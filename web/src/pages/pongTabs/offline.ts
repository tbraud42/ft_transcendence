import i18next from '../../utils/lang/i18n'
import { createButton } from '../../components/button'
import { createInput } from '../../components/input'
import { createOptionSelector } from '../../components/optionSelector'
import { setSecondPlayerName, setSelectedDifficulty, setSelectedGameMode } from '../../games/pong/pongState'

export function renderOfflineTab(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'flex flex-col gap-4 w-full max-w-md'

    const difficulty = createOptionSelector({
        label: i18next.t('pong_difficulty_label'),
        values: [
            { value: 'easy', label: i18next.t('pong_ai_difficulty_easy') },
            { value: 'medium', label: i18next.t('pong_ai_difficulty_medium') },
            { value: 'hard', label: i18next.t('pong_ai_difficulty_hard') },
        ],
        selected: 'medium'
    })

    const secondPlayerNameInput = createInput('text', i18next.t('pong_local_2p_name'), true)

    const errorMsg = document.createElement('p')
    errorMsg.className = 'text-red-500 text-sm mt-2 text-center hidden'
    errorMsg.id = 'pong-local-2p-error'
    errorMsg.textContent = i18next.t('pong_local_2p_error_name')

    const btn = createButton(i18next.t('pong_local_2p'), 'submit', 'blue')
    btn.onclick = () => {
        const secondPlayerName = secondPlayerNameInput.value.trim()
        if (!secondPlayerName) {
            errorMsg.classList.remove('hidden')
            return
        }

        setSecondPlayerName(secondPlayerName)
        setSelectedGameMode('pvp')
        setSelectedDifficulty(difficulty.getValue() as 'easy' | 'medium' | 'hard')
        window.location.hash = '#/pong/play'
    }

    // === Assemble ===
    container.append(
        difficulty.element,
        secondPlayerNameInput,
        errorMsg,
        btn
    )

    return container
}