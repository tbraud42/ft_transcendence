import { createPongCanvas } from '../games/pong/pongCanvas'
import { PongGame } from '../games/pong/engine/PongGame'
import i18n from '../utils/lang/i18n'
import { createButton } from '../components/button'
import {GameMode, secondPlayerName, selectedDifficulty, selectedGameMode} from '../games/pong/pongState'
import {LocalPlayer} from "../games/pong/engine/players/LocalPlayer";
import {getUsername} from "../utils/storage";
import {AiPlayer} from "../games/pong/engine/players/AiPlayer";

let currentGame: PongGame | null = null

export function renderPongPlay(): HTMLElement {
    document.body.classList.add('pong-mode')

    if (currentGame) {
        currentGame.stop()
        currentGame = null
    }

    const container = document.createElement('div')
    container.className = 'relative flex items-center justify-center min-h-screen w-full text-white overflow-hidden'

    const canvas = createPongCanvas()
    canvas.classList.add('rounded-2xl', 'shadow-xl', 'border', 'border-white/20')

    const canvasWrapper = document.createElement('div')
    canvasWrapper.className = 'relative flex items-center justify-center p-4'
    canvasWrapper.appendChild(canvas)

    const exitBtn = createExitButton(() => {
        document.body.classList.remove('pong-mode')
        window.location.hash = '#/pong'
        stopTimer()
        if (currentGame) {
            currentGame.stop()
            currentGame = null
        }
    })

    const scoreOverlay = createScoreOverlay()
    const [scoreLeft, scoreRight] = scoreOverlay.children as HTMLCollectionOf<HTMLDivElement>

    const countdown = createCountdownOverlay()

    const timerDisplay = document.createElement('div')
    timerDisplay.className = 'absolute top-4 right-4 text-white text-xl font-mono z-10 pointer-events-none'
    timerDisplay.textContent = '00:00'
    container.appendChild(timerDisplay)

    let player1, player2

    switch (selectedGameMode) {

        case GameMode.AI:
            player1 = new LocalPlayer(true, canvas, getUsername());
            player2 = new AiPlayer(false, canvas, i18n.t('pong_ai_opponent'), selectedDifficulty);
            break;

        default:
            player1 = new LocalPlayer(true, canvas, getUsername());
            player2 = new LocalPlayer(false, canvas, secondPlayerName || 'Player 2');
            break;
    }

    const game = new PongGame(
        canvas,
        player1,
        player2,
        selectedDifficulty,
        scoreLeft,
        scoreRight
    )
    currentGame = game
    game.start()

    let startTime = Date.now()
    let timerInterval: ReturnType<typeof setInterval>

    function startTimer() {
        startTime = Date.now()
        timerInterval = setInterval(() => {
            const now = Date.now()
            const elapsed = Math.floor((now - startTime) / 1000)
            const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0')
            const seconds = String(elapsed % 60).padStart(2, '0')
            timerDisplay.textContent = `${minutes}:${seconds}`
        }, 1000)
    }

    function stopTimer() {
        clearInterval(timerInterval)
    }

    launchCountdown(countdown, () => {
        countdown.remove()
        game.startBall()
        startTimer()
    })

    container.append(exitBtn, canvasWrapper, countdown, scoreOverlay)
    return container
}

function createExitButton(onConfirm: () => void): HTMLButtonElement {
    const btn = createButton(i18n.t('button_exit'), 'button', 'red')
    btn.className = btn.className.replace('w-full', '')
    btn.classList.add('absolute', 'top-4', 'left-4', 'w-32', 'z-20')

    let confirmMode = false
    let timeout: ReturnType<typeof setTimeout> | null = null

    const reset = () => {
        confirmMode = false
        btn.textContent = i18n.t('button_exit')
        if (timeout) {
            clearTimeout(timeout)
            timeout = null
        }
    }

    btn.onclick = () => {
        if (!confirmMode) {
            confirmMode = true
            btn.textContent = i18n.t('button_exit_confirm')
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