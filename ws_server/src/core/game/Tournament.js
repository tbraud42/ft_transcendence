import { MatchStatus, SrvMessageType } from '../client/protocol.js';
import { Room } from './Room.js';
import { Bot } from '../client/Bot.js';
import {
    saveTournamentResult,
    updateTournamentState
} from "../../api/game.js";
import {getTournamentManager} from "./GamesManager.js";

export class Tournament {
    /**
     * Create a tournament and pre-generate the room bracket.
     * @param {Object} opts
     * @param {string|number} opts.id
     * @param {string} [opts.name]
     * @param {number} [opts.maxPlayers]
     * @param {{id: string|null, username: string}} [opts.creator]
     * @param {string} [opts.difficulty]
     */
    constructor({ id, name, maxPlayers, creator, difficulty }) {
        this.id = String(id);
        this.name = name || 'Tournament';
        this.maxPlayers = Math.max(2, Number(maxPlayers || 2));
        this.creator = creator || { id: null, username: '' };
        this.difficulty = difficulty;

        this.participants = new Map();
        this.rooms = new Map();
        this._botCounter = 1;

        this._generateRooms();
    }

    /**
     * Try to add a player to the tournament and auto-assign a first-round slot.
     * Returns true on success, false otherwise.
     */
    addPlayer(client) {
        const username = client.getUsername();
        if (!username || this.participants.has(username) || this.isFull() || this.isEnded()) {
            return false;
        }

        this.participants.set(username, client);
        this._assignNextFreeSlot(client);

        if (client.id === this.creator.id) {
            this.creator.username = username;
        }

        this.broadcastSnapshot();
        if (this.isFull()) {
            updateTournamentState(this.creator, this.id, 1).then();
        }
        return true;
    }

    /**
     * Insert a bot directly into a specific room/slot in round 1.
     * No-op if tournament is full or room/slot is invalid.
     */
    addBotAt(roomId, slot) {
        if (this.isFull() || this.isEnded()) {
            return;
        }

        const info = parseRoomId(roomId);
        if (!info) {
            return;
        }

        const room = this.getRoom(info.round, info.index);
        if (!room) {
            return;
        }

        const setPlayer = slot === 'p1' ? room.setPlayer1.bind(room) : room.setPlayer2.bind(room);

        const botName = `BOT_${this._botCounter++}`;
        const bot = new Bot(botName);
        this.participants.set(botName, bot);

        setPlayer(bot);
        bot.position = { round: 1, match: info.index, slot };
        bot.attachToTournament(this);
        bot.attachToRoom(room);
        bot.setReady(true);

        this.broadcastSnapshot();
        if (this.isFull()) {
            updateTournamentState(this.creator, this.id, 1).then();
        }
    }

    /**
     * Remove a participant by username and notify them.
     * Keeps them in memory only long enough to send the kick event.
     */
    remove(username) {
        const client = this.getPlayerByUsername(username);
        if (!client) {
            return;
        }

        if (this.isFull() && !this.isEnded()) {
            updateTournamentState(this.creator, this.id, 0).then();
        }

        client.send({ type: SrvMessageType.PLAYER_KICK, tournamentId: this.id, user: client.username });
        client.detachTournament();
        if (this.isEmpty() && !this.isEnded()) {
            getTournamentManager().removeTournament(this.id);
        }
        this.broadcastSnapshot();
    }

    /**
     * O(1) lookup for a participant instance by username.
     */
    getPlayerByUsername(username) {
        return this.participants.get(username);
    }

    /**
     * Handle the end of a room: move the winner forward and broadcast.
     * Keep the loser in participants.
     */
    onRoomEnd(room, winner, loser) {
        room.removePlayer(loser.getUsername());
        this._assignNextRound(winner, room);
        this.broadcastSnapshot();
        console.log("YEY")
        if (this.isEnded()) {
            console.log(`${room.getUsername()} has ended`);
            updateTournamentState(this.creator, this.id, 2).then();
            saveTournamentResult(this).then();
        }
    }

