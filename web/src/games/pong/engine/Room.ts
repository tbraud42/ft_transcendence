import { OnlinePlayer } from "./players/OnlinePlayer";
import { PlayerBase } from "./players/PlayerBase";
import {Difficulty, GameMode, roomId} from "../pongState";
import { getTournament } from "../../../api/game";
import { env } from "../../../utils/env";
import { getToken } from "../../../utils/auth/auth";
import { joinRoomPacket } from "./handler/packets";
import {handlePacket} from "./handler/PacketHandler";
import {WSClient} from "../../../socket/WSClient";

export interface RoomState {
    id: number;
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
    protected client?: WSClient;

    constructor(
        private id: number,
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
            if (this.gameMode === GameMode.ONLINE && this.id !== roomId) {
                getTournament(this.id).then((tournament) => {
                    if (!tournament) {
                        return reject(new Error(`Tournament with ID ${this.id} not found`));
                    }

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

    async initOnlineMode(): Promise<void> {
        this.client = new WSClient(`wss://${env.PONG_WS_URL}`, this.id, getToken());

        await this.client.ready();

        this.client.send("say", { text: "hello from client" });

        this.client.on("broadcast", (p) => {
            console.log(p.from?.name, ":", p.text);
        });
    }

    join(player: OnlinePlayer): void {
        if (!this.state) throw new Error("Room not initialized");

        if (this.state.players.length < this.state.maxPlayers) {
            this.state.players.push(player);
            if (this.state.gameMode === GameMode.ONLINE && this.socket?.readyState === WebSocket.OPEN) {
                const packet = JSON.stringify(joinRoomPacket(this.state.id))
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