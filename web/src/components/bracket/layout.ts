import { bubble, setBubble } from '../Bubble'
import { LeafAddress, Match, Player, RenderOptions } from '../../api/socket/types'
import { SrvSnapshot } from '../../api/socket/messageTypes'
import { MatchStatus, ClientStatus } from '../../api/socket/protocol'

const W = 176, H = 38, GX = 72, GY = 14, PAD = 14, CENTER = 260

export function geometry(perSide: number) {
    const rounds = Math.log2(perSide) + 1
    const leftWidth  = (rounds - 1) * (W + GX)
    const rightWidth = (rounds - 1) * (W + GX)
    const totalW = leftWidth + CENTER + rightWidth + W + PAD * 2
    const ladderH = perSide * (H + GY) - GY
    const finalBlock = H + 26
    const totalH = PAD + finalBlock + ladderH + PAD

    const xL = (lvl: number) => PAD + lvl * (W + GX)
    const xR = (lvl: number) => PAD + leftWidth + CENTER + (rounds - 1 - lvl) * (W + GX)
    const yBase = PAD + (H + 18)
    const stepY = (lvl: number) => (H + GY) * (1 << lvl)

    return { W, H, PAD, rounds, totalW, totalH, xL, xR, yBase, stepY, leftWidth }
}

export function pow2ceil(n: number) {
    let p = 1
    while (p < n) {
        p <<= 1
    }
    return p
}

export function buildLevels(stage: HTMLElement, perSide: number) {
    const g = geometry(perSide)
    const L: HTMLElement[][] = []
    const R: HTMLElement[][] = []

    L[0] = []; R[0] = []
    for (let i = 0; i < perSide; i++) {
        L[0].push(bubble(stage, g.xL(0), g.yBase + i * g.stepY(0), g.W, g.H))
        R[0].push(bubble(stage, g.xR(0), g.yBase + i * g.stepY(0), g.W, g.H))
    }

    const pos = (el: HTMLElement) => ({
        x: +el.style.left.replace('px',''),
        y: +el.style.top.replace('px',''),
    })

    for (let lvl = 1; lvl < g.rounds; lvl++) {
        const prevL = L[lvl - 1], prevR = R[lvl - 1]
        const count = prevL.length >> 1
        const curL: HTMLElement[] = [], curR: HTMLElement[] = []
        for (let i = 0; i < count; i++) {
            const aL = prevL[i * 2], bL = prevL[i * 2 + 1]
            const yL = Math.round((pos(aL).y + pos(bL).y) / 2)
            curL.push(bubble(stage, g.xL(lvl), yL, g.W, g.H))

            const aR = prevR[i * 2], bR = prevR[i * 2 + 1]
            const yR = Math.round((pos(aR).y + pos(bR).y) / 2)
            curR.push(bubble(stage, g.xR(lvl), yR, g.W, g.H))
        }
        L[lvl] = curL
        R[lvl] = curR
    }

    const centerX = PAD + g.leftWidth + CENTER / 2 + g.W / 2
    const finalBox = bubble(stage, centerX - g.W / 2, PAD, g.W, g.H)
    setBubble(finalBox, 'Winner', ClientStatus.EMPTY)

    return { L, R, finalBox, g }
}

export function mapRound1(snap: SrvSnapshot, max: number) {
    const raw = (snap.matches || []).filter(m => (m.round ?? 1) === 1)
    const r1: Match[] = []
    for (let k = 0; k < max; k++) {
        r1[k] = raw[k] || { id: `ph-${k}`, round: 1, p1: null, p2: null, status: MatchStatus.WAITING }
    }
    return r1
}

export function decorateLeaves(
    L: HTMLElement[][],
    R: HTMLElement[][],
    r1: Match[],
    players: Map<string, Player>,
    snap: SrvSnapshot,
    opts: RenderOptions
) {
    const perSide = L[0].length

    const statusFor = (label: string | null): number => {
        if (!label) {
            return ClientStatus.EMPTY
        }
        const p = players.get(label)
        if (!p) {
            return ClientStatus.EMPTY
        }
        if (p.isReady) {
            return ClientStatus.READY
        }
        if (p.connected) {
            return ClientStatus.CONNECTED
        }
        return ClientStatus.OFFLINE
    }

    const decorate = (
        el: HTMLElement, label: string | null,
        side: 'left'|'right', pairIdx: number, posName: 'top'|'bottom'
    ) => {
        let v = statusFor(label)

        if (label && opts.myUsername && label === opts.myUsername) {
            const readyLocal = !!opts.isReady?.(opts.myUsername, { side, pair: pairIdx, pos: posName })
            if (readyLocal) {
                v = ClientStatus.READY
            }
        }

        setBubble(el, label, v)

        el.querySelectorAll('button[data-b]').forEach(b => b.remove())
        const addr: LeafAddress = { side, pair: pairIdx, pos: posName }

        const isOwner =
            !!opts.isOwner ||
            (!!snap.creator && opts.myUsername === snap.creator)

        //add bot
        if (!label && isOwner) {
            const b = button(
                'Add bot',
                'px-2 py-1 text-[11px] rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 ml-2'
            )
            b.onclick = e => {
                e.stopPropagation(); opts.onAddBot?.(addr) 
            }
            b.dataset.b = 'add'
            mount(el, b)
        }

        //remove bot
        if (label && isOwner) {
            const p = players.get(label)
            if (!p) {
                return
            }
            if (p.isBot) {
                const b = button(
                    'Remove bot',
                    'px-2 py-1 text-[11px] rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 ml-2'
                )
                b.onclick = e => {
                    e.stopPropagation(); opts.onRemoveBot?.(addr) 
                }
                b.dataset.b = 'remove'
                mount(el, b)
            }
        }

        if (label && opts.myUsername === label) {
            const readyLocal = !!opts.isReady?.(opts.myUsername, addr)
            const cls = readyLocal
                ? 'px-2 py-1 text-[11px] rounded ml-2 bg-sky-500/25 border border-sky-400/40'
                : 'px-2 py-1 text-[11px] rounded ml-2 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30'
            const b = button(readyLocal ? 'Ready ✅' : 'Ready', cls)
            b.onclick = e => {
                e.stopPropagation(); opts.onReady?.(addr) 
            }
            b.dataset.b = 'ready'
            mount(el, b)
        }
    }

    if (perSide === 1) {
        const m = r1[0]
        decorate(L[0][0], m?.p1 ?? null, 'left',  0, 'top')
        decorate(R[0][0], m?.p2 ?? null, 'right', 0, 'top')
        return
    }

    for (let i = 0; i < perSide / 2; i++) {
        const leftPair  = r1[i * 2]     || { id: `ph-L-${i}`, round: 1, p1: null, p2: null, status: MatchStatus.WAITING }
        const rightPair = r1[i * 2 + 1] || { id: `ph-R-${i}`, round: 1, p1: null, p2: null, status: MatchStatus.WAITING }

        const li = i * 2
        decorate(L[0][li],     leftPair.p1, 'left',  i, 'top')
        decorate(L[0][li + 1], leftPair.p2, 'left',  i, 'bottom')

        const ri = i * 2
        decorate(R[0][ri],     rightPair.p1, 'right', i, 'top')
        decorate(R[0][ri + 1], rightPair.p2, 'right', i, 'bottom')
    }
}

/* ---------- ui helpers ---------- */

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