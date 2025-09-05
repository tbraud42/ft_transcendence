import { BasicBall } from './balls/BasicBall'
import { PlayerBase } from './players/PlayerBase'
import { BallBase } from './balls/BallBase'
import { AiPlayer } from './players/AiPlayer'
import { LocalPlayer } from './players/LocalPlayer'
import { OnlinePlayer } from './players/OnlinePlayer'
import { getUsername } from '../../../utils/storage'
import { Difficulty, secondPlayerName } from '../pongState'
import i18n from '../../../utils/lang/i18n'
import { WSClient, ServerState } from '../../../socket/WSClient'
import {navigateTo} from "../../../utils/router";

export class PongGame {
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private ball: BallBase
    private player1: PlayerBase
    private player2: PlayerBase
    private animationFrameId?: number
    private ballActive = false
    private gameEnded = false
    private winTextEl: HTMLDivElement

    // Online-only state
    private ws?: WSClient
    private online = false
    private mySlot: 0 | 1 = 0
    private lastState?: ServerState

    constructor(
        canvas: HTMLCanvasElement,
        player1: PlayerBase,
        player2: PlayerBase,
        difficulty: Difficulty,
        private scoreLeftEl?: HTMLElement,
        private scoreRightEl?: HTMLElement,
        ws?: WSClient,
        mySlot?: 0 | 1
    ) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!
        this.ball = new BasicBall(canvas.width / 2, canvas.height / 2, difficulty)
        this.player1 = player1
        this.player2 = player2

        if (ws) {
            this.ws = ws
            this.online = true
            if (typeof mySlot !== 'undefined') {
                this.mySlot = mySlot
            }
            this.hookWebSocket(ws)
        }

        this.winTextEl = document.createElement('div')
        this.winTextEl.className =
            'absolute inset-0 flex items-center justify-center text-white text-4xl font-extrabold opacity-0 transition-opacity duration-500 z-20'
        this.winTextEl.textContent = ''
        canvas.parentElement?.appendChild(this.winTextEl)
    }

    private hookWebSocket(ws: WSClient) {
        ws.on('state', (s) => {
            this.lastState = s
            if (this.player1 instanceof OnlinePlayer) {
                this.player1.setRemoteY(s.p1y)
            }
            if (this.player2 instanceof OnlinePlayer) {
                this.player2.setRemoteY(s.p2y)
            }
        })
    }

    start() {
        const loop = () => {
            if (!this.gameEnded) {
                this.update()
                this.draw()
                this.animationFrameId = requestAnimationFrame(loop)
            }
        }
        loop()
    }

    startBall() {
        this.ballActive = true
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId)
        }
        this.ballActive = false
    }

    private update() {

        this.player1.update(this.ball)
        this.player2.update(this.ball)

        if (this.online) {
            if (this.lastState) {
                this.updateScore(this.lastState.s1, this.lastState.s2)
            }
            return
        }

        this.updateScore(this.player1.score, this.player2.score)
        if (this.ballActive) {
            this.ball.update(this.canvas, this.player1, this.player2)
            const winner = this.ball.checkScore(this.player1, this.player2, this.canvas)
            if (winner) {
                this.handleGameEndIfAny()
            }
        }
    }

    private drawNet() {
        this.ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        this.ctx.lineWidth = 2
        this.ctx.setLineDash([8, 8])
        this.ctx.beginPath()
        this.ctx.moveTo(this.canvas.width / 2, 0)
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height)
        this.ctx.stroke()
        this.ctx.setLineDash([])
    }

    private draw() {
        this.ctx.fillStyle = 'black'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.drawNet()

        this.player1.draw()
        this.player2.draw()

        if (this.online) {
            const s = this.lastState
            if (s) {
                const r = s.ballSize / 2
                this.ctx.fillStyle = 'white'
                this.ctx.beginPath()
                this.ctx.arc(s.bX, s.bY, r, 0, Math.PI * 2)
                this.ctx.fill()
            }
        } else {
            this.ball.draw(this.ctx)
        }
    }

    private updateScore(left: number, right: number) {
        if (this.scoreLeftEl) {
            this.scoreLeftEl.textContent = String(left)
        }
        if (this.scoreRightEl) {
            this.scoreRightEl.textContent = String(right)
        }
    }

    private handleGameEndIfAny() {
        const target = 11
        const left = (this.player1 as PlayerBase).score || 0
        const right = (this.player2 as PlayerBase).score || 0
        if (left >= target || right >= target) {
            const username = getUsername() || i18n.t('pong_you')
            const opponent = secondPlayerName || i18n.t('pong_opponent')
            const winner = left > right ? (this.player1.isLeft ? username : opponent) : (this.player2.isLeft ? username : opponent)
            this.handleGameOver(winner)
        }
    }

    private handleGameOver(winner: string) {
        this.stop()

        this.winTextEl.textContent = i18n.t('pong_winner_announce', { winner })
        this.winTextEl.style.opacity = '1'

        setTimeout(() => {
            this.winTextEl.style.opacity = '0'
            setTimeout(() => {
                document.body.classList.remove('pong-mode')
                navigateTo('/home')
            }, 1000)
        }, 3000)
    }

    // Helpers pour simplifier l’instanciation selon le mode
    static createLocalVsLocal(
        canvas: HTMLCanvasElement,
        difficulty: Difficulty,
        names: { left: string; right: string },
        scoreLeftEl?: HTMLElement,
        scoreRightEl?: HTMLElement
    ) {
        const p1 = new LocalPlayer(true, canvas, names.left)
        const p2 = new LocalPlayer(false, canvas, names.right)
        return new PongGame(canvas, p1, p2, difficulty, scoreLeftEl, scoreRightEl)
    }

    static createLocalVsAi(
        canvas: HTMLCanvasElement,
        difficulty: Difficulty,
        nameLeft: string,
        scoreLeftEl?: HTMLElement,
        scoreRightEl?: HTMLElement
    ) {
        const p1 = new LocalPlayer(true, canvas, nameLeft)
        const p2 = new AiPlayer(false, canvas, 'AI', difficulty)
        return new PongGame(canvas, p1, p2, difficulty, scoreLeftEl, scoreRightEl)
    }

    static createOnline(
        canvas: HTMLCanvasElement,
        ws: WSClient,
        mySlot: 0 | 1,
        names: { me: string; opponent: string },
        difficulty: Difficulty,
        scoreLeftEl?: HTMLElement,
        scoreRightEl?: HTMLElement
    ) {
        const leftIsMe = mySlot === 0
        const pLeft = leftIsMe
            ? new OnlinePlayer(true, canvas, names.me, ws, 0)
            : new OnlinePlayer(true, canvas, names.opponent, ws, 0)
        const pRight = !leftIsMe
            ? new OnlinePlayer(false, canvas, names.me, ws, 1)
            : new OnlinePlayer(false, canvas, names.opponent, ws, 1)

        return new PongGame(canvas, pLeft, pRight, difficulty, scoreLeftEl, scoreRightEl, ws, mySlot)
    }
}