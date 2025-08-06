import {LocalPlayer} from "./LocalPlayer";

export class OnlinePlayer extends LocalPlayer {
    protected readonly id: string

    constructor(
        name: string,
        playerId: string,
        speed: number = 5
    ) {
        super(true, document.createElement('canvas'), name, speed)
        this.id = playerId
    }

    getName(): string {
        return this.name
    }

    getId(): string {
        return this.id
    }

    update(): void {
        //TODO: IDK !!!
    }
}