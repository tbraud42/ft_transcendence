import { PlayerBase } from './PlayerBase';
import { WSClient } from '../../../../socket/WSClient';

/**
 * OnlinePlayer
 * - Reads remote Y from server updates (setRemoteY)
 * - Sends local input intents (up/down) to the server via WSClient.input()
 * - Does NOT perform local movement integration; the server is authoritative.
 */
export class OnlinePlayer extends PlayerBase {
    private ws: WSClient;
    private slot: 0 | 1;
    private remoteY: number = 0;
    private lastSentUp = false;
    private lastSentDown = false;

    constructor(
        isLeft: boolean,
        canvas: HTMLCanvasElement,
        name: string,
        ws: WSClient,
        slot: 0 | 1,
        speed: number = 5
    ) {
        super(isLeft, canvas, name, speed);
        this.ws = ws;
        this.slot = slot;
        this.remoteY = (canvas.height - this.height) / 2;
        this.setupControls();
    }

    setRemoteY(y: number): void {
        this.remoteY = Math.max(0, Math.min(this.canvas.height - this.height, y));
    }

    private sendIfChanged(): void {
        if (this.lastSentUp !== this.moveUp || this.lastSentDown !== this.moveDown) {
            this.lastSentUp = this.moveUp;
            this.lastSentDown = this.moveDown;
            this.ws.input(this.moveUp, this.moveDown);
        }
    }

    private setupControls(): void {
        const onKeyDown = (e: KeyboardEvent) => {
            if (this.isLeft) {
                if (e.key === 's' || e.key === 'S') {
                    this.moveUp = true;
                }
                if (e.key === 'w' || e.key === 'W') {
                    this.moveDown = true;
                }
            } else {
                if (e.key === 'ArrowDown') {
                    this.moveUp = true;
                }
                if (e.key === 'ArrowUp') {
                    this.moveDown = true;
                }
            }
            this.sendIfChanged();
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (this.isLeft) {
                if (e.key === 's' || e.key === 'S') {
                    this.moveUp = false;
                }
                if (e.key === 'w' || e.key === 'W') {
                    this.moveDown = false;
                }
            } else {
                if (e.key === 'ArrowDown') {
                    this.moveUp = false;
                }
                if (e.key === 'ArrowUp') {
                    this.moveDown = false;
                }
            }
            this.sendIfChanged();
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    update(): void {
        this.y = this.remoteY;
    }
}