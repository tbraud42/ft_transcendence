import {OnlinePlayer} from "./players/OnlinePlayer";

export interface RoomState {
    id: string;
    players: PlayerBase[];
    maxPlayers: number;
    isPrivate: boolean;
    gameStarted: boolean;
    hostId: string;
    createdAt: Date;
}

export abstract class Room {
    protected state: RoomState;
    protected socket?: WebSocket;

    constructor(id: string, maxPlayers: number, isPrivate: boolean, hostId: string) {
        this.state = {
            id,
            players: [],
            maxPlayers,
            isPrivate,
            gameStarted: false,
            hostId,
            createdAt: new Date(),
        };
    }

    init(socket: WebSocket): void {
        this.socket = socket;
        //TODO: I don't fcking know what im supposed to do here
    }

    join(player: OnlinePlayer): void {
        if (this.state.players.length < this.state.maxPlayers && !this.state.gameStarted) {
            this.state.players.push(player);
            this.sendUpdate();
        }
    }

    leave(playerId: string): void {
        this.state.players = this.state.players.filter(p => p.getId() !== playerId);
        this.sendUpdate();
    }

    startGame(): void {
        if (this.state.players.length > 1 && !this.state.gameStarted) {
            this.state.gameStarted = true;
            this.sendUpdate();
        }
    }

    sendUpdate(): void {
        if (this.socket) {
            this.socket.send(JSON.stringify({
                type: 'room_update',
                state: this.state,
            }));
        }
    }
}