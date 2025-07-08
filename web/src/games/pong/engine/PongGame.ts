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

    constructor(canvas: HTMLCanvasElement, mode: 'ai' | 'pvp' = 'ai', difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!

        this.ball = new BasicBall(canvas.width / 2, canvas.height / 2)

        if (mode === 'ai') {
            this.player1 = new HumanPlayer(true, canvas)
            this.player2 = new AiPlayer(false, canvas, difficulty)
        } else if (mode === 'pvp') {
            this.player1 = new HumanPlayer(true, canvas)
            this.player2 = new HumanPlayer(false, canvas)
        } else {
            throw new Error(`Unsupported game mode: ${mode}`)
        }
    }

    start() {
        const loop = () => {
            this.update()
            this.draw()
            this.animationFrameId = requestAnimationFrame(loop)
        }
        loop()
    }

    stop() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId)
    }

    update() {
        this.player1.update(this.ball.y)
        this.player2.update(this.ball.y)
        this.ball.update(this.canvas, this.player1, this.player2)
    }

    draw() {
        const ctx = this.ctx
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.player1.draw()
        this.player2.draw()
        this.ball.draw(ctx)
    }
}