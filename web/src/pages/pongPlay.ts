import { createPongCanvas } from '../games/pong/pongCanvas'
import { PongGame } from '../games/pong/engine/PongGame'
import i18n from '../utils/lang/i18n'
import { createButton } from '../components/button'
import { GameMode, secondPlayerName, selectedDifficulty, selectedGameMode } from '../games/pong/pongState'
import { LocalPlayer } from '../games/pong/engine/players/LocalPlayer'
import { getToken, getUsername } from '../utils/storage'
import { AiPlayer } from '../games/pong/engine/players/AiPlayer'
import { WSClient } from '../socket/WSClient'
import { env } from '../utils/env'
import {navigateTo} from "../utils/router";

let currentGame: PongGame | null = null
const PONG_WS_URL = env.PONG_WS_URL

export function renderPongPlay(roomId: string): HTMLElement {
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
        navigateTo('/home')
        stopTimer()
        if (currentGame) {
            currentGame.stop()
            currentGame = null
        }
    })

    const scoreOverlay = createScoreOverlay()
    const scoreLeft = scoreOverlay.children[0] as HTMLDivElement
    const scoreRight = scoreOverlay.children[1] as HTMLDivElement

    const countdown = createCountdownOverlay()

    const timerDisplay = document.createElement('div')
    timerDisplay.className = 'absolute top-4 right-4 text-white text-xl font-mono z-10 pointer-events-none'
    timerDisplay.textContent = '00:00'
    container.appendChild(timerDisplay)

    container.append(exitBtn, canvasWrapper, countdown, scoreOverlay)

    const mode = selectedGameMode
    let game: PongGame

    if (mode === GameMode.AI) {
        const p1 = new LocalPlayer(true, canvas, getUsername() || i18n.t('pong_you'))
        const p2 = new AiPlayer(false, canvas, i18n.t('pong_ai_opponent'), selectedDifficulty)
        game = new PongGame(canvas, p1, p2, selectedDifficulty, scoreLeft, scoreRight)
        currentGame = game
        game.start()
        launchCountdown(countdown, () => {
            countdown.remove()
            game.startBall()
            startTimer()
        })
        return container
    }

    if (mode === GameMode.LOCAL) {
        const p1 = new LocalPlayer(true, canvas, getUsername() || i18n.t('pong_you'))
        const p2 = new LocalPlayer(false, canvas, secondPlayerName || i18n.t('pong_opponent'))
        game = new PongGame(canvas, p1, p2, selectedDifficulty, scoreLeft, scoreRight)
        currentGame = game
        game.start()
        launchCountdown(countdown, () => {
            countdown.remove()
            game.startBall()
            startTimer()
        })
        return container
    }

    // --- En ligne ---
    const status = document.createElement('div')
    status.className =
        'absolute -top-10 left-1/2 -translate-x-1/2 text-sm opacity-90 bg-black/60 px-4 py-2 rounded-lg shadow-lg z-20 pointer-events-none'
    status.textContent = i18n.t('pong_lobby_connecting')

// Le status est maintenant placé dans le wrapper du canvas
    canvasWrapper.appendChild(status)

    const ws = new WSClient(`wss://${PONG_WS_URL}`, getToken())
    let mySlot: 0 | 1 | null = null

    ws.on('authed', () => {
        status.textContent = i18n.t('pong_lobby_authed')
        ws.join(roomId)
    })

// joli compte à rebours juste avant le début (sans startBall)
    ws.on('starting', () => {
        status.textContent = i18n.t('pong_lobby_starting')
        launchCountdown(countdown, () => {
            countdown.remove()
            startTimer()
        })
    })

    ws.on('joined', (_roomId: string, slot: 0 | 1) => {
        mySlot = slot

        const me = getUsername()
        const opp = i18n.t('pong_opponent')

        console.log('DEBUG')
        // Dès qu'un autre joueur rejoint, on fait disparaître le status
        status.style.transition = 'opacity 0.8s ease'
        status.style.opacity = '0'
        setTimeout(() => status.remove(), 800)

        // On démarre le jeu
        game = PongGame.createOnline(canvas, ws, slot, { me, opponent: opp }, selectedDifficulty, scoreLeft, scoreRight)
        currentGame = game
        game.start()
    })

    ws.on('close', () => {
        status.textContent = i18n.t('pong_lobby_disconnected')
        status.style.opacity = '1'
    })

    ws.on('error', () => {
        status.textContent = i18n.t('pong_lobby_network_error')
        status.style.opacity = '1'
    })

    ws.connect()
    return container

    let startTime = Date.now()
    let timerInterval: ReturnType<typeof setInterval>

    function startTimer() {
        startTime = Date.now()
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000)
            const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0')
            const seconds = String(elapsed % 60).padStart(2, '0')
            timerDisplay.textContent = `${minutes}:${seconds}`
        }, 1000)
    }

    function stopTimer() {
        clearInterval(timerInterval)
    }
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
    wrapper.className =
        'absolute top-4 w-full flex justify-center gap-24 text-white text-4xl font-bold pointer-events-none z-10'
    const left = document.createElement('div')
    const right = document.createElement('div')
    wrapper.append(left, right)
    return wrapper
}