import i18n from '../utils/lang/i18n'
import {
    userInfoById,
    getDashboard,
    userTournament,
    userInfoByUsername,
    changeUserAvatar,
    addFriend, deleteFirend
} from '../api/methode'
import { renderPieWinRate } from '../components/charts/PieWinRate'
import { renderLineMatchesOverTime } from '../components/charts/LineMatchesOverTime'
import { renderBarScores } from '../components/charts/BarScores'
import {getAvatar, getUsername, setAvatar} from '../utils/storage'
import profileIcon from '../img/profile-icon.svg'
import {byteSizeToHumanReadable, fileToBase64} from "../utils/files";
import {createOverlayCard} from "../components/overlayCard";
import {createFollowButton} from "../components/followButton";

type GamesInfo = {
    id: number
    username: string
    created_at: string | null
    last_timestamp: string | null
    avatar: string | null
    is_twofa_enabled?: boolean | null
    total_seconds?: number | null
    total_games?: number | null
    follow?: boolean | null
}

type Dashboard = {
    userId: number
    username: string
    wins: number
    losses: number
    games: number
    winRate: number
    time: number
}

type TournamentRow = {
    game_id: number
    tournament_id: number
    started_at: string
    p1_score: number
    p2_score: number
    winner_username: string
    game_num: number
    opponent_username: string
    your_score: number
    opp_score: number
    did_win: 0 | 1
}

