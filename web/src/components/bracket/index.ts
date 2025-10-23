import type { RenderOptions, Player } from '../../api/socket/types'
import { buildLevels, pow2ceil } from './layout'
import { createSvg, draw } from './svg'
import { SrvSnapshot } from '../../api/socket/messageTypes'
import { decorateFromMatches } from './matches-render'

export function renderBracket(host: HTMLElement, snap: SrvSnapshot, opts: RenderOptions = {}) {
    host.innerHTML = ''

    const outer = div('w-full flex justify-center bg-black/20 min-h-[600px]')
    host.append(outer)

    const card = div('w-full max-w-[1400px] rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-sm p-6 shadow-lg')
    outer.append(card)

    const title = div('text-lg font-semibold text-white mb-4')
    title.textContent = snap.name || `Tournament #${snap.tournamentId}`
    card.append(title)

    const scene = div('relative overflow-auto rounded-xl border border-white/10 bg-[#171a21] h-[600px] flex justify-center items-center')
    card.append(scene)

    const stage = div('relative')
    scene.append(stage)

    const max = pow2ceil(Math.max(2, snap.maxPlayers || (snap.players?.length ?? 2)))
    const perSide = max / 2

    const { L, R, finalBox, g } = buildLevels(stage, perSide)
    stage.style.width  = `${g.totalW}px`
    stage.style.height = `${g.totalH}px`

    const players = new Map<string, Player>()
    snap.players.forEach(p => players.set(p.username, p))

    decorateFromMatches(L, R, finalBox, snap, players, opts, max)

    const svg = createSvg(stage, g.totalW, g.totalH)
    const redraw = () => draw(svg, stage, L, R, finalBox)
    requestAnimationFrame(() => requestAnimationFrame(redraw))
    new ResizeObserver(() => requestAnimationFrame(redraw)).observe(stage)
}

function div(cls: string) {
    const d = document.createElement('div')
    d.className = cls
    return d
}