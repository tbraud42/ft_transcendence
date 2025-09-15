import {ClientStatus} from "./bracket/types";

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

export function setBubble(el: HTMLElement, label: string | null, v: ClientStatus) {
    el.textContent = label ?? '—'
    setStatus(el, v)
}

//TODO: replace all if
export function setStatus(el: HTMLElement, v: ClientStatus) {
    el.className = base();

    if (v === ClientStatus.EMPTY)       {
        el.classList.add('opacity-60');
    }
    if (v === ClientStatus.OFFLINE)     {
        el.classList.add('opacity-50');
    }

    if (v === ClientStatus.CONNECTED)   {
        el.classList.add('ring-2','ring-amber-400/70','bg-amber-400/10');
    }

    if (v === ClientStatus.READY)       {
        el.classList.add('ring-2','ring-emerald-400/80','bg-emerald-400/15');
    }

    if (v === ClientStatus.PLAYING)     {
        el.classList.add('ring-2','ring-indigo-400/80','bg-indigo-400/10');
    }
    if (v === ClientStatus.WINNER)      {
        el.classList.add('bg-emerald-600/20','border-emerald-500/30');
    }
    if (v === ClientStatus.ELIMINATED)  {
        el.classList.add('bg-rose-600/20','border-rose-500/30','line-through');
    }
}

const base = () =>
    'flex items-center justify-center rounded-lg border text-xs ' +
    'bg-white/5 border-white/15 text-white select-none'