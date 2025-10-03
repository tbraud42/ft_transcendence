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
        console.log(addr)
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

    _makeEmptyR1() {
        const cap = this.maxPlayers;
        const r1 = new Array(cap);
        for (let k = 0; k < cap; k++) {
            const isLeftSlot  = (k % 2) === 0;
            const pairIndex   = Math.floor(k / 2) + 1;
            const id = isLeftSlot
                ? `${this.id}-r1-${pairIndex}`
                : `${this.id}-r1-ph${k}`;

            r1[k] = {
                id,
                round: 1,
                p1: null,
                p2: null,
                status: MatchStatus.WAITING,
            };
        }
        return r1;
    }

    _buildRound1Matches() {
        const cap = this.maxPlayers;

        if (cap === 2) {
            const ordered = [...this.participants.values()]
                .sort((a, b) => a.seed - b.seed)
                .map(p => p.username);

            const ovL = this._r1Fixed.get(0) || {};
            const ovR = this._r1Fixed.get(1) || {};

            const used = new Set();
            let p1 = null, p2 = null;

            if (ovL.p1 && !used.has(ovL.p1)) { p1 = ovL.p1; used.add(ovL.p1); }
            else if (ovL.p2 && !used.has(ovL.p2)) { p1 = ovL.p2; used.add(ovL.p2); }

            if (ovR.p1 && !used.has(ovR.p1)) { p2 = ovR.p1; used.add(ovR.p1); }
            else if (ovR.p2 && !used.has(ovR.p2)) { p2 = ovR.p2; used.add(ovR.p2); }

            for (const name of ordered) {
                if (used.has(name)) continue;
                if (!p1) { p1 = name; used.add(name); continue; }
                if (!p2) { p2 = name; used.add(name); continue; }
                break;
            }

            return [{
                id: `${this.id}-r1-1`,
                round: 1,
                p1, p2,
                status: MatchStatus.WAITING
            }];
        }

        const r1 = this._makeEmptyR1();
        const ordered = [...this.participants.values()]
            .sort((a, b) => a.seed - b.seed)
            .map(p => p.username)
            .slice(0, cap);

        const used = new Set();

        for (const [slotIndex, ov] of this._r1Fixed.entries()) {
            if (slotIndex < 0 || slotIndex >= cap) continue;
            const m = r1[slotIndex];
            if (ov.p1 && !used.has(ov.p1)) { m.p1 = ov.p1; used.add(ov.p1); }
            if (ov.p2 && !used.has(ov.p2)) { m.p2 = ov.p2; used.add(ov.p2); }
        }

        for (const name of ordered) {
            if (used.has(name)) continue;
            let placed = false;
            for (let k = 0; k < cap && !placed; k++) {
                const m = r1[k];
                if (!m.p1) { m.p1 = name; used.add(name); placed = true; break; }
                if (!m.p2) { m.p2 = name; used.add(name); placed = true; break; }
            }
        }

        return r1;
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