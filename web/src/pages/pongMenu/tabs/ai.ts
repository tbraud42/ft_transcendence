import i18n from '../../../utils/lang/i18n'
import {createButton} from '../../../components/button'
import {createOptionSelector} from '../../../components/optionSelector'
import {Difficulty, GameMode, setSelectedDifficulty, setSelectedGameMode} from '../../../games/pong/pongState'
import {navigateTo} from "../../../utils/router";

export function renderAITab(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'flex flex-col gap-4 w-full max-w-md'

    const difficulty = createOptionSelector({
        label: i18n.t('pong_difficulty_label'),
        values: [
            { value: Difficulty.EASY, label: i18n.t('pong_ai_difficulty_easy') },
            { value: Difficulty.MEDIUM, label: i18n.t('pong_ai_difficulty_medium') },
            { value: Difficulty.HARD, label: i18n.t('pong_ai_difficulty_hard') },
        ],
        selected: Difficulty.MEDIUM
    })

    const btn = createButton(i18n.t('pong_local_2p'), 'submit', 'blue')
    btn.onclick = () => {
        setSelectedGameMode(GameMode.AI)
        setSelectedDifficulty(Difficulty[difficulty.getValue() as keyof typeof Difficulty])
        navigateTo('/pong/play')
    }

    container.append(
        difficulty.element,
        btn
    )

    return container
}
