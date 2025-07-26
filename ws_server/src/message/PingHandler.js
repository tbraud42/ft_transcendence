export function PingHandler(ws, msg, payload) {
    ws.send(JSON.stringify({
        type: 'ping',
        success: true,
        message: 'pong'
    }));
}