    /**
     * Check if the tournament ended (all match rooms finished).
     */
    isEnded() {
        for (const roundMap of this.rooms.values()) {
            for (const room of roundMap.values()) {
                console.log(room.ended)
                if (!room.ended) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Check if the tournament is empty
     */
    isEmpty() {
        let count = 0
        for (const participant of this.participants.values()) {
            if (!participant.isBot || !participant.isBot()) {
                count += 1
            }
        }
        return count === 0;
    }

    /**
     * Check if the tournament is full
     */
    isFull() {
        return this.maxPlayers <= this.participants.size;
    }

    /**
     * Build a full tournament snapshot for clients (players, matches, status).
     */
    buildSnapshot() {
        const playersOrdered = [...this.participants.values()].sort((a, b) => leafIndex(a) - leafIndex(b));

        const matches = [];
        for (const [round, roundMap] of this.rooms) {
            for (const [index, room] of roundMap) {
                matches.push({
                    id: `${this.id}-r${round}-${index}`,
                    round,
                    p1: room.p1 ? (room.p1.getUsername?.() || room.p1.username) : null,
                    p2: room.p2 ? (room.p2.getUsername?.() || room.p2.username) : null,
                    status: room.started ? MatchStatus.RUNNING : room.ended ? MatchStatus.FINISHED : MatchStatus.WAITING,
                    winner: room.winnerUsername,
                    winnerScore: room.winnerScore,
                    loser: room.loserUsername,
                    loserScore: room.loserScore,
                });
            }
        }

        return {
            type: SrvMessageType.SNAPSHOT,
            tournamentId: this.getId(),
            name: this.name,
            maxPlayers: this.maxPlayers,
            creator: this.creator.username || '',
            players: playersOrdered.map(p => ({
                username: p.getUsername?.() || p.username,
                connected: (!!p.isConnected?.() && p.getTournament()?.getId() === this.id),
                isReady: !!p.isReady?.(),
                isBot: !!p.isBot?.(),
            })),
            matches,
        };
    }

    /**
     * Send the current snapshot to all attached participants.
     */
    broadcastSnapshot() {
        this._broadcast(this.buildSnapshot());
    }

    /**
     * Tournament ID accessor.
     */
    getId() {
        return this.id;
    }

    /**
     * Pre-generate the full bracket rooms for all rounds based on maxPlayers.
     * Round count = floor(log2(maxPlayers)); each subsequent round halves match count.
     */
    _generateRooms() {
        this.rooms.clear();

        const n = this.maxPlayers;
        const rounds = Math.log2(n) | 0;

        for (let r = 1; r <= rounds; r++) {
            const count = n >> r;
            const roundMap = new Map();

            for (let i = 1; i <= count; i++) {
                const roomId = `${this.id}-r${r}-${i}`;
                roundMap.set(i, new Room({ tournament: this, id: roomId, difficulty: this.difficulty }));
            }
            this.rooms.set(r, roundMap);
        }
    }

    /**
     * Get a room by (round, matchIndex). Returns null if not found.
     */
    getRoom(r, i) {
        return this.rooms.get(r)?.get(i) || null;
    }

    convertTournamentToResult() {
        let result = {
            name: this.name,
            description: this.description,
            difficulty: this.difficulty,
            maxPlayer: this.maxPlayers,
            winner: this.getWinner()
        };

        result.participants = [];
        for (const [username, participant] of this.participants) {
            result.participants.push({
                id: participant.id,
                username: username,
            });
        }

        result.games = [];
        for (const [round, roundMap] of this.rooms) {
            for (const [index, room] of roundMap) {

                const p1_username = room.p1?.getUsername?.() ?? null;
                const p2_username = room.p2?.getUsername?.() ?? null;
                const p1_score = room.winnerUsername === p1_username ? room.winnerScore : room.loserScore;
                const p2_score = room.winnerUsername === p2_username ? room.winnerScore : room.loserScore;

                result.games.push({
                    game_num: this.id.charAt(0),
                    winner: room.winnerUsername,
                    p1: p1_username,
                    p2: p2_username,
                    p1_score: p1_score,
                    p2_score: p2_score,
                    duration_sec: room.totalTime / 1000,
                    started_at: new Date(room.startTime).toISOString(),
                });
            }
        }

        return result;
    }

    /**
     * Get winner from the final room. Returns null if tournament not ended.
     */
    getWinner() {
        if (!this.isEnded()) {
            return null;
        }

        const finalRound = this.rooms.size;
        const finalRoom = this.getRoom(finalRound, 1);
        if (!finalRoom || !finalRoom.winnerUsername) {
            return null;
        }

        return finalRoom.winnerUsername;
    }

    /**
     * Assign a player to the next free slot in round 1 (p1 first, then p2).
     */
    _assignNextFreeSlot(client) {
        const round1 = this.rooms.get(1);
        if (!round1) {
            return false;
        }

        for (const [i, room] of round1) {
            if (!room.p1) {
                client.y = room.state.paddles[client.getUsername()]?.y ?? (room.H / 2 - room.PAD_H / 2);
                room.setPlayer1(client);
                client.attachToRoom(room);
                client.position = { round: 1, match: i, slot: 'p1' };
                return true;
            }
            if (!room.p2) {
                client.y = room.state.paddles[client.getUsername()]?.y ?? (room.H / 2 - room.PAD_H / 2);
                room.setPlayer2(client);
                client.attachToRoom(room);
                client.position = { round: 1, match: i, slot: 'p2' };
                return true;
            }
        }
        return false;
    }

    /**
     * Move a winning client to their next-round room and correct slot.
     * Next match index = floor((currentMatch-1)/2) + 1; odd -> p1, even -> p2.
     */
    _assignNextRound(winnerClient, _roomIgnored) {
        const pos = winnerClient.position;
        if (!pos || pos.round == null || pos.match == null || pos.slot == null) {
            return false;
        }

        const currentRound = pos.round;
        const nextRound = currentRound + 1;

        const matchesInCurrentRound = this.maxPlayers >> currentRound;
        if (matchesInCurrentRound <= 0) {
            return false;
        }

        const nextMatchIndex = Math.floor((pos.match - 1) / 2) + 1;

        const nextRoom = this.getRoom(nextRound, nextMatchIndex);
        if (!nextRoom) {
            return false;
        }

        const nextSlot = (pos.match % 2 === 1) ? 'p1' : 'p2';
        const setPlayer = nextSlot === 'p1'
            ? nextRoom.setPlayer1.bind(nextRoom)
            : nextRoom.setPlayer2.bind(nextRoom);

        const alreadySame =
            (nextSlot === 'p1' && nextRoom.p1 && nextRoom.p1.getUsername?.() === winnerClient.getUsername()) ||
            (nextSlot === 'p2' && nextRoom.p2 && nextRoom.p2.getUsername?.() === winnerClient.getUsername());

        if (alreadySame) {
            winnerClient.position = { round: nextRound, match: nextMatchIndex, slot: nextSlot };
            winnerClient.attachToRoom(nextRoom);
            return true;
        }

        if ((nextSlot === 'p1' && nextRoom.p1) || (nextSlot === 'p2' && nextRoom.p2)) {
            return false;
        }

        setPlayer(winnerClient);
        winnerClient.position = { round: nextRound, match: nextMatchIndex, slot: nextSlot };
        winnerClient.attachToRoom(nextRoom);
        if (winnerClient.isBot()) {
            nextRoom.checkStart();
        }
        return true;
    }

    /**
     * Send a message to all participants currently attached to this tournament.
     */
    _broadcast(msg) {
        for (const client of this.participants.values()) {
            if (client.getTournament()?.getId() !== this.id) {
                continue;
            }
            try {
                client.send?.(msg);
            } catch {}
        }
    }
}

/**
 * Stable ordering for first-round seeding: maps a client to a leaf index.
 * Non-R1 players are sent to the end by returning a large value.
 */
function leafIndex(client) {
    const pos = client?.position;
    if (!pos || pos.round !== 1) {
        return 1e9;
    }
    const base = (pos.match - 1) * 2;
    const offset = pos.slot === 'p1' ? 0 : 1;
    return base + offset;
}

/**
 * Parse a room id of form "<tournamentId>-r<round>-<index>".
 * Returns { round: number, index: number } or null.
 */
export function parseRoomId(id) {
    const m = String(id || '').match(/^.+-r(\d+)-(\d+)$/);
    if (!m) {
        return null;
    }
    return { round: Number(m[1]), index: Number(m[2]) };
}