/** Render the stats page */
export function renderStats(userName: string): HTMLElement {
    const page = div('w-full h-full min-h-0')
    const scroller = div(
        'mx-auto w-full max-w-5xl px-4 py-10 overflow-y-auto ' +
        'max-h-[calc(100dvh-32px)] md:max-h-[calc(100dvh-48px)] min-w-0 space-y-10'
    )
    scroller.style.maxHeight = 'calc(100vh - 32px)'
    ;(scroller.style as any).webkitOverflowScrolling = 'touch'
    page.appendChild(scroller)

    scroller.append(
        h('h2', 'text-2xl font-bold text-gray-800 dark:text-white text-center', i18n.t('stats_title') || 'Player Stats')
    )

    const topGrid = div('grid grid-cols-1 md:grid-cols-2 gap-8 items-start')

    const cardUser = card()
    cardUser.append(sectionTitle(userName || i18n.t('stats_user')))
    const userContent = div('space-y-3 text-left')
    cardUser.append(userContent)

    const cardOverview = card()
    cardOverview.append(sectionTitle(i18n.t('stats_overview') || 'Overview'))
    const metrics = div('grid grid-cols-2 sm:grid-cols-3 gap-3')
    cardOverview.append(metrics)
    topGrid.append(cardUser, cardOverview)

    const chartsGrid = div('grid grid-cols-1 md:grid-cols-2 gap-8 items-start')

    const cardPie = card()
    cardPie.append(sectionTitle(i18n.t('stats_chart_winrate') || 'Win Rate'))
    const pieHost = div('w-full flex justify-center')
    cardPie.append(pieHost)

    const cardLine = card()
    cardLine.append(sectionTitle(i18n.t('stats_chart_over_time') || 'Matches Over Time'))
    const lineHost = div('w-full')
    cardLine.append(lineHost)
    chartsGrid.append(cardPie, cardLine)

    const cardRecent = card()
    cardRecent.append(sectionTitle(i18n.t('stats_recent') || 'Recent Matches'))
    const recentWrap = div('space-y-4')
    const tableWrap = div('w-full overflow-x-auto')
    const table = document.createElement('table')
    table.className = 'min-w-[640px] w-full text-left border-separate border-spacing-y-2'
    const thead = document.createElement('thead')
    const trh = document.createElement('tr');
    [i18n.t('stats_col_date'), i18n.t('stats_col_opponent'), i18n.t('stats_col_score'), i18n.t('stats_col_result')]
        .forEach(lbl => {
        const th = document.createElement('th')
        th.className = 'px-3 py-2 text-sm text-black/70 dark:text-white/70'
        th.textContent = lbl
        trh.appendChild(th)
    })
    thead.appendChild(trh)
    const tbody = document.createElement('tbody')
    table.append(thead, tbody)
    tableWrap.appendChild(table)
    const barHost = div('w-full')
    recentWrap.append(tableWrap, barHost)
    cardRecent.append(recentWrap)

    scroller.append(topGrid, chartsGrid, cardRecent)
    scroller.classList.add('pb-16')
    userContent.append(placeholderRows())
    metrics.append(placeholderMetric(), placeholderMetric(), placeholderMetric())

    let userId = 0
    try {
        userInfoByUsername(userName.trim())
            .then((data) => {
                const raw = (data as any)?.info
                const info = Array.isArray(raw) ? raw[0] : raw
                userId = Number(info?.id) || 0

                if (!userId) {
                    userContent.replaceChildren(
                        h('div', 'text-center text-red-500 font-medium mt-4', i18n.t('stats_user_not_found') || 'User not found')
                    )
                    return
                }

                void Promise.allSettled([
                    userInfoById(userId),
                    getDashboard(userId),
                    userTournament(userId)
                ]).then(results => {
                    const gi = settledValue<GamesInfo>(results[0])?.info as GamesInfo | undefined
                    const db = settledValue<Dashboard>(results[1])?.info as Dashboard | undefined
                    const rows = settledValue<TournamentRow[]>(results[2])?.info as TournamentRow[] | undefined

                    const isSelf = userName === getUsername()
                    const avatar = gi?.avatar && gi.avatar.trim() !== '' ? gi.avatar : (isSelf ? getAvatar() : profileIcon)

                    const avatarEl = createEditableAvatar(
                        avatar,
                        gi?.username || 'User',
                        isSelf,
                        async (file) => {
                            const base64 = await fileToBase64(file)
                            if (base64.length > 1_398_102) {
                                const overlay = createOverlayCard({
                                    title: i18n.t('error_file_too_large'),
                                    text: i18n.t('error_file_exceeded_limit', { size: byteSizeToHumanReadable(1_398_102) }),
                                })
                                document.body.appendChild(overlay.element)
                            } else {
                                changeUserAvatar(base64).then(() => {})
                                setAvatar(base64)
                                const img = avatarEl.querySelector('img') as HTMLImageElement | null
                                if (img) img.src = base64
                            }
                        }
                    )

                    if (!isSelf && gi) {
                        const isFollowing = Boolean(gi.follow)
                        const followBtn = createFollowButton(isFollowing, async (next) => {
                            await setFollow(Number(gi.id), next)
                            gi.follow = next
                        })
                        avatarEl.appendChild(followBtn)
                    }

                    userContent.replaceChildren(avatarEl)
                    userContent.append(
                        row(i18n.t('stats_label_username'), gi?.username ?? '-'),
                        row(i18n.t('stats_label_username'), fmtDateTime(gi?.created_at)),
                        row(i18n.t('stats_label_last_seen'), fmtDateTime(gi?.last_timestamp)),
                    )

                    const totalGames = (db?.games ?? gi?.total_games ?? 0) | 0
                    const wins = db?.wins ?? 0
                    const losses = db?.losses ?? 0
                    const winRate = clamp01(db?.winRate ?? (totalGames ? wins / totalGames : 0))

                    metrics.replaceChildren(
                        metricBubble(i18n.t('lb_col_games'), String(totalGames), 'bg-white/10 border-white/10'),
                        metricBubble(i18n.t('lb_col_wins'), String(wins), 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30'),
                        metricBubble(i18n.t('lb_col_loses'), String(losses), 'bg-rose-500/15 text-rose-400 border-rose-400/30'),
                        metricBubble(i18n.t('lb_col_winrate'), (winRate * 100).toFixed(1) + '%', 'bg-blue-500/10 text-blue-400 border-blue-400/30 col-span-2 sm:col-span-1')
                    )

                    renderPieWinRate(pieHost, { wins, losses })

                    const sorted = (rows ?? []).slice().sort(
                        (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
                    )

                    const dailyMap = new Map<string, number>()
                    sorted.forEach(r => {
                        const k = new Date(r.started_at).toLocaleDateString()
                        dailyMap.set(k, (dailyMap.get(k) ?? 0) + 1)
                    })
                    renderLineMatchesOverTime(lineHost, {
                        labels: Array.from(dailyMap.keys()),
                        values: Array.from(dailyMap.values())
                    })

                    const last = sorted.slice(-10)
                    renderBarScores(barHost, {
                        labels: last.map(r => shortDate(r.started_at)),
                        you: last.map(r => r.your_score),
                        opp: last.map(r => r.opp_score)
                    })

                    tbody.replaceChildren()
                    last.reverse().forEach(r => {
                        const tr = document.createElement('tr')
                        tr.className = 'bg-white/80 dark:bg-white/10 text-black dark:text-white rounded-xl overflow-hidden'
                        const date = td(shortDateTime(r.started_at), 'px-3 py-2 text-sm opacity-80')
                        const opp = td(r.opponent_username, 'px-3 py-2 font-medium')
                        const sc = td(`${r.your_score} - ${r.opp_score}`, 'px-3 py-2')
                        const res = td(r.did_win ? (i18n.t('win') || 'Win') : (i18n.t('loss') || 'Loss'),
                            'px-3 py-2 ' + (r.did_win ? 'text-emerald-500' : 'text-rose-500'))
                        tr.append(date, opp, sc, res)
                        tbody.appendChild(tr)
                    })
                })
            })
            .catch((e: any) => {
                if (e?.status === 404) {
                    console.error('Route /user/username returned 404')
                    userContent.replaceChildren(
                        h('div', 'text-center text-red-500 font-medium mt-4', i18n.t('stats_service_unavailable') || 'Service unavailable')
                    )
                    return
                }

                const msg = e?.message?.trim?.() || i18n.t('user_not_found')
                userContent.replaceChildren(
                    h('div', 'text-center text-red-500 font-medium mt-4', msg)
                )
            })
    } catch (err) {
        console.error('Error loading stats page:', err)
        userContent.replaceChildren(
            h('div', 'text-center text-red-500 font-medium mt-4', i18n.t('unknown_error') || 'Unknown error')
        )
    }

    return page
}

/** Create an editable avatar element (hover "Modifier", click to upload) */
function createEditableAvatar(
    url: string,
    altText: string,
    editable: boolean,
    onUpload: (file: File) => Promise<void>
): HTMLElement {
    const wrap = div('relative w-24 h-24 mx-auto mb-4')
    const img = document.createElement('img')
    img.src = url || profileIcon
    img.alt = altText
    img.className = 'w-24 h-24 rounded-full object-cover border border-white/20 block'
    wrap.appendChild(img)

    if (!editable) return wrap

    wrap.classList.add('group', 'cursor-pointer')
    const overlay = div(
        'absolute inset-0 rounded-full bg-black/40 text-white text-xs flex items-center justify-center opacity-0 ' +
        'transition-opacity group-hover:opacity-100 select-none'
    )
    overlay.textContent = i18n.t('edit') || 'Modifier'
    wrap.appendChild(overlay)

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.className = 'hidden'
    wrap.appendChild(input)

    wrap.addEventListener('click', () => input.click())
    input.addEventListener('change', async () => {
        const file = input.files?.[0]
        if (!file) return
        overlay.textContent = i18n.t('uploading') || 'Uploading...'
        try {
            await onUpload(file)
        } catch (e) {
            console.error(e)
            overlay.textContent = i18n.t('upload_failed') || 'Upload failed'
            setTimeout(() => { overlay.textContent = i18n.t('edit') || 'Modifier' }, 1500)
            return
        }
        overlay.textContent = i18n.t('edit') || 'Modifier'
    })

    return wrap
}

async function setFollow(userId: number, follow: boolean): Promise<void> {
    try {
        if (follow) {
            await addFriend(userId);
        } else {
            await deleteFirend(userId);
        }
    } catch (err) {
        console.error('Error following user:', err);
    }
    document.dispatchEvent(new CustomEvent('stats:follow-changed', { detail: { userId, follow } }))
}

function div(cls: string) {
    const d = document.createElement('div')
    d.className = cls
    return d
}

function h<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    cls: string,
    txt?: string
) {
    const n = document.createElement(tag)
    n.className = cls
    if (txt) n.textContent = txt
    return n
}

function sectionTitle(text: string) {
    return h(
        'h3',
        'text-lg font-semibold text-center text-gray-800 dark:text-white mb-2',
        text
    )
}

function card() {
    return div(
        'rounded-2xl border border-black/10 dark:border-white/10 ' +
        'bg-white/20 dark:bg-white/5 p-4 backdrop-blur'
    )
}

function row(label: string, value: string) {
    const wrap = div('flex items-center justify-between gap-4')

    const l = h(
        'span',
        'text-sm text-black/60 dark:text-white/70',
        label
    )

    const v = h(
        'span',
        'text-sm font-medium text-black dark:text-white',
        value || '-'
    )

    wrap.append(l, v)
    return wrap
}

function metricBubble(label: string, value: string, extraCls = '') {
    const box = div('rounded-xl border p-4 text-center ' + extraCls)

    const v = h('div', 'text-2xl font-bold', value)
    const l = h('div', 'text-xs mt-1 opacity-70', label)

    box.append(v, l)
    return box
}

function td(text: string, cls: string) {
    const cell = document.createElement('td')
    cell.className = cls
    cell.textContent = text
    return cell
}

function placeholderRows() {
    const s = div('space-y-2')
    for (let i = 0; i < 3; i++) {
        s.appendChild(div('h-5 rounded bg-white/40 dark:bg-white/10 animate-pulse'))
    }
    return s
}

function placeholderMetric() {
    return div('h-20 rounded-xl border border-white/10 bg-white/10 animate-pulse')
}

function fmtDateTime(v?: string | null) {
    if (!v) return '-'
    const d = new Date(v)
    if (isNaN(+d)) return '-'
    return d.toLocaleString()
}

function shortDate(v: string) {
    const d = new Date(v)
    if (isNaN(+d)) return '-'
    return d.toLocaleDateString()
}

function shortDateTime(v: string) {
    const d = new Date(v)
    if (isNaN(+d)) return '-'
    const date = d.toLocaleDateString()
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${date} ${time}`
}

function clamp01(x: number) {
    return Math.max(0, Math.min(1, x))
}

function settledValue<T>(p: PromiseSettledResult<any>): T | undefined {
    return p.status === 'fulfilled' ? (p.value as T) : undefined
}