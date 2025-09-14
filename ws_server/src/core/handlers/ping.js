export default function handlePing(_msg, socket) {
    try {
        socket.send(JSON.stringify({ type:'pong' })) 
    } catch {}
}