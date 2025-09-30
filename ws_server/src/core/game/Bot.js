export class Bot {
    constructor(username) {
        this.username = username
        this.interval = null
        this.currentState = null
    }

    /** Called by server when the match state updates */
    updateState(state) {
        this.currentState = state
    }

    /** Start thinking once per second */
    start(sendInput) {
        if (this.interval) {
            return
        }
        this.interval = setInterval(() => {
            if (!this.currentState) {
                return
            }

            const s = this.currentState
            const ballY = s.ball.y
            const mySlot = this.getMySlot(s)

            if (mySlot === null) {
                return
            }

            const paddleY = s.p[mySlot]
            const paddleCenter = paddleY + 50 // paddle height = 100
            const tolerance = 10
            const input = { up: false, down: false }

            if (ballY < paddleCenter - tolerance) {
                input.up = true
            }
            if (ballY > paddleCenter + tolerance) {
                input.down = true
            }

            sendInput(input)
        }, 1000)
    }

    /** Stop the bot completely */
    stop() {
        if (this.interval) {
            clearInterval(this.interval)
        }
        this.interval = null
    }

    /** Determine bot slot (0 or 1) based on username */
    getMySlot(state) {
        if (!state.players) {
            return null
        }
        if (state.players[0] === this.username) {
            return 0
        }
        if (state.players[1] === this.username) {
            return 1
        }
        return null
    }
}