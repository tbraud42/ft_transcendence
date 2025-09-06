export function createPongCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    canvas.className = 'rounded-xl shadow-lg border border-white'
    return canvas
}