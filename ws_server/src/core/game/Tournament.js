import { Room } from './Room.js'

export class Tournament {
    constructor(
        id,
        name,
        description,
        creator_id,
        difficulty,
        maxPlayers,
        isPrivate,
        status,
        created_at,
        onEmpty
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.creator_id = creator_id;
        this.difficulty = difficulty;
        this.maxClients = maxPlayers;
        this.isPrivate = isPrivate;
        this.status = status;
        this.created_at = created_at;
        this.onEmpty = onEmpty;

        this.clients = new Map();
        this.rooms = new Map();
        this.waiting = [];
        this.matches = new Map();
        this.nextMatchSeq = 1;
    }

    addClient(client) {
        if (this.clients.size >= this.maxClients) {
            client.send({ type: 'error', error: 'tournament_full' })
            return false;
        }
        this.clients.set(client.username, client);
        client.setTournament(this);
        client.send({
            type: 'joined',
            tournament: {
                id: this.id,
                name: this.name,
                description: this.description,
                creator_id: this.creator_id,
                difficulty: this.difficulty,
                maxClients: this.maxClients,
                isPrivate: this.isPrivate,
                status: this.status,
                created_at: this.created_at,
            }
        })
        const username = client.username
        this.broadcast(
            {
                type: 'player_joined',
                username,
                message: `${username} joined the tournament.`,
            },
            client
        )
        this.enqueueAndMaybePair(client.username);
        return true;
    }

    broadcast(payload, fromClient = null) {
        const fromName = fromClient?.username || null;
        for (const c of this.clients.values()) {
            if (fromName && c.username === fromName) {
                continue;
            }
            c.send(payload);
        }
    }

    enqueueAndMaybePair(username) {
        if (this.matches.has(username)) {
            return;
        }
        if (this.waiting.includes(username)) {
            return;
        }
        this.waiting.push(username);
        this.tryMakePairs();
    }

    tryMakePairs() {
        while (this.waiting.length >= 2) {
            const u1 = this.waiting.shift();
            const u2 = this.waiting.shift();

            const c1 = this.clients.get(u1);
            const c2 = this.clients.get(u2);
            if (!c1 || !c2) {
                if (c1) {
                    this.waiting.unshift(u1);
                }
                if (c2) {
                    this.waiting.unshift(u2);
                }
                break;
            }
            this.createMatch(u1, u2, c1, c2);
        }
    }

    createMatch(u1, u2, c1, c2) {
        const matchId = `${this.id}-${this.nextMatchSeq++}`;
        const roomId = `${matchId}-r1`;

        this.matches.set(u1, { opponent: u2, matchId, slot: 0, roomId });
        this.matches.set(u2, { opponent: u1, matchId, slot: 1, roomId });

        c1.tournament = this;
        c2.tournament = this;
        c1.roomId = roomId;
        c2.roomId = roomId;
        c1.slot = 0;
        c2.slot = 1;

        const room = new Room(this, roomId, [u1, u2]);
        this.rooms.set(roomId, room);

        this.broadcast({
            type: 'match_assigned',
            matchId,
            roomId,
            players: [
                { username: u1, slot: 0 },
                { username: u2, slot: 1 },
            ],
        });

        room.start(3000);
    }

    getAssignment(username) {
        return this.matches.get(username) || null;
    }

    removeClient(username) {
        this.clients.delete(username);

        const i = this.waiting.indexOf(username);
        if (i !== -1) {
            this.waiting.splice(i, 1);
        }

        const assign = this.matches.get(username);
        if (assign) {
            const { opponent, roomId } = assign;
            this.matches.delete(username);

            const oppAssign = this.matches.get(opponent);
            if (oppAssign && oppAssign.opponent === username) {
                this.matches.delete(opponent);
            }

            const room = this.rooms.get(roomId);
            if (room) {
                room.removeClient(username);
                this.rooms.delete(roomId);
                this.broadcast({ type: 'match_cancelled', roomId, reason: 'player_left' });
            }

            if (this.clients.has(opponent)) {
                this.enqueueAndMaybePair(opponent);
            }
        }

        if (this.clients.size === 0 && typeof this.onEmpty === 'function') {
            this.onEmpty(this.id);
        }
    }
}