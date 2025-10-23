import { ClientStatus } from "../api/socket/types";

/**
 * Create and display a bubble element at a given position and size.
 */
export function bubble(stage: HTMLElement, x: number, y: number, w: number, h: number) {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.className = base();
    el.textContent = '—';
    stage.appendChild(el);
    return el;
}

/**
 * Update a bubble's label and visual status.
 */
export function setBubble(el: HTMLElement, label: string | null, v: ClientStatus) {
    el.textContent = label ?? '—';
    setStatus(el, v);
}

/**
 * Apply CSS status styles based on the client status value.
 */
export function setStatus(el: HTMLElement, v: ClientStatus) {
    el.className = base();

    // Neutral states
    if (v === ClientStatus.EMPTY) {
        el.classList.add('opacity-60');
    }
    if (v === ClientStatus.OFFLINE) {
        el.classList.add('opacity-50');
    }

    // Active states
    if (v === ClientStatus.CONNECTED) {
        el.classList.add('ring-2', 'ring-amber-400/70', 'bg-amber-400/10');
    }
    if (v === ClientStatus.READY) {
        el.classList.add('ring-2', 'ring-emerald-400/80', 'bg-emerald-400/15');
    }
    if (v === ClientStatus.PLAYING) {
        el.classList.add('ring-2', 'ring-indigo-400/80', 'bg-indigo-400/10');
    }

    // End states
    if (v === ClientStatus.WINNER) {
        el.classList.add(
            'bg-emerald-700/60',
            'border-emerald-500/60',
            'font-semibold',
            'text-emerald-100',
            'ring-2',
            'ring-emerald-500/40'
        );
    }

    if (v === ClientStatus.ELIMINATED) {
        el.classList.add(
            'bg-rose-700/10',
            'border-rose-500/20',
            'text-rose-300/60',
            'opacity-50'
        );
    }
}

/**
 * Base CSS classes shared by all bubbles.
 */
const base = () =>
    'flex items-center justify-center rounded-lg border text-xs ' +
    'bg-white/5 border-white/15 text-white select-none';