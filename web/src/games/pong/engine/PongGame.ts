import { BasicBall } from './balls/BasicBall'
import { HumanPlayer } from './players/HumanPlayer'
import { PlayerBase } from './players/PlayerBase'
import { BallBase } from './balls/BallBase'
import {AiPlayer} from "./players/AiPlayer";

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
        mode: 'ai' | 'pvp' = 'ai',
        difficulty: 'easy' | 'medium' | 'hard' = 'medium',
        private scoreLeftEl?: HTMLElement,
        private scoreRightEl?: HTMLElement
    ) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!

        this.ball = new BasicBall(canvas.width / 2, canvas.height / 2, difficulty)

        if (mode === 'ai') {
            this.player1 = new HumanPlayer(true, canvas)
            this.player2 = new AiPlayer(false, canvas, difficulty)
        } else {
            this.player1 = new HumanPlayer(true, canvas)
            this.player2 = new HumanPlayer(false, canvas)
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
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
        this.ballActive = false
        this.gameEnded = true
    }

    update() {
        this.player1.update(this.ball.y)
        this.player2.update(this.ball.y)

        if (this.ballActive) {
            this.ball.update(this.canvas, this.player1, this.player2)

            const score1 = this.player1.getScore()
            const score2 = this.player2.getScore()

            if (score1 >= 5 || score2 >= 5) {
                this.handleGameOver(score1 > score2 ? 'Left Player' : 'Right Player')
            }
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

        this.winTextEl.textContent = `${winner} wins!`
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