export class Tournament {
    constructor({ id, name, maxPlayers }) {
        this.id = String(id)
        this.name = name || 'Tournament'
        this.maxPlayers = Math.max(2, Number(maxPlayers || 2))
        this.participants = new Map()
        this.clients = new Map()
    }

    addPlayer(username, client) {
        const u = String(username)
        const existing = this.participants.get(u)
        if (existing) {
            existing.connected = true
        } else {
            this.participants.set(u, { username: u, connected: true })
        }
        if (client) {
            this.clients.set(u, client)
        }
        this.broadcastSnapshot()
    }

    markDisconnected(username) {
        const p = this.participants.get(String(username))
        console.log(p)
        if (p) {
            p.connected = false
        }
        this.clients.delete(String(username))
        this.broadcastSnapshot()
    }

    buildPairs() {
        const players = [...this.participants.values()]
            .sort((a, b) =>
                (Number(!a.connected) - Number(!b.connected)) ||
                a.username.localeCompare(b.username)
            )

        const cap = this.maxPlayers
        const names = players.slice(0, cap).map(p => p.username)
        const pairs = []
        for (let i = 0; i < cap; i += 2) {
            pairs.push({
                id: `${this.id}-r1-${(i/2)+1}`,
                round: 1,
                p1: names[i]   || null,
                p2: names[i+1] || null,
            })
        }
        return pairs
    }

    buildSnapshot() {
        return {
            type: 'snapshot',
            tournamentId: this.id,
            name: this.name,
            maxPlayers: this.maxPlayers,
            players: [...this.participants.values()].map(p => ({
                username: p.username,
                connected: p.connected,
                isBot: false,
            })),
            matches: this.buildPairs().map(m => ({
                id: m.id, round: m.round, p1: m.p1, p2: m.p2, status: 'waiting',
            })),
        }
    }

    broadcastSnapshot() {
        const snap = this.buildSnapshot()
        for (const c of this.clients.values()) {
            try {
                c.send(snap) 
            } catch {}
        }
    }

    sendSnapshotTo(client) {
        try {
            client.send(this.buildSnapshot()) 
        } catch {}
    }
}