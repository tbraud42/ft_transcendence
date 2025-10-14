import {ClientBase} from "./ClientBase.js";

export class Bot extends ClientBase {
    constructor(username) {
        super(null, username);
        this.interval = null
        this.currentState = null
    }
}