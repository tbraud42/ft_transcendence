import {BallBase} from "../balls/BallBase";

export interface PlayerState {
    y: number
    height: number
    width: number
    speed: number
    moveUp: boolean
    moveDown: boolean
    score: number
}

export abstract class PlayerBase {
    public y: number
    public readonly width: number = 10
    public readonly height: number = 100
    public speed: number = 5
    protected readonly name: string
    public moveUp: boolean = false
    public moveDown: boolean = false
    public score: number = 0

    protected readonly canvas: HTMLCanvasElement
    protected readonly ctx: CanvasRenderingContext2D

    constructor(public readonly isLeft: boolean, canvas: HTMLCanvasElement, name: string, speed?: number) {
        this.canvas = canvas
        this.name = name
        if (speed) {
            this.speed = speed
        }
        this.ctx = canvas.getContext('2d')!
        this.y = (canvas.height - this.height) / 2
    }

    // Called every frame, implemented by subclasses
    abstract update(ball?: BallBase): void

    getState(): PlayerState {
        return {
            y: this.y,
            height: this.height,
            width: this.width,
            speed: this.speed,
            moveUp: this.moveUp,
            moveDown: this.moveDown,
            score: this.score
        }
    }

    draw(): void {
        this.ctx.fillStyle = this.isLeft ? 'blue' : 'red'
        const x = this.isLeft ? 0 : this.canvas.width - this.width
        this.ctx.fillRect(x, this.y, this.width, this.height)
    }

    addScore(): void {
        this.score += 1
    }

    getScore() {
        return this.score
    }

    getName() {
        return this.name
    }
}