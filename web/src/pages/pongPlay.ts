import { createPongCanvas } from '../games/pong/pongCanvas'
import { PongGame } from '../games/pong/engine/PongGame'
import i18next from '../i18n'
import { createButton } from '../components/button'
import { selectedDifficulty, selectedGameMode } from '../games/pong/pongState'

export function renderPongPlay(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'relative flex flex-col items-center justify-center min-h-screen bg-black text-white gap-6 px-4 py-12'
    document.body.classList.add('pong-mode')

    const backBtn = createButton(i18next.t('pong_back_home'), 'button', 'black')
    backBtn.classList.add('absolute', 'top-6', 'left-6')
    backBtn.onclick = () => {
        document.body.classList.remove('pong-mode')
        window.location.hash = '#/home'
    }

    const canvas = createPongCanvas()
    canvas.classList.add('rounded-xl', 'shadow-lg')

    const game = new PongGame(canvas, selectedGameMode, selectedDifficulty)
    game.start()

    container.appendChild(backBtn)
    container.appendChild(canvas)

    return container
}