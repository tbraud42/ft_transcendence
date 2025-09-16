import { Bot } from './bot.js'

export class Match {
    constructor({ tournament, id, p1, p2, winScore, readyTimeoutMs, disconnectLoseMs }) {
        this.tournament = tournament
        this.id = id
        this.p1 = p1
        this.p2 = p2

        this.winScore = winScore
        this.readyTimeoutMs = readyTimeoutMs
        this.disconnectLoseMs = disconnectLoseMs

        this.bots = {}
        if (this.tournament.participants.get(this.p1)?.isBot) {
            this.bots[this.p1] = new Bot(this.p1)
        }
        if (this.tournament.participants.get(this.p2)?.isBot) {
            this.bots[this.p2] = new Bot(this.p2)
        }

        this.ready = new Map([[p1, false], [p2, false]])
        this.readyTimer = null

        this.paused = false
        this.disconnectTimers = new Map()

        this.interval = null
        this.state = this.initState()

        // throttle bot state push (1s)
        this._botAccum = 0
        this._botUpdateMs = 1000
    }

    initState() {
        return {
            players: [this.p1, this.p2],
            ball: { x: 400, y: 225, vx: 4, vy: 3 },
            p: [200, 200],
            score: [0, 0],
            w: 800, h: 450,
        }
    }

    markReady(username) {
        if (!this.ready.has(username)) {
            return
        }
        this.ready.set(username, true)
        this.tournament.broadcastAll({ type: 'player_ready', roomId: this.id, username })
        this.tryStart()
    }

    tryStart() {
        if (![this.p1, this.p2].every(u => this.ready.get(u))) {
            return
        }
        if (this.readyTimer) {
            clearTimeout(this.readyTimer); this.readyTimer = null 
        }
        this.paused = false
        this.tournament.onMatchStarted(this)

        Object.values(this.bots).forEach(bot => {
            bot.start((input) => this.applyInput(bot.username, input))
        })

        this.loopStart()
    }

    loopStart() {
        if (this.interval) {
            return
        }
        let last = Date.now()
        this.interval = setInterval(() => {
            if (this.paused) {
                return
            }
            const now = Date.now()
            const dt = Math.min(32, now - last)
            last = now

            this.step(dt)

            // throttle bot state updates to 1s
            this._botAccum += dt
            if (this._botAccum >= this._botUpdateMs) {
                this._botAccum = 0
                Object.values(this.bots).forEach(bot => bot.updateState(this.state))
            }

            this.tournament.onMatchState(this, this.state)
        }, 1000 / 60)
    }

    step(_dt) {
        const s = this.state
        s.ball.x += s.ball.vx
        s.ball.y += s.ball.vy
        if (s.ball.y < 0 || s.ball.y > s.h) {
            s.ball.vy *= -1
        }

        // simple paddle follow for server-side bots (baseline)
        const pInfo = [
            this.tournament.participants.get(this.p1),
            this.tournament.participants.get(this.p2)
        ]
        ;[0, 1].forEach(i => {
            const u = i === 0 ? this.p1 : this.p2
            if (pInfo[i]?.isBot) {
                const target = s.ball.y - 40
                s.p[i] += Math.sign(target - s.p[i]) * 4
            }
        })

        // scoring
        if (s.ball.x < 0) {
            s.score[1]++; this.resetBall(1) 
        }
        if (s.ball.x > s.w) {
            s.score[0]++; this.resetBall(-1) 
        }

        if (s.score[0] >= this.winScore || s.score[1] >= this.winScore) {
            const winner = s.score[0] > s.score[1] ? this.p1 : this.p2
            const loser = winner === this.p1 ? this.p2 : this.p1
            this.stop('score_limit', winner, loser)
        }
    }

    resetBall(dir) {
        const s = this.state
        s.ball.x = s.w / 2
        s.ball.y = s.h / 2
        s.ball.vx = 4 * dir
        s.ball.vy = (Math.random() > .5 ? 3 : -3)
    }

    onDisconnected(username) {
        if (![this.p1, this.p2].includes(username)) {
            return
        }
        this.paused = true
        const timer = setTimeout(() => {
            if (!this.paused) {
                return
            }
            const winner = (username === this.p1) ? this.p2 : this.p1
            const loser = username
            this.stop('disconnect_timeout', winner, loser)
        }, this.disconnectLoseMs)
        this.disconnectTimers.set(username, timer)
    }

    onReconnected(username) {
        if (![this.p1, this.p2].includes(username)) {
            return
        }
        const t = this.disconnectTimers.get(username)
        if (t) {
            clearTimeout(t); this.disconnectTimers.delete(username) 
        }
        if (![...this.disconnectTimers.keys()].length) {
            this.paused = false
        }
    }

    applyInput(username, input) {
        const i = (username === this.p1) ? 0 : (username === this.p2) ? 1 : -1
        if (i < 0) {
            return
        }
        const s = this.state
        const speed = 6
        if (input?.up) {
            s.p[i] -= speed
        }
        if (input?.down) {
            s.p[i] += speed
        }
        s.p[i] = Math.max(0, Math.min(s.h - 100, s.p[i]))
    }

    stop(reason, winner, loser) {
        if (this.interval) {
            clearInterval(this.interval); this.interval = null 
        }
        for (const t of this.disconnectTimers.values()) {
            clearTimeout(t)
        }
        this.disconnectTimers.clear()
        this.paused = false

        Object.values(this.bots).forEach(bot => bot.stop())

        const score = { [this.p1]: this.state.score[0], [this.p2]: this.state.score[1] }
        this.tournament.onMatchEnded(this, { id: this.id, winner, loser, score, reason })
    }
}