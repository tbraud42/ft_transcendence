import i18n from '../utils/lang/i18n'
import { renderPongMenu } from './pongMenu'
import {refreshToken} from "../api/jwt";
type SortKey = 'username' | 'wins' | 'gamesPlayed' | 'totalScore' | 'winStreak' | 'bestStreak' | 'winRate' | 'avgScore'
type SortOrder = 'asc' | 'desc'
interface LeaderEntry { username: string; wins: number; gamesPlayed: number; totalScore: number; winStreak: number; bestStreak: number }

function decorate(entry: LeaderEntry) {
    const winRate = entry.gamesPlayed > 0 ? (entry.wins / entry.gamesPlayed) : 0
    const avgScore = entry.gamesPlayed > 0 ? (entry.totalScore / entry.gamesPlayed) : 0
    return { ...entry, winRate, avgScore }
}
function multiComparator(primary: SortKey, order: SortOrder) {
    const keys: SortKey[] = [primary, 'wins', 'totalScore', 'winStreak', 'bestStreak', 'gamesPlayed', 'winRate', 'avgScore', 'username']
    const seen = new Set<string>()
    const chain = keys.filter(k => (seen.has(k) ? false : (seen.add(k), true)))
    const dir = (a: number|string, b: number|string) => {
        if (typeof a === 'string' && typeof b === 'string') {
            return order === 'desc' ? b.localeCompare(a) : a.localeCompare(b)
        }
        const na = a as number, nb = b as number
        return order === 'desc' ? (nb - na) : (na - nb)
    }
    return (a: ReturnType<typeof decorate>, b: ReturnType<typeof decorate>) => {
        for (const k of chain) {
            const va = a[k as keyof typeof a] as any
            const vb = b[k as keyof typeof b] as any
            if (va !== vb) {
                return dir(va, vb)
            }
        }
        return 0
    }
}
async function fetchLeaderboard(): Promise<LeaderEntry[]> {
    return [
        { username: 'Neo', wins: 42, gamesPlayed: 60, totalScore: 510, winStreak: 6, bestStreak: 9 },
        { username: 'Trinity', wins: 38, gamesPlayed: 55, totalScore: 470, winStreak: 2, bestStreak: 7 },
        { username: 'Morpheus', wins: 25, gamesPlayed: 44, totalScore: 420, winStreak: 4, bestStreak: 5 },
        { username: 'Switch', wins: 20, gamesPlayed: 31, totalScore: 270, winStreak: 1, bestStreak: 3 },
        { username: 'Apoc', wins: 12, gamesPlayed: 18, totalScore: 160, winStreak: 3, bestStreak: 3 },
    ]
}

