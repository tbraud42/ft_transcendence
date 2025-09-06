module.exports = function send(ws, obj) {
    try {
        ws.send(JSON.stringify(obj));
    } catch (_) {}
};