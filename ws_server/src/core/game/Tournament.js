export class Tournament {
    constructor({ id, name, maxPlayers, creator }) {
        this.id = String(id);
        this.name = name || 'Tournament';
        this.maxPlayers = Math.max(2, Number(maxPlayers || 2));
        this.creator = creator;

        this.participants = new Map();
        this.clients = new Map();

        this._nextSeed = 1;
    }

    addPlayer(client) {
        const u = String(client.username);
        let p = this.participants.get(u);
        if (!p) {
            p = { username: u, connected: true, isReady: false, seed: this._nextSeed++ };
            this.participants.set(u, p);
        } else {
            p.connected = true;
        }
        if (client.id === this.creator.id) this.creator.username = u;
        this.clients.set(u, client);
        this.broadcastSnapshot();
    }

    addBot() {
        //TODO: set ready by default
    }

    markDisconnected(username) {
        const p = this.participants.get(String(username));
        if (p) p.connected = false;
        this.clients.delete(String(username));
        this.broadcastSnapshot();
    }

    buildRound1Matches() {
        const players = [...this.participants.values()]
            .sort((a, b) => a.seed - b.seed);

        const cap = this.maxPlayers;
        const names = players.slice(0, cap).map(p => p.username);

        const realPairs = [];
        for (let i = 0; i < cap; i += 2) {
            realPairs.push({
                id: `${this.id}-r1-${(i / 2) + 1}`,
                round: 1,
                p1: names[i]   || null,
                p2: names[i+1] || null,
            });
        }

        const r1 = [];
        for (let k = 0; k < cap; k++) {
            if (k % 2 === 0) {
                const base = realPairs[k / 2] || { id: `${this.id}-r1-${(k/2)+1}`, round: 1, p1: null, p2: null };
                r1.push({ ...base, status: 'waiting' });
            } else {
                r1.push({ id: `${this.id}-r1-ph${k}`, round: 1, p1: null, p2: null, status: 'waiting' });
            }
        }
        return r1;
    }

    buildSnapshot() {
        const r1 = this.buildRound1Matches();

        return {
            type: 'snapshot',
            tournamentId: this.id,
            name: this.name,
            maxPlayers: this.maxPlayers,
            creator: this.creator,
            players: [...this.participants.values()]
                .sort((a, b) => a.seed - b.seed)
                .map(p => ({ username: p.username, connected: p.connected, isReady: false, isBot: false })),
            matches: r1
        };
    }

    broadcastSnapshot() {
        const snap = this.buildSnapshot();
        for (const c of this.clients.values()) {
            try { c.send(snap); } catch {}
        }
    }

    sendSnapshotTo(client) {
        try { client.send(this.buildSnapshot()); } catch {}
    }
}