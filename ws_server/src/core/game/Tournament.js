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

        /** @type {Map<string, any>} username -> Client */
        this.clients = new Map();
        /** @type {Map<string, Room>} roomId -> Room */
        this.rooms = new Map();
        /**
         * username -> { opponent:string, matchId:string, slot:0|1, roomId:string }
         * Utilisé par input.js pour router les inputs
         */
        this.matches = new Map();

        this.nextMatchSeq = 1;

        this.alive = new Set();
        this.waitingInitial = [];
        this.waitingWinners = [];
        this.winScore = 5;
    }

    /**
     * @param {any} client
     */
    addClient(client) {
        if (this.clients.size >= this.maxClients) {
            client.send({ type: 'error', error: 'tournament_full' });
            return false;
        }

        this.clients.set(client.username, client);
        this.alive.add(client.username);
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
        });

        client.send({
            type: 'snapshot',
            ...this.buildSnapshot(),
        });

        const username = client.username;
        this.broadcast(
            { type: 'player_joined', username, message: `${username} joined the tournament.` },
            client
        );

        this.enqueueInitial(client.username);
        this.tryMakeMatches();
        return true;
    }

    /**
     * Snapshot complet pour le front
     * - maxPlayers: dimension du bracket
     * - players: liste des joueurs connectés
     * - matches: liste des matches en cours ET planifiés (si paire identifiable)
     *   format: { id, p1, p2, winner?, score? }
     */
    buildSnapshot() {
        const players = Array.from(this.clients.keys());

        const running = [];
        for (const [roomId, room] of this.rooms.entries()) {
            const [u1, u2] = room.clients;
            running.push({
                id: roomId,
                p1: u1 || '—',
                p2: u2 || '—',
            });
        }

        const planned = [];
        for (let i = 0; i + 1 < this.waitingInitial.length; i += 2) {
            const a = this.waitingInitial[i];
            const b = this.waitingInitial[i + 1];
            if (a && b) {
                planned.push({
                    id: `${this.id}-planned-i-${i / 2 + 1}`,
                    p1: a,
                    p2: b,
                });
            }
        }
        for (let i = 0; i + 1 < this.waitingWinners.length; i += 2) {
            const a = this.waitingWinners[i];
            const b = this.waitingWinners[i + 1];
            if (a && b) {
                planned.push({
                    id: `${this.id}-planned-w-${i / 2 + 1}`,
                    p1: a,
                    p2: b,
                });
            }
        }

        return {
            maxPlayers: this.maxClients,
            players,
            matches: [...running, ...planned],
        };
    }

    /**
     * Broadcast à tous sauf fromClient
     */
    broadcast(payload, fromClient = null) {
        const fromName = fromClient?.username || null;
        for (const c of this.clients.values()) {
            if (fromName && c.username === fromName) continue;
            c.send(payload);
        }
    }

    /**
     * Broadcast à tout le monde
     */
    broadcastAll(payload) {
        for (const c of this.clients.values()) c.send(payload);
    }

    /**
     * Récupère l’assignation d’un joueur
     */
    getAssignment(username) {
        return this.matches.get(username) || null;
    }

    /**
     * Départ d’un joueur (déconnexion / leave)
     */
    removeClient(username) {
        this.clients.delete(username);
        this.alive.delete(username);

        this.waitingInitial = this.waitingInitial.filter(u => u !== username);
        this.waitingWinners = this.waitingWinners.filter(u => u !== username);

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
                this.enqueueWinner(opponent);
                this.tryMakeMatches();
            }
        }

        if (this.clients.size === 0 && typeof this.onEmpty === 'function') {
            this.onEmpty(this.id);
        }
    }

    enqueueInitial(username) {
        if (!this.waitingInitial.includes(username)) this.waitingInitial.push(username);
    }

    enqueueWinner(username) {
        if (!this.waitingWinners.includes(username)) this.waitingWinners.push(username);
    }

    tryMakeMatches() {
        this.pairFrom(this.waitingInitial);
        this.pairFrom(this.waitingWinners);
    }

    pairFrom(queue) {
        while (queue.length >= 2) {
            const a = queue.shift();
            const b = queue.shift();
            if (!a || !b) break;
            this.createRoomFor(a, b);
        }
    }

    /**
     * Crée le match, prépare `matches`, assigne roomId/slot aux clients,
     * diffuse "match_assigned" puis démarre la room.
     */
    createRoomFor(u1, u2) {
        const matchId = `${this.id}-${this.nextMatchSeq++}`;
        const roomId = matchId;

        this.matches.set(u1, { opponent: u2, matchId, slot: 0, roomId });
        this.matches.set(u2, { opponent: u1, matchId, slot: 1, roomId });

        const c1 = this.clients.get(u1);
        const c2 = this.clients.get(u2);
        if (c1) { c1.tournament = this; c1.roomId = roomId; c1.slot = 0; }
        if (c2) { c2.tournament = this; c2.roomId = roomId; c2.slot = 1; }

        const room = new Room(this, roomId, [u1, u2]);
        this.rooms.set(roomId, room);

        this.broadcast({
            type: 'match_assigned',
            matchId,
            roomId,
            maxPlayers: this.maxClients,
            players: [
                { username: u1, slot: 0 },
                { username: u2, slot: 1 },
            ],
        });

        room.start(3000);
    }

    /**
     * Appelée par Room quand le match se termine (score limite atteint)
     */
    handleMatchResult({ room, winner, loser, score }) {
        this.alive.delete(loser);

        const loserClient = this.clients.get(loser);
        const position = this.alive.size + 1;
        if (loserClient) {
            loserClient.send({
                type: 'eliminated',
                tournamentId: this.id,
                user: loser,
                score,
                position
            });
        }

        this.broadcastAll({
            type: 'eliminated',
            tournamentId: this.id,
            user: loser,
            score,
            position
        });

        const winnerClient = this.clients.get(winner);
        if (winnerClient) {
            winnerClient.send({ type: 'waiting_next', tournamentId: this.id });
        }
        this.enqueueWinner(winner);

        this.rooms.delete(room.id);
        const [u1, u2] = room.clients || [];
        if (u1) this.matches.delete(u1);
        if (u2) this.matches.delete(u2);

        if (this.alive.size === 1) {
            const [champion] = Array.from(this.alive);
            const champClient = this.clients.get(champion);
            if (champClient) {
                champClient.send({ type: 'tournament_winner', tournamentId: this.id, winner: champion });
            }
            this.broadcastAll({ type: 'tournament_ended', tournamentId: this.id, winner: champion });
            return;
        }

        this.tryMakeMatches();
    }
}