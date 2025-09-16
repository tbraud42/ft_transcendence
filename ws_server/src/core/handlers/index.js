import { CliMessageType } from '../client/protocol.js';

import handleAuth     from './auth.js';
import handleJoin     from './join.js';
import handleInput    from './input.js';
import handleReady    from './ready.js';
import handleAddBot   from './add_bot.js';
import handleRemoveBot   from './remove_bot.js';
import handleSnapshot from './snapshot.js';

const HANDLERS = {
    [CliMessageType.AUTH]:     handleAuth,
    [CliMessageType.JOIN]:     handleJoin,
    [CliMessageType.INPUT]:    handleInput,
    [CliMessageType.READY]:    handleReady,
    [CliMessageType.SNAPSHOT]: handleSnapshot,
    [CliMessageType.ADD_BOT]:  handleAddBot,
    [CliMessageType.REMOVE_BOT]:  handleRemoveBot,
};

export function registerHandlers(socket) {
    socket.on('message', (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw); 
        } catch {
            return; 
        }
        const type = (msg && typeof msg.type === 'number') ? msg.type : null;
        if (type === null) {
            return;
        }

        const h = HANDLERS[type];
        if (!h) {
            return;
        }

        h(msg, socket);
    });

    socket.on('close', () => {
        if (socket.__client && typeof socket.__client.onDisconnect === 'function') {
            socket.__client.onDisconnect();
        }
    });
}