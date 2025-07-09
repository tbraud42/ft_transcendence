import { PlayerBase } from './PlayerBase'
import {BallBase} from "../balls/BallBase";

export class HumanPlayer extends PlayerBase {
    constructor(isLeft: boolean, canvas: HTMLCanvasElement, speed: number = 5) {
        super(isLeft, canvas, speed)
        this.setupControls()
    }

    // Setup keyboard controls
    private setupControls(): void {
        document.addEventListener('keydown', (e) => {
            if (this.isLeft) {
                if (e.key === 's' || e.key === 'S') {
                    this.moveUp = true
                }
                if (e.key === 'w' || e.key === 'W') {
                    this.moveDown = true
                }
            } else {
                if (e.key === 'ArrowUp') {
                    this.moveUp = true
                }
                if (e.key === 'ArrowDown') {
                    this.moveDown = true
                }
            }
        })

        document.addEventListener('keyup', (e) => {
            if (this.isLeft) {
                if (e.key === 's' || e.key === 'S') {
                    this.moveUp = false
                }
                if (e.key === 'w' || e.key === 'W') {
                    this.moveDown = false
                }
            } else {
                if (e.key === 'ArrowUp') {
                    this.moveUp = false
                }
                if (e.key === 'ArrowDown') {
                    this.moveDown = false
                }
            }
        })
    }

    // Move the paddle each frame
    update(ball?: BallBase): void {
        if (this.moveUp) {
            this.y -= this.speed
        }
        if (this.moveDown) {
            this.y += this.speed
        }

        // Ensure paddle stays within canvas bounds
        this.y = Math.max(0, Math.min(this.canvas.height - this.height, this.y))
    }
}