import { PlayerBase } from './PlayerBase'
import {BallBase} from "../balls/BallBase";

export class AiPlayer extends PlayerBase {
    private readonly difficulty: string

    constructor(isLeft: boolean, canvas: HTMLCanvasElement, difficulty: string = 'medium') {
        let speed: number
        console .log(`Creating AI player with difficulty: ${difficulty}`)
        switch (difficulty) {
            case 'easy':
                speed = 4
                break
            case 'hard':
                speed = 6
                break
            default:
                speed = 5
        }
        super(isLeft, canvas, speed)
        this.difficulty = difficulty
    }

    update(ball?: BallBase): void {
        if (typeof ball === 'undefined') {
            return
        }

        const paddleCenter = this.y + this.height / 2

        if (Math.abs(ball.y - paddleCenter) > 5) {
            if (ball.y > paddleCenter) {
                this.y += this.speed
            } else {
                this.y -= this.speed
            }
        }

        // Ensure the paddle stays within the canvas bounds
        this.y = Math.max(0, Math.min(this.canvas.height - this.height, this.y))
    }
}