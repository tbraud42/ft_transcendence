import i18next from '../../utils/lang/i18n'
import { createButton } from '../../components/button'
import { createOverlayCard } from '../../components/overlayCard'
import { createOptionSelector } from '../../components/optionSelector'
import {setSecondPlayerName, setSelectedDifficulty, setSelectedGameMode} from '../../games/pong/pongState'
import {createInput} from "../../components/input";

export function renderAITab(): HTMLElement {
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

    const btn = createButton(i18next.t('pong_local_2p'), 'submit', 'blue')
    btn.onclick = () => {
        setSelectedGameMode('ai')
        setSelectedDifficulty(difficulty.getValue() as 'easy' | 'medium' | 'hard')
        window.location.hash = '#/pong/play'
    }

    // === Assemble ===
    container.append(
        difficulty.element,
        btn
    )

    return container
}
