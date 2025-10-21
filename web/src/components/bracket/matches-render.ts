import { setBubble } from '../Bubble'
import type { LeafAddress, Match, Player, RenderOptions } from '../../api/socket/types'
import type { SrvSnapshot } from '../../api/socket/messageTypes'
import { ClientStatus, MatchStatus } from '../../api/socket/protocol'

/** Group matches by round and sort by index in id */
function groupByRound(snap: SrvSnapshot): Map<number, Match[]> {
    const by = new Map<number, Match[]>()
    const matches = (snap.matches || []).slice().sort((a, b) => {
        // assumes ids like "<tid>-r<round>-<index>"
        const ai = parseInt(String(a.id).split('-r').pop()!.split('-')[1] || '0', 10)
        const bi = parseInt(String(b.id).split('-r').pop()!.split('-')[1] || '0', 10)
        return ai - bi
    })
    for (const m of matches) {
        const r = m.round ?? 1
        if (!by.has(r)) by.set(r, [])
        by.get(r)!.push(m)
    }
    return by
}

/** Status helper */
function statusFor(label: string | null, players: Map<string, Player>): ClientStatus {
    if (!label) return ClientStatus.EMPTY
    const p = players.get(label)
    if (!p) return ClientStatus.EMPTY
    if (p.isReady) return ClientStatus.READY
    if (p.connected) return ClientStatus.CONNECTED
    return ClientStatus.OFFLINE
}

/** Decorate a leaf bubble (only round 1 gets actions) */
function decorateLeaf(
    el: HTMLElement,
    label: string | null,
    side: 'left'|'right',
    pairIdx: number,
    posName: 'top'|'bottom',
    snap: SrvSnapshot,
    players: Map<string, Player>,
    opts: RenderOptions
) {
    let v = statusFor(label, players)
    if (label && opts.myUsername && label === opts.myUsername) {
        const readyLocal = !!opts.isReady?.(opts.myUsername, { side, pair: pairIdx, pos: posName })
        if (readyLocal) v = ClientStatus.READY
    }
    setBubble(el, label, v)

    el.querySelectorAll('button[data-b]').forEach(b => b.remove())
    const addr: LeafAddress = { side, pair: pairIdx, pos: posName }
    const isOwner = !!opts.isOwner || (!!snap.creator && opts.myUsername === snap.creator)

    if (!label && isOwner) {
        const b = button('Add bot','px-2 py-1 text-[11px] rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 ml-2')
        b.onclick = e => { e.stopPropagation(); opts.onAddBot?.(addr) }
        b.dataset.b = 'add'
        mount(el, b)
    }
    if (label && opts.myUsername === label) {
        const readyLocal = !!opts.isReady?.(opts.myUsername, addr)
        const cls = readyLocal
            ? 'px-2 py-1 text-[11px] rounded ml-2 bg-sky-500/25 border border-sky-400/40'
            : 'px-2 py-1 text-[11px] rounded ml-2 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30'
        const b = button(readyLocal ? 'Ready ✅' : 'Ready', cls)
        b.onclick = e => { e.stopPropagation(); opts.onReady?.(addr) }
        b.dataset.b = 'ready'
        mount(el, b)
    }
    if (label && isOwner) {
        const p = players.get(label)
        if (!p || label === snap.creator) return
        const b = button(p.isBot ? 'Remove bot' : 'Remove player','px-2 py-1 text-[11px] rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 ml-2')
        b.onclick = e => { e.stopPropagation(); opts.onRemove?.(addr) }
        b.dataset.b = 'remove'
        mount(el, b)
    }
}

/** Fill round 1 leaves from matches split into left/right halves */
function fillRound1(
    L: HTMLElement[][],
    R: HTMLElement[][],
    r1: Match[],
    players: Map<string, Player>,
    snap: SrvSnapshot,
    opts: RenderOptions,
    max: number
) {
    const perSide = L[0].length
    const totalMatches = r1.length // = max/2
    if (perSide === 1) {
        const m = r1[0] || { p1: null, p2: null, status: MatchStatus.WAITING, id: 'ph', round: 1 }
        decorateLeaf(L[0][0], m.p1 ?? null, 'left',  0, 'top', snap, players, opts)
        decorateLeaf(R[0][0], m.p2 ?? null, 'right', 0, 'top', snap, players, opts)
        return
    }

    const half = Math.max(1, totalMatches >> 1) // left matches count
    const leftMatches  = r1.slice(0, half)
    const rightMatches = r1.slice(half, half * 2)

    // left side: each match -> 2 leaves
    for (let i = 0; i < leftMatches.length; i++) {
        const m = leftMatches[i]
        const li = i * 2
        decorateLeaf(L[0][li],     m?.p1 ?? null, 'left',  i, 'top',    snap, players, opts)
        decorateLeaf(L[0][li + 1], m?.p2 ?? null, 'left',  i, 'bottom', snap, players, opts)
    }
    // right side
    for (let i = 0; i < rightMatches.length; i++) {
        const m = rightMatches[i]
        const ri = i * 2
        decorateLeaf(R[0][ri],     m?.p1 ?? null, 'right', i, 'top',    snap, players, opts)
        decorateLeaf(R[0][ri + 1], m?.p2 ?? null, 'right', i, 'bottom', snap, players, opts)
    }
}

/** Fill upper levels (round >= 2). Labels use p1/p2 if provided; no buttons there. */
function fillUpperRounds(
    L: HTMLElement[][],
    R: HTMLElement[][],
    grouped: Map<number, Match[]>,
    max: number,
    players: Map<string, Player>
) {
    const rounds = Math.log2(max) // total rounds from leaves to final
    for (let r = 2; r <= rounds; r++) {
        const level = r - 1
        const list = grouped.get(r) || []
        const total = list.length                      // = max >> r
        const half  = Math.max(0, total >> 1)          // split per side
        const left  = list.slice(0, half)
        const right = list.slice(half, half * 2)

        // left side nodes at level
        for (let i = 0; i < left.length && L[level]?.[i]; i++) {
            const m = left[i]
            const label = m?.p1 || m?.p2 || null
            setBubble(L[level][i], label, statusFor(label, players))
        }
        // right side nodes at level
        for (let i = 0; i < right.length && R[level]?.[i]; i++) {
            const m = right[i]
            const label = m?.p1 || m?.p2 || null
            setBubble(R[level][i], label, statusFor(label, players))
        }
    }
}

/** Public entry used by renderBracket */
export function decorateFromMatches(
    L: HTMLElement[][],
    R: HTMLElement[][],
    finalBox: HTMLElement,
    snap: SrvSnapshot,
    players: Map<string, Player>,
    opts: RenderOptions,
    max: number
) {
    const grouped = groupByRound(snap)

    const r1 = grouped.get(1) || []
    fillRound1(L, R, r1, players, snap, opts, max)

    fillUpperRounds(L, R, grouped, max, players)

    // final box: show winner if server sets it as p1/p2 in last round or keep "Winner"
    const lastRound = Math.log2(max)
    const finals = grouped.get(lastRound) || []
    const fm = finals[0]
    const label = fm?.winner || fm?.p1 || fm?.p2 || null
    if (label) setBubble(finalBox, label, ClientStatus.WINNER)
}

/* ui helpers */
function button(label: string, cls: string) {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = label
    b.className = cls + ' focus:outline-none transition'
    return b
}
function mount(el: HTMLElement, btn: HTMLButtonElement) {
    el.style.display = 'flex'
    el.style.alignItems = 'center'
    el.style.justifyContent = 'center'
    el.style.gap = '8px'
    btn.setAttribute('data-b', '1')
    el.appendChild(btn)
}