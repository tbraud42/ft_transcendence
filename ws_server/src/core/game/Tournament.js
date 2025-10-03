import {
    MatchStatus,
    SrvMessageType,
} from '../client/protocol.js';

export class Tournament {
    constructor({ id, name, maxPlayers, creator }) {
        this.id = String(id);
        this.name = name || 'Tournament';
        this.maxPlayers = Math.max(2, Number(maxPlayers || 2));
        this.creator = creator || { id: null, username: '' };

        this.participants = new Map();
        this.clients = new Map();

        this._r1Fixed = new Map();

        this._nextSeed = 1;
        this._botCounter = 1;
    }

    addPlayer(client) {
        const username = String(client.username || '');
        if (!username) {
            return;
        }

        const exists = this.participants.has(username);
        if (!exists && this._countHumans() >= this.maxPlayers) {
            return;
        }

        let p = this.participants.get(username);
        if (!p) {
            p = { username, connected: true, isReady: false, isBot: false, seed: this._nextSeed++ };
            this.participants.set(username, p);
        } else {
            p.connected = true;
        }

        if (client.id != null && this.creator && client.id === this.creator.id) {
            this.creator.username = username;
        }

        this.clients.set(username, client);
        this.broadcastSnapshot();
    }

    addBotAt(addr) {
        if (this._countTotal() >= this.maxPlayers) {
            return;
        }

        const slotIndex = this._leafToSlotIndex(addr);
        if (slotIndex == null) {
            return;
        }

        const username = `BOT_${this._botCounter++}`;
        const p = {
            username,
            connected: true,
            isReady: true,
            isBot: true,
            seed: this._nextSeed++,
        };
        this.participants.set(username, p);

        const ov = this._r1Fixed.get(slotIndex) || {};
        if (addr.pos === 'top')  {
            ov.p1 = username;
        }
        if (addr.pos === 'bottom') {
            ov.p2 = username;
        }
        this._r1Fixed.set(slotIndex, ov);

        this.broadcastSnapshot();
    }

    removeBotAt(addr) {
        if (!addr || (addr.side !== 'left' && addr.side !== 'right')) {
            return;
        }
        if (addr.pos !== 'top' && addr.pos !== 'bottom') {
            return;
        }
        if (typeof addr.pair !== 'number' || addr.pair < 0) {
            return;
        }

        const slotIndex = this._leafToSlotIndex(addr);
        if (slotIndex == null) {
            return;
        }

        const ov = this._r1Fixed.get(slotIndex);
        if (!ov) {
            return;
        }

        const key = addr.pos === 'top' ? 'p1' : 'p2';
        const username = ov[key] ?? null;
        if (!username) {
            return;
        }

        const p = this.participants.get(String(username));
        if (!p || !p.isBot) {
            return;
        }

        this.participants.delete(String(username));

        ov[key] = null;
        this._r1Fixed.set(slotIndex, ov);

        this.broadcastSnapshot();
    }

    markDisconnected(username) {
        const u = String(username || '');
        const p = this.participants.get(u);
        if (p) {
            p.connected = false;
        }
        this.clients.delete(u);
        this.broadcastSnapshot();
    }

    setReady(username, ready) {
        const u = String(username || '');
        const p = this.participants.get(u);
        if (!p) {
            return;
        }
        p.isReady = !!ready;

        this._broadcast({ type: SrvMessageType.PLAYER_READY, roomId: '', username: u });
        this.broadcastSnapshot();
    }

    buildSnapshot() {
        const r1 = this._buildRound1Matches();
        return {
            type: SrvMessageType.SNAPSHOT,
            tournamentId: Number.isFinite(+this.id) ? +this.id : this.id,
            name: this.name,
            maxPlayers: this.maxPlayers,
            creator: String(this.creator?.username || ''),
            players: this._orderedParticipants().map(p => ({
                username: p.username,
                connected: !!p.connected,
                isReady: !!p.isReady,
                isBot: !!p.isBot,
            })),
            matches: r1,
        };
    }

    broadcastSnapshot() {
        const snap = this.buildSnapshot();
        for (const c of this.clients.values()) {
            try {
                c.send(snap); 
            } catch {}
        }
    }

    sendSnapshotTo(client) {
        try {
            client.send(this.buildSnapshot()); 
        } catch {}
    }

    _buildRound1Matches() {
        const players = [...this.participants.values()]
            .sort((a, b) => a.seed - b.seed)
            .map(p => p.username)

        const cap = this.maxPlayers
        const matches = []

        for (let i = 0; i < cap; i += 2) {
            const p1 = players[i] || null
            const p2 = players[i+1] || null
            matches.push({
                id: `${this.id}-r1-${(i/2)+1}`,
                round: 1,
                p1, p2,
                status: MatchStatus.WAITING
            })
        }

        while (matches.length < cap) {
            matches.push({
                id: `${this.id}-r1-ph${matches.length}`,
                round: 1,
                p1: null, p2: null,
                status: MatchStatus.WAITING
            })
        }

        return matches
    }

    _leafToSlotIndex(addr) {
        if (!addr) {
            return null;
        }
        const { side, pair } = addr;
        if (typeof pair !== 'number' || pair < 0) {
            return null;
        }
        return side === 'left' ? pair * 2 : pair * 2 + 1;
    }

    _orderedParticipants() {
        return [...this.participants.values()].sort((a, b) => a.seed - b.seed);
    }

    _countHumans() {
        let n = 0;
        for (const p of this.participants.values()) {
            if (!p.isBot) {
                n++;
            }
        }
        return n;
    }

    _countTotal() {
        return this.participants.size;
    }

    _broadcast(msg) {
        for (const c of this.clients.values()) {
            try {
                c.send(msg); 
            } catch {}
        }
    }
}