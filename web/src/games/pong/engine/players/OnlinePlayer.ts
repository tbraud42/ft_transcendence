import {LocalPlayer} from "./LocalPlayer";

export class OnlinePlayer extends LocalPlayer {
    protected readonly id: string

    constructor(
        playerName: string,
        playerId: string,
        speed: number = 5
    ) {
        super(true, document.createElement('canvas'), playerName, speed)
        this.id = playerId
    }

    getId(): string {
        return this.id
    }

    update(): void {
        //TODO: IDK !!!
    }
}