import {BallBase} from "../balls/BallBase";
import {LocalPlayer} from "./LocalPlayer";

export class OnlinePlayer extends LocalPlayer {
    protected readonly id: string
    protected readonly playerToken: string

    constructor(
        isLeft: boolean,
        canvas: HTMLCanvasElement,
        playerName: string,
        playerId: string,
        playerToken: string,
        speed: number = 5
    ) {
        super(isLeft, canvas, playerName, speed)
        this.id = playerId
        this.playerToken = playerToken
    }

    getId(): string {
        return this.id
    }

    getToken(): string {
        return this.playerToken
    }

    update(): void {
        //TODO: IDK !!!
    }
}