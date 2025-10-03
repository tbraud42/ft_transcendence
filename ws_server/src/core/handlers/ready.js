export default function handleReady(msg, socket) {
    const c = socket.__client
    if (!c?.auth || !c.tournament) {
        return
    }
    const ready = msg?.ready === true
    console.log(ready)
    c.tournament.setReady(c.username, ready)
}
