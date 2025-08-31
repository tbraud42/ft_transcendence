import { BasicBall } from './balls/BasicBall'
import { LocalPlayer } from './players/LocalPlayer'
import { PlayerBase } from './players/PlayerBase'
import { BallBase } from './balls/BallBase'
import {AiPlayer} from "./players/AiPlayer";
import {getUsername} from "../../../utils/storage";
import {Difficulty, GameMode, secondPlayerName} from "../pongState";
import i18n from "../../../utils/lang/i18n";

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

    constructor(
        canvas: HTMLCanvasElement,
        mode: GameMode,
        difficulty: Difficulty,
        private scoreLeftEl?: HTMLElement,
        private scoreRightEl?: HTMLElement
    ) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!

        this.ball = new BasicBall(canvas.width / 2, canvas.height / 2, difficulty)

        switch (mode) {
        case GameMode.AI:
            this.player1 = new LocalPlayer(true, canvas, getUsername());
            this.player2 = new AiPlayer(false, canvas, i18n.t('pong_ai_opponent'), difficulty);
            break;

        case GameMode.LOCAL:
            this.player1 = new LocalPlayer(true, canvas, getUsername());
            this.player2 = new LocalPlayer(false, canvas, secondPlayerName || 'Player 2');
            break;

        case GameMode.ONLINE:
            // TODO: Implement Online Player logic
            this.player1 = new LocalPlayer(true, canvas, getUsername());
            this.player2 = new LocalPlayer(false, canvas, secondPlayerName || 'Player 2');
            break;

        default:
            throw new Error(`Unknown game mode: ${mode}`);
        }

        // Create win text overlay
        this.winTextEl = document.createElement('div')
        this.winTextEl.className = 'absolute inset-0 flex items-center justify-center text-white text-6xl font-extrabold opacity-0 transition-opacity duration-500 z-20'
        this.winTextEl.textContent = ''
        canvas.parentElement?.appendChild(this.winTextEl)
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
        this.gameEnded = true
    }

    update() {
        if (this.ballActive) {
            this.player1.update(this.ball)
            this.player2.update(this.ball)
            this.ball.update(this.canvas, this.player1, this.player2)

            const score1 = this.player1.getScore()
            const score2 = this.player2.getScore()

            if (score1 >= 5 || score2 >= 5) {
                this.handleGameOver(score1 > score2 ? this.player1.getName() : this.player2.getName())
            }
        } else {
            this.player1.update()
            this.player2.update()
        }
    }

    draw() {
        const ctx = this.ctx
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        if (this.scoreLeftEl && this.scoreRightEl) {
            this.scoreLeftEl.textContent = String(this.player1.getScore())
            this.scoreRightEl.textContent = String(this.player2.getScore())
        }

        this.player1.draw()
        this.player2.draw()

        if (this.ballActive) {
            this.ball.draw(ctx)
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
                window.location.hash = '#/pong'
            }, 1000)
        }, 3000)
    }
}