/** Leaderboard with header-click sorting and centered title */
function renderLeaderboard(): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'flex flex-col gap-3'

    const title = document.createElement('h2')
    title.className = 'text-2xl font-semibold text-center'
    title.textContent = i18n.t('leaderboard_title')

    const controls = document.createElement('div')
    controls.className = 'w-full flex items-center justify-center gap-2 flex-wrap'

    const search = document.createElement('input')
    search.placeholder = i18n.t('search')
    search.className = 'px-3 py-1.5 rounded-lg bg-white/80 dark:bg-white/10 dark:text-white outline-none text-sm h-9 flex-1 min-w-[180px] max-w-md'
    controls.append(search)

    const tableScroll = document.createElement('div')
    tableScroll.className = 'w-full overflow-x-auto'
    const table = document.createElement('table')
    table.className = 'min-w-[860px] w-full text-left border-separate border-spacing-y-2'
    const thead = document.createElement('thead')
    const tbody = document.createElement('tbody')

    const headers: { key: SortKey, label: string }[] = [
        { key: 'username',   label: i18n.t('lb_col_player') },
        { key: 'wins',       label: i18n.t('lb_col_wins') },
        { key: 'gamesPlayed',label: i18n.t('lb_col_games') },
        { key: 'winRate',    label: i18n.t('lb_col_winrate') },
        { key: 'totalScore', label: i18n.t('lb_col_total') },
        { key: 'avgScore',   label: i18n.t('lb_col_avg') },
        { key: 'winStreak',  label: i18n.t('lb_col_streak') },
        { key: 'bestStreak', label: i18n.t('lb_col_best') },
    ]

    const headRow = document.createElement('tr')
    headers.forEach(({key, label}) => {
        const th = document.createElement('th')
        th.className = 'px-3 py-2 text-sm text-black/70 dark:text-white/70 select-none cursor-pointer'
        ;(th as any).dataset.key = key
        th.textContent = label
        headRow.appendChild(th)
    })
    thead.appendChild(headRow)
    table.append(thead, tbody)
    tableScroll.appendChild(table)
    wrapper.append(title, controls, tableScroll)

    let data: ReturnType<typeof decorate>[] = []
    let currentSortKey: SortKey = 'wins'
    let currentOrder: SortOrder = 'desc'

    const updateHeaderIndicators = () => {
        Array.from(headRow.children).forEach((th: any) => {
            const key = th.dataset.key as SortKey
            const base = headers.find(h => h.key === key)!.label
            th.textContent = key === currentSortKey ? base + (currentOrder === 'desc' ? ' ▼' : ' ▲') : base
            if (key === currentSortKey) {
                th.classList.add('text-white');
            } else {
                th.classList.remove('text-white')
            }
        })
    }

    const renderRows = () => {
        const q = search.value.trim().toLowerCase()
        const filtered = q ? data.filter(d => d.username.toLowerCase().includes(q)) : data.slice()
        filtered.sort(multiComparator(currentSortKey, currentOrder))

        tbody.replaceChildren()
        filtered.forEach((d, idx) => {
            const tr = document.createElement('tr')
            tr.className = 'bg-white/80 dark:bg-white/10 text-black dark:text-white rounded-xl overflow-hidden'
            tr.style.borderRadius = '12px'

            const rank = document.createElement('td'); rank.className = 'px-3 py-2 text-sm opacity-60'; rank.textContent = String(idx + 1)
            const user = document.createElement('td'); user.className = 'px-3 py-2 font-medium'; user.textContent = d.username
            const wins = document.createElement('td'); wins.className = 'px-3 py-2'; wins.textContent = String(d.wins)
            const games = document.createElement('td'); games.className = 'px-3 py-2'; games.textContent = String(d.gamesPlayed)
            const wr = document.createElement('td'); wr.className = 'px-3 py-2'; wr.textContent = (d.winRate * 100).toFixed(1) + '%'
            const total = document.createElement('td'); total.className = 'px-3 py-2'; total.textContent = String(d.totalScore)
            const avg = document.createElement('td'); avg.className = 'px-3 py-2'; avg.textContent = d.avgScore.toFixed(1)
            const streak = document.createElement('td'); streak.className = 'px-3 py-2'; streak.textContent = String(d.winStreak)
            const best = document.createElement('td'); best.className = 'px-3 py-2'; best.textContent = String(d.bestStreak)

            tr.append(rank, user, wins, games, wr, total, avg, streak, best)
            tbody.appendChild(tr)
        })
        updateHeaderIndicators()
    }

    Array.from(headRow.children).forEach((th: any) => {
        th.addEventListener('click', () => {
            const key = th.dataset.key as SortKey
            if (key === currentSortKey) {
                currentOrder = currentOrder === 'desc' ? 'asc' : 'desc'
            } else {
                currentSortKey = key; currentOrder = 'desc'
            }
            renderRows()
        })
    })

    ;(async () => {
        const raw = await fetchLeaderboard()
        data = raw.map(decorate)
        renderRows()
    })()

    return wrapper
}

export function renderHome(): HTMLElement {
    refreshToken().catch(() => {})
    const page = document.createElement('div')
    page.className = 'w-full h-full px-4 py-6'

    const grid = document.createElement('div')
    grid.className = 'grid gap-6 grid-cols-1 xl:grid-cols-2 items-start'

    const left = document.createElement('div')
    left.className = 'rounded-2xl border border-black/10 dark:border-white/10 bg-white/20 dark:bg-white/5 p-4 backdrop-blur'
    left.appendChild(renderPongMenu())

    const right = document.createElement('div')
    right.className = 'rounded-2xl border border-black/10 dark:border-white/10 bg-white/20 dark:bg-white/5 p-4 backdrop-blur'
    right.appendChild(renderLeaderboard())

    grid.append(left, right)
    page.append(grid)
    return page
}
