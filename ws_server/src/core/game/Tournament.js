import { MatchStatus, SrvMessageType } from '../client/protocol.js';
import { Room } from './Room.js';
import { Bot } from '../client/Bot.js';

export class Tournament {
    constructor({ id, name, maxPlayers, creator, difficulty }) {
        this.id = String(id);
        this.name = name || 'Tournament';
        this.maxPlayers = Math.max(2, Number(maxPlayers || 2));
        this.creator = creator || { id: null, username: '' };
        this.difficulty = difficulty;

        this.participants = new Map();     // username -> Client | Bot
        this.rooms = new Map();            // round -> Map(matchIndex -> Room)
        this._generateRooms();

        this._botCounter = 1;
    }

    /* ---------------- players ---------------- */

    addPlayer(client) {
        const username = client.getUsername();
        if (!username || this.participants.has(username) || this.participants.size >= this.maxPlayers) {
            return false;
        }

        this.participants.set(username, client);
        this._assignNextFreeSlot(client);

        if (client.id === this.creator.id) {
            this.creator.username = username;
        }

        this.broadcastSnapshot();
        return true;
    }

    addBotAt(addr) {
        const a = validateAddr(addr);
        if (!a) {
            return;
        }
        if (this.participants.size >= this.maxPlayers) {
            return;
        }

        const idx = roomIndexFromAddr(this.maxPlayers, a);
        if (!idx) {
            return;
        }

        const room = this.getRoom(1, idx);
        if (!room) {
            return;
        }

        const targetSlot = a.pos === 'top' ? 'p1' : 'p2';
        if (room[targetSlot]) {
            console.log("occupied slot for bot:", targetSlot, "in room", room.id);
            return;
        } // already occupied

        const botName = `BOT_${this._botCounter++}`;
        const bot = new Bot(botName);
        this.participants.set(botName, bot);

        room[targetSlot] = bot;
        bot.position = { round: 1, match: idx, slot: targetSlot };
        bot.attachToTournament(this);
        bot.setReady(true);

        this.broadcastSnapshot();
    }

    removeAt(addr) {
        const a = validateAddr(addr);
        if (!a) {
            return;
        }

        const idx = roomIndexFromAddr(this.maxPlayers, a);
        if (!idx) {
            return;
        }

        const room = this.getRoom(1, idx);
        if (!room) {
            return;
        }

        const targetSlot = a.pos === 'top' ? 'p1' : 'p2';
        const client = room[targetSlot];
        if (!client) {
            return;
        }

        const username = client.getUsername?.() || String(client.username || '');
        if (username) {
            this._broadcast({ type: SrvMessageType.PLAYER_KICK, tournamentId: this.id, user: client.username });
            this.participants.delete(username);
            client.detachTournament(this);
        }

        room[targetSlot] = null;
        if (typeof room.removePlayer === 'function') {
            try {
                room.removePlayer(username); 
            } catch {}
        }

        this.broadcastSnapshot();
    }

    getPlayerByUsername(username) {
        return this.participants.get(username);
    }

    /* ---------------- snapshot ---------------- */

    buildSnapshot() {
        const ordered = [...this.participants.values()].sort((a, b) =>
            leafIndex(a) - leafIndex(b)
        );

        const matches = [];
        for (const [round, roundMap] of this.rooms) {
            for (const [index, room] of roundMap) {
                matches.push({
                    id: `${this.id}-r${round}-${index}`,
                    round,
                    p1: room.p1 ? (room.p1.getUsername?.() || room.p1.username) : null,
                    p2: room.p2 ? (room.p2.getUsername?.() || room.p2.username) : null,
                    status: room.started ? MatchStatus.RUNNING : room.ended ? MatchStatus.FINISHED : MatchStatus.WAITING,
                    winner: room.ended ? (room.winner || null) : null,
                    winnerScore: room.ended ? (room.winnerScore || 0) : 0,
                    loser: room.ended ? (room.loser || null) : null,
                    loserScore: room.ended ? (room.loserScore || 0) : 0
                });
            }
        }

        return {
            type: SrvMessageType.SNAPSHOT,
            tournamentId: this._tid(),
            name: this.name,
            maxPlayers: this.maxPlayers,
            creator: this.creator.username || '',
            players: ordered.map(p => ({
                username: p.getUsername?.() || p.username,
                connected: !!p.isConnected?.(),
                isReady: !!p.isReady?.(),
                isBot: !!p.isBot?.()
            })),
            matches
        };
    }

    broadcastSnapshot() {
        this._broadcast(this.buildSnapshot());
    }

    /* ---------------- rooms ---------------- */

    _generateRooms() {
        this.rooms = new Map();

        const n = this.maxPlayers;
        const rounds = Math.log2(n) | 0;

        for (let r = 1; r <= rounds; r++) {
            const count = n >> r;
            const roundMap = new Map();

            for (let i = 1; i <= count; i++) {
                const roomId = `${this.id}-r${r}-${i}`;
                const room = new Room({ tournament: this, id: roomId, difficulty: this.difficulty });
                roundMap.set(i, room);
            }
            this.rooms.set(r, roundMap);
        }
    }

    getRoom(r, i) {
        return this.rooms.get(r)?.get(i) || null;
    }

    _assignNextFreeSlot(client) {
        // Ne place que sur les feuilles (round 1)
        const round1 = this.rooms.get(1);
        if (!round1) {
            return false;
        }

        for (const [i, room] of round1) {
            if (!room.p1) {
                client.y = room.state.paddles[client.getUsername()]?.y ?? (room.H / 2 - room.PAD_H / 2)
                room.setPlayer1(client);
                client.attachToRoom(room);
                client.position = { round: 1, match: i, slot: 'p1' };
                return true;
            }
            if (!room.p2) {
                client.y = room.state.paddles[client.getUsername()]?.y ?? (room.H / 2 - room.PAD_H / 2)
                room.setPlayer2(client);
                client.attachToRoom(room);
                client.position = { round: 1, match: i, slot: 'p2' };
                return true;
            }
        }
        return false;
    }

    _tid() {
        return Number.isFinite(+this.id) ? +this.id : this.id;
    }

    _broadcast(msg) {
        for (const c of this.participants.values()) {
            try {
                c.send?.(msg);
            } catch {}
        }
    }
}

/* ---------------- helpers ---------------- */

function validateAddr(a) {
    if (!a) {
        return null;
    }
    if (a.side !== 'left' && a.side !== 'right') {
        return null;
    }
    if (a.pos !== 'top' && a.pos !== 'bottom') {
        return null;
    }
    if (typeof a.pair !== 'number' || a.pair < 0) {
        return null;
    }
    return a;
}

function leafIndex(client) {
    const pos = client?.position;
    if (!pos || pos.round !== 1) {
        return 1e9;
    }
    const base = (pos.match - 1) * 2;
    const offset = pos.slot === 'p1' ? 0 : 1;
    return base + offset;
}

function roomIndexFromAddr(maxPlayers, a) {
    const perSide = maxPlayers / 2;
    const pairsPerSide = perSide / 2;
    if (a.pair < 0 || a.pair >= pairsPerSide) {
        return null;
    }

    if (a.side === 'left')  {
        return a.pair + 1;
    }
    if (a.side === 'right') {
        return pairsPerSide + (a.pair + 1);
    }
    return null;
}