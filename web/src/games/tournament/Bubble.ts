export type Variant =
    | 'empty'
    | 'connected'
    | 'ready'
    | 'offline'
    | 'playing'
    | 'winner'
    | 'eliminated'

export function bubble(stage: HTMLElement, x: number, y: number, w: number, h: number) {
    const el = document.createElement('div')
    el.style.position = 'absolute'
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    el.style.width = `${w}px`
    el.style.height = `${h}px`
    el.className = base()
    el.textContent = '—'
    stage.appendChild(el)
    return el
}

export function setBubble(el: HTMLElement, label: string | null, v: Variant) {
    el.textContent = label ?? '—'
    setVariant(el, v)
}

export function setVariant(el: HTMLElement, v: Variant) {
    el.className = base()
    if (v === 'empty') {
        el.classList.add('opacity-70')
    }
    if (v === 'connected') {
        el.classList.add('ring-1', 'ring-emerald-400/60')
    }
    if (v === 'ready') {
        el.classList.add('ring-2', 'ring-sky-400')
    }
    if (v === 'offline') {
        el.classList.add('opacity-50')
    }
    if (v === 'playing') {
        el.classList.add('ring-2', 'ring-indigo-400')
    }
    if (v === 'winner') {
        el.classList.add('bg-emerald-600/25', 'border-emerald-500/30')
    }
    if (v === 'eliminated') {
        el.classList.add('bg-rose-600/20', 'border-rose-500/30', 'line-through')
    }
}

const base = () =>
    'flex items-center justify-center rounded-lg border text-xs ' +
    'bg-white/5 border-white/15 text-white select-none'