import { OnlinePlayer } from "./players/OnlinePlayer";
import { PlayerBase } from "./players/PlayerBase";
import { Difficulty, GameMode } from "../pongState";
import { getTournament } from "../../../api/game";
import { env } from "../../../utils/env";
import { getToken } from "../../../utils/auth/auth";
import { joinRoomPacket } from "./packets";

export interface RoomState {
    id: string;
    difficulty: Difficulty;
    gameMode: GameMode;
    maxPlayers: number;
    isPrivate: boolean;
    ownerId: string;
    players: PlayerBase[];
    gameStarted: boolean;
    createdAt: Date;
}

export class Room {
    protected state: RoomState | undefined;
    protected socket?: WebSocket;

    constructor(
        private id: string,
        private difficulty: Difficulty,
        private gameMode: GameMode,
        private maxPlayers: number,
        private isPrivate: boolean,
        private ownerId: string | null = null
    ) {}

    init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const commonState = {
                id: this.id,
                difficulty: this.difficulty,
                gameMode: this.gameMode,
                maxPlayers: this.maxPlayers,
                isPrivate: this.isPrivate,
                ownerId: this.ownerId || this.gameMode.toLowerCase(),
                players: [],
                gameStarted: false,
                createdAt: new Date(),
            };

            if (this.gameMode === GameMode.ONLINE) {
                getTournament(this.id).then((tournament) => {
                    if (!tournament) return reject(new Error(`Tournament with ID ${this.id} not found`));

                    this.state = {
                        ...commonState,
                        id: tournament.id,
                        difficulty: tournament.difficulty,
                        maxPlayers: tournament.maxPlayers,
                        isPrivate: tournament.isPrivate,
                        ownerId: tournament.ownerId || this.ownerId,
                        createdAt: new Date(tournament.createdAt),
                    };

                    this.initOnlineMode()
                        .then(() => resolve())
                        .catch(err => reject(err));
                }).catch(reject);
            } else {
                this.state = commonState;
                resolve();
            }
        });
    }

    initOnlineMode(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.state) return reject(new Error('State is undefined'));

            this.socket = new WebSocket(
                `wss://${env.PONG_WS_URL}/${this.state.id}?token=${getToken()}`
            );

            this.socket.onopen = () => {
                console.log("WebSocket connected");
                resolve();
            };

            this.socket.onerror = (err) => {
                console.error("WebSocket error", err);
                reject(err);
            };

            this.socket.onclose = () => {
                console.info("WebSocket closed");
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("Received message:", data);
            };
        });
    }

    join(player: OnlinePlayer): void {
        if (!this.state) throw new Error("Room not initialized");

        if (this.state.players.length < this.state.maxPlayers) {
            this.state.players.push(player);
            if (this.state.gameMode === GameMode.ONLINE && this.socket?.readyState === WebSocket.OPEN) {
                const packet = JSON.stringify(joinRoomPacket(this.state.id))
                console.log(packet)
                this.socket.send(packet);
            }
        }
    }

    leave(playerId: string): void {
        if (!this.state) {
            return;
        }
        this.state.players = this.state.players.filter((p) => p.getId() !== playerId);
        this.sendUpdate();
    }

    startGame(): void {
        if (!this.state) return;
        if (this.state.players.length > 1 && !this.state.gameStarted) {
            this.state.gameStarted = true;
            this.sendUpdate();
        }
    }

    close(): void {
        this.state = undefined;
        if (this.socket) {
            this.socket.close();
            this.socket = undefined;
        }
    }

    sendUpdate(): void {
        if (this.socket && this.state) {
            this.socket.send(
                JSON.stringify({
                    type: "room_update",
                    state: this.state,
                })
            );
        }
    }
}