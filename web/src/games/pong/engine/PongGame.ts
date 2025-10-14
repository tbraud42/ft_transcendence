import { BasicBall } from './balls/BasicBall'
import { PlayerBase } from './players/PlayerBase'
import { BallBase } from './balls/BallBase'
import { AiPlayer } from './players/AiPlayer'
import { LocalPlayer } from './players/LocalPlayer'
import { OnlinePlayer } from './players/OnlinePlayer'
import { getUsername } from '../../../utils/storage'
import { Difficulty, secondPlayerName } from '../pongState'
import i18n from '../../../utils/lang/i18n'
import { WSClient } from '../../../api/socket/WSClient'
import {navigateTo} from "../../../utils/router";
import {ServerEvent, SrvState} from "../../../api/socket/messageTypes";
import {SrvMessageType} from "../../../api/socket/protocol";

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

    private online = false
    private lastState?: SrvState

    constructor(
        private id: string,
        canvas: HTMLCanvasElement,
        player1: PlayerBase,
        player2: PlayerBase,
        difficulty: Difficulty,
        private scoreLeftEl?: HTMLElement,
        private scoreRightEl?: HTMLElement,
        private ws?: WSClient
    ) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!
        this.ball = new BasicBall(canvas.width / 2, canvas.height / 2, difficulty)
        this.player1 = player1
        this.player2 = player2

        if (ws) {
            this.ws = ws
            this.online = true
            this.hookWebSocket(ws)
        }

        this.winTextEl = document.createElement('div')
        this.winTextEl.className =
            'absolute inset-0 flex items-center justify-center text-white text-4xl font-extrabold opacity-0 transition-opacity duration-500 z-20'
        this.winTextEl.textContent = ''
        canvas.parentElement?.appendChild(this.winTextEl)
    }

    getId(): string {
        return this.id
    }

    private hookWebSocket(ws: WSClient) {
        if (!ws.ws) {
            return;
        }
        ws.ws.onmessage = (ev) => {
            let msg: ServerEvent | null = null
            try {
                msg = JSON.parse(ev.data)
            } catch {
                return
            }
            if (!msg) {
                return
            }

            switch (msg.type) {
            case SrvMessageType.MATCH_STATE: {
                this.lastState = msg as SrvState;
                if (!this.gameEnded) {
                    this.update()
                    this.draw()
                }
                break
            }
            }
        }
    }

    start() {
        if (this.online) {
            return;
        }
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

        if (this.online) {
            if (this.lastState) {
                this.player1.setRemoteY(this.lastState.players[0].y);
                this.player2.setRemoteY(this.lastState.players[1].y);
                this.updateScore(this.lastState.players[0].score, this.lastState.players[1].score)
            }
            return
        }

        this.player1.update(this.ball)
        this.player2.update(this.ball)

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
                const r = s.ball.radius / 2
                this.ctx.fillStyle = 'white'
                this.ctx.beginPath()
                this.ctx.arc(s.ball.x, s.ball.y, r, 0, Math.PI * 2)
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
        return new PongGame("local", canvas, p1, p2, difficulty, scoreLeftEl, scoreRightEl)
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
        return new PongGame("local", canvas, p1, p2, difficulty, scoreLeftEl, scoreRightEl)
    }

    static createOnline(
        id: string,
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
            ? new OnlinePlayer(true, canvas, names.me, ws)
            : new OnlinePlayer(true, canvas, names.opponent, ws)
        const pRight = !leftIsMe
            ? new OnlinePlayer(false, canvas, names.me, ws)
            : new OnlinePlayer(false, canvas, names.opponent, ws)

        const game =  new PongGame(id, canvas, pLeft, pRight, difficulty, scoreLeftEl, scoreRightEl, ws);
        game.online = true;
        return game;
    }
}