import { createPongCanvas } from '../games/pong/pongCanvas'
import { PongGame } from '../games/pong/engine/PongGame'
import i18next from '../i18n'
import { createButton } from '../components/button'
import { selectedDifficulty, selectedGameMode } from '../games/pong/pongState'

export function renderPongPlay(): HTMLElement {
    const container = document.createElement('div')
    container.className = 'relative flex items-center justify-center min-h-screen w-full bg-black text-white overflow-hidden'
    document.body.classList.add('pong-mode')

    // --- Canvas wrapper ---
    const canvasWrapper = document.createElement('div')
    canvasWrapper.className = 'relative flex items-center justify-center p-4'

    const canvas = createPongCanvas()
    canvas.classList.add('rounded-2xl', 'shadow-xl', 'border', 'border-white/20')
    canvasWrapper.appendChild(canvas)

    // --- Exit Button with confirm state ---
    const exitBtn = createButton('Exit', 'button', 'red')
    exitBtn.classList.add('absolute', 'top-4', 'left-4', 'w-32', 'z-20')

    let confirmMode = false
    let confirmTimeout: ReturnType<typeof setTimeout> | null = null

    function resetExitButton() {
        confirmMode = false
        exitBtn.textContent = i18next.t('button_exit')
        if (confirmTimeout) {
            clearTimeout(confirmTimeout)
            confirmTimeout = null
        }
    }

    exitBtn.onclick = () => {
        if (!confirmMode) {
            confirmMode = true
            exitBtn.textContent = i18next.t('button_exit_confirm')
            confirmTimeout = setTimeout(resetExitButton, 3000)
        } else {
            document.body.classList.remove('pong-mode')
            window.location.hash = '#/pong'
        }
    }

    // Reset if mouse leaves the button
    exitBtn.onmouseleave = resetExitButton

    // --- Countdown overlay ---
    const countdown = document.createElement('div')
    countdown.className =
        'absolute inset-0 flex items-center justify-center text-white text-6xl font-extrabold pointer-events-none transition-all z-10'

    // --- Assemble ---
    container.append(exitBtn, canvasWrapper, countdown)

    // --- Score overlay ---
    const scoreOverlay = document.createElement('div')
    scoreOverlay.className = 'absolute top-4 w-full flex justify-center gap-24 text-white text-4xl font-bold pointer-events-none z-10'

    const scoreLeft = document.createElement('div')
    const scoreRight = document.createElement('div')

    scoreOverlay.appendChild(scoreLeft)
    scoreOverlay.appendChild(scoreRight)

    container.appendChild(scoreOverlay)

    // --- Start game (paddles only) ---
    const game = new PongGame(canvas, selectedGameMode, selectedDifficulty, scoreLeft, scoreRight)
    game.start()

    // --- Countdown logic ---
    const countdownSequence = ['3', '2', '1', 'GO!']
    let index = 0

    const interval = setInterval(() => {
        countdown.textContent = countdownSequence[index]
        countdown.style.opacity = '1'
        countdown.style.transform = 'scale(1.1)'

        setTimeout(() => {
            countdown.style.opacity = '0'
            countdown.style.transform = 'scale(1)'
        }, 400)

        index++
        if (index === countdownSequence.length) {
            clearInterval(interval)
            setTimeout(() => {
                countdown.remove()
                game.startBall()
            }, 500)
        }
    }, 1000)

    return container
}