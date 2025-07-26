import WebSocket from 'ws'
import https from 'https'
import jwt from 'jsonwebtoken'
import readline from 'readline'

const token = jwt.sign({ username: 'test' }, 'superclesecrete123', { expiresIn: '1h' })

console.log(`Generated token: ${token}`)

const agent = new https.Agent({ rejectUnauthorized: false })

const socket = new WebSocket(`wss://pong.ws.dev.local/?token=${token}`, { agent })

// === Terminal Input Setup ===
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
})

// === WebSocket Events ===
socket.on('open', () => {
    console.log('Connected (self-signed accepted)')
    socket.send('{"type":"ping"}')

    rl.prompt()

    rl.on('line', (line) => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(line.trim())
        } else {
            console.log('Socket not connected.')
        }
        rl.prompt()
    })
})

socket.on('message', (msg) => {
    console.log(msg.toString())
})

socket.on('close', (code, reason) => {
    console.log(`Connection closed: ${code} - ${reason.toString()}`)
    rl.close()
})

socket.on('error', (err) => {
    console.error('Error:', err)
})