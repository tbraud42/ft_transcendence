module.exports = {
    type: 'ping',
    requiresAuth: false,
    handle(_msg, { ws, send }) {
        send(ws, { type: 'pong', at: Date.now() });
    },
};