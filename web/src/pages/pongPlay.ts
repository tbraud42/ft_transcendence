import { createPongCanvas } from '../games/pong/pongCanvas'
import { PongGame } from '../games/pong/engine/PongGame'
import i18next from '../i18n'
import { createButton } from '../components/button'
import { selectedDifficulty, selectedGameMode } from '../games/pong/pongState'

export function renderPongPlay(): HTMLElement {
    document.body.classList.add('pong-mode')

    // === Main container ===
    const container = document.createElement('div')
    container.className = 'relative flex items-center justify-center min-h-screen w-full bg-black text-white overflow-hidden'

    // === Canvas ===
    const canvas = createPongCanvas()
    canvas.classList.add('rounded-2xl', 'shadow-xl', 'border', 'border-white/20')

    const canvasWrapper = document.createElement('div')
    canvasWrapper.className = 'relative flex items-center justify-center p-4'
    canvasWrapper.appendChild(canvas)

    // === Exit button ===
    const exitBtn = createExitButton(() => {
        document.body.classList.remove('pong-mode')
        window.location.hash = '#/pong'
    })

    // === Score display ===
    const scoreOverlay = createScoreOverlay()
    const [scoreLeft, scoreRight] = scoreOverlay.children as HTMLCollectionOf<HTMLDivElement>

    // === Countdown overlay ===
    const countdown = createCountdownOverlay()

    // === Game logic ===
    const game = new PongGame(canvas, selectedGameMode, selectedDifficulty, scoreLeft, scoreRight)
    game.start()

    launchCountdown(countdown, () => {
        countdown.remove()
        game.startBall()
    })

    // === Assemble all ===
    container.append(exitBtn, canvasWrapper, countdown, scoreOverlay)
    return container
}

// === Helpers ===

function createExitButton(onConfirm: () => void): HTMLButtonElement {
    const btn = createButton(i18next.t('button_exit'), 'button', 'red')
    btn.classList.add('absolute', 'top-4', 'left-4', 'w-32', 'z-20')

    let confirmMode = false
    let timeout: ReturnType<typeof setTimeout> | null = null

    const reset = () => {
        confirmMode = false
        btn.textContent = i18next.t('button_exit')
        if (timeout) {
            clearTimeout(timeout)
            timeout = null
        }
    }

    btn.onclick = () => {
        if (!confirmMode) {
            confirmMode = true
            btn.textContent = i18next.t('button_exit_confirm')
            timeout = setTimeout(reset, 3000)
        } else {
            onConfirm()
        }
    }

    btn.onmouseleave = reset
    return btn
}

function createCountdownOverlay(): HTMLDivElement {
    const div = document.createElement('div')
    div.className =
        'absolute inset-0 flex items-center justify-center text-white text-6xl font-extrabold pointer-events-none transition-all z-10'
    return div
}

function launchCountdown(container: HTMLElement, onComplete: () => void) {
    const sequence = ['3', '2', '1', 'GO!']
    let index = 0

    const interval = setInterval(() => {
        container.textContent = sequence[index]
        container.style.opacity = '1'
        container.style.transform = 'scale(1.1)'

        setTimeout(() => {
            container.style.opacity = '0'
            container.style.transform = 'scale(1)'
        }, 400)

        index++
        if (index === sequence.length) {
            clearInterval(interval)
            setTimeout(onComplete, 500)
        }
    }, 1000)
}

function createScoreOverlay(): HTMLDivElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'absolute top-4 w-full flex justify-center gap-24 text-white text-4xl font-bold pointer-events-none z-10'

    const left = document.createElement('div')
    const right = document.createElement('div')

    wrapper.append(left, right)
    return wrapper
}