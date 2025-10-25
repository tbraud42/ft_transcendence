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

export const DEFAULT_BALL_RADIUS = 8
const WINNING_SCORE = 5;

export class PongGame {
    public static globalTick: number = 0;

    private canvas: HTMLCanvasElement
    public ctx: CanvasRenderingContext2D
    public ball: BallBase
    private player1: PlayerBase
    private player2: PlayerBase

    private animationFrameId?: number

    private static readonly TICK_RATE = 60
    private static readonly TICK_MS = 1000 / PongGame.TICK_RATE
    private tickIntervalId?: number

    private ballActive = false
    private winTextEl: HTMLDivElement
    public gameEnded = false

    public lastState?: SrvState

    constructor(
        private id: string,
        canvas: HTMLCanvasElement,
        player1: PlayerBase,
        player2: PlayerBase,
        difficulty: Difficulty,
        ballRadius: number = DEFAULT_BALL_RADIUS,
        private scoreLeftEl?: HTMLElement,
        private scoreRightEl?: HTMLElement,
        private online: boolean = false
    ) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!
        const ballSpeed = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8
        this.ball = new BasicBall(canvas.width / 2, canvas.height / 2, ballSpeed, ballRadius)
        const padSpeed = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8
        player1.speed = padSpeed
        player2.speed = padSpeed
        this.player1 = player1
        this.player2 = player2

        this.winTextEl = document.createElement('div')
        this.winTextEl.className =
            'absolute inset-0 flex items-center justify-center text-white text-4xl font-extrabold opacity-0 transition-opacity duration-500 z-20'
        this.winTextEl.textContent = ''
        canvas.parentElement?.appendChild(this.winTextEl)
    }

    start() {
        if (this.online) return;

        if (this.tickIntervalId !== undefined) clearInterval(this.tickIntervalId)
        if (this.animationFrameId !== undefined) cancelAnimationFrame(this.animationFrameId)

        this.tickIntervalId = window.setInterval(() => {
            if (!this.gameEnded) {
                this.update()
            }
        }, PongGame.TICK_MS)

        const render = () => {
            if (!this.gameEnded) {
                this.draw()
                this.animationFrameId = requestAnimationFrame(render)
            }
        }
        render()
    }

    public update() {
        PongGame.globalTick++

        let p1Score = this.player1.score;
        let p2Score = this.player2.score;

        if (this.online && this.lastState) {
            this.player1.setRemoteY(this.lastState.players[0].y);
            this.player2.setRemoteY(this.lastState.players[1].y);
            p1Score = this.lastState.players[0].score;
            p2Score = this.lastState.players[1].score;
        }

        if (PongGame.globalTick % 60 === 0) {
            if (this.player1 instanceof AiPlayer) {
                this.player1.process(this.ball)
            }
            if (this.player2 instanceof AiPlayer) {
                this.player2.process(this.ball)
            }
        }
        this.player1.update(this.ball)
        this.player2.update(this.ball)

        if (this.player2 instanceof AiPlayer && PongGame.globalTick % 60 === 0) {
            this.player2.process(this.ball)
        }

        this.updateScore(p1Score, p2Score)

        if (this.ballActive) {
            this.ball.update(this.canvas, this.player1, this.player2)
            const winner = this.ball.checkScore(this.player1, this.player2, this.canvas)
            if (winner) {
                this.handleGameEndIfAny()
            }
        }
    }

    getId(): string {
        return this.id
    }

    startBall() {
        this.ballActive = true
    }

    stop() {
        if (this.animationFrameId !== undefined) {
            cancelAnimationFrame(this.animationFrameId)
            this.animationFrameId = undefined
        }
        if (this.tickIntervalId !== undefined) {
            clearInterval(this.tickIntervalId)
            this.tickIntervalId = undefined
        }
        this.ballActive = false
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

    public draw() {
        this.ctx.fillStyle = 'black'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.drawNet()

        this.player1.draw()
        this.player2.draw()

        if (this.online) {
            const s = this.lastState
            if (s) {
                const r = s.ball.radius
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
            this.scoreLeftEl.innerHTML = `${this.player1.getName()}<br>${left}`;
        }
        if (this.scoreRightEl) {
            this.scoreRightEl.innerHTML = `${this.player2.getName()}<br>${right}`;
        }
    }

    private handleGameEndIfAny() {
        const left = (this.player1 as PlayerBase).score || 0
        const right = (this.player2 as PlayerBase).score || 0
        if (left >= WINNING_SCORE || right >= WINNING_SCORE) {
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

    static createOnline(
        id: string,
        canvas: HTMLCanvasElement,
        ws: WSClient,
        mySlot: 0 | 1,
        names: { me: string; opponent: string },
        difficulty: Difficulty,
        ballRadius: number = DEFAULT_BALL_RADIUS,
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

        const game =  new PongGame(id, canvas, pLeft, pRight, difficulty, ballRadius, scoreLeftEl, scoreRightEl, true);
        game.online = true;
        return game;
    }
}