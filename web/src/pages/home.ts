import i18n from '../utils/lang/i18n'
import { renderPongMenu } from './pongMenu'
import { refreshToken } from '../api/jwt'
import {
  getDashboardWin,
  getDashboardLose,
  getDashboardTWon,
  getDashboardwinRate,
  getDashboardTime,
  getDashboardCreat,
} from '../api/methode'
import {navigateTo} from "../utils/router";

export type SortKey = 'rank' | 'username' | 'wins' | 'losses' | 'tWon' | 'winRate' | 'time' | 'create'

export interface LeaderEntry {
  username: string
  wins: number
  losses: number
  tWon: number
  winRate: number
  time: number
  create: number
}

function renderSkeletonRows(tbody: HTMLElement, rows = 8, cols = 8) {
  tbody.replaceChildren()
  for (let i = 0; i < rows; i++) {
    const tr = document.createElement('tr')
    tr.className = 'animate-pulse bg-white/60 dark:bg-white/10 rounded-xl'
    const td = document.createElement('td')
    td.colSpan = cols
    td.className = 'px-3 py-4'
    td.innerHTML = `
      <div class="h-4 w-1/3 mb-2 bg-black/10 dark:bg-white/10 rounded"></div>
      <div class="h-4 w-1/2 bg-black/10 dark:bg-white/10 rounded"></div>
    `
    tr.append(td)
    tbody.append(tr)
  }
}

function renderEmptyRow(tbody: HTMLElement, cols: number, text: string) {
  tbody.replaceChildren()
  const tr = document.createElement('tr')
  tr.className = 'bg-white/60 dark:bg-white/10 rounded-xl'
  const td = document.createElement('td')
  td.colSpan = cols
  td.className = 'px-3 py-6 text-center text-sm opacity-70'
  td.textContent = text
  tr.append(td)
  tbody.append(tr)
}

function renderErrorBanner(container: HTMLElement, onRetry: () => void, message?: string) {
  container.replaceChildren()
  const div = document.createElement('div')
  div.className = 'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
  const span = document.createElement('span')
  span.className = 'text-sm'
  span.textContent = message ?? (i18n.t('error_generic') || 'Error. Please retry.')
  const btn = document.createElement('button')
  btn.className = 'px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-sm'
  btn.textContent = i18n.t('retry') || 'Retry'
  btn.onclick = onRetry
  div.append(span, btn)
  container.append(div)
}

type StatKey = Exclude<SortKey, 'rank' | 'username'>
const ALLOWED_STAT_KEYS: StatKey[] = ['wins', 'losses', 'tWon', 'winRate', 'time', 'create']

const fetchers: Partial<Record<StatKey, () => Promise<LeaderEntry[]>>> = {
  wins: async () => {
    const res = await getDashboardWin()
    if (res.error) throw new Error(res.code)
    const raw = typeof (res as any).info === 'string' ? JSON.parse((res as any).info) : (res as any).info
    return raw as LeaderEntry[]
  },
  losses: async () => {
    const res = await getDashboardLose()
    if (res.error) throw new Error(res.code)
    const raw = typeof (res as any).info === 'string' ? JSON.parse((res as any).info) : (res as any).info
    return raw as LeaderEntry[]
  },
  tWon: async () => {
    const res = await getDashboardTWon()
    if (res.error) throw new Error(res.code)
    const raw = typeof (res as any).info === 'string' ? JSON.parse((res as any).info) : (res as any).info
    return raw as LeaderEntry[]
  },
  winRate: async () => {
    const res = await getDashboardwinRate()
    if (res.error) throw new Error(res.code)
    const raw = typeof (res as any).info === 'string' ? JSON.parse((res as any).info) : (res as any).info
    return raw as LeaderEntry[]
  },
  time: async () => {
    const res = await getDashboardTime()
    if (res.error) throw new Error(res.code)
    const raw = typeof (res as any).info === 'string' ? JSON.parse((res as any).info) : (res as any).info
    return raw as LeaderEntry[]
  },
  create: async () => {
    const res = await getDashboardCreat()
    if (res.error) throw new Error(res.code)
    const raw = typeof (res as any).info === 'string' ? JSON.parse((res as any).info) : (res as any).info
    return raw as LeaderEntry[]
  },
}

function renderLeaderboard(): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'flex flex-col gap-3'

  const title = document.createElement('h2')
  title.className = 'text-2xl font-semibold text-center'
  title.textContent = i18n.t('leaderboard_title')

  const alertZone = document.createElement('div')

  const tableScroll = document.createElement('div')
  tableScroll.className = 'w-full overflow-x-auto'

  const table = document.createElement('table')
  table.className = 'min-w-[980px] w-full text-left border-separate border-spacing-y-2'

  const thead = document.createElement('thead')
  const tbody = document.createElement('tbody')

  const headers: { key: SortKey; label: string }[] = [
    { key: 'rank',     label: i18n.t('lb_col_rank') },
    { key: 'username', label: i18n.t('lb_col_user') },
    { key: 'wins',     label: i18n.t('lb_col_wins') },
    { key: 'losses',   label: i18n.t('lb_col_loses') },
    { key: 'tWon',     label: i18n.t('lb_col_tWon') },
    { key: 'winRate',  label: i18n.t('lb_col_winrate') },
    { key: 'time',     label: i18n.t('lb_col_time') },
    { key: 'create',   label: i18n.t('lb_col_create') },
  ]

  const headRow = document.createElement('tr')
  headers.forEach(({ key, label }) => {
    const th = document.createElement('th')

    const sortable = ALLOWED_STAT_KEYS.includes(key as StatKey)
    th.className = [
      'px-3 py-2 text-sm select-none',
      sortable ? 'text-black/70 dark:text-white/70 cursor-pointer' : 'text-black/40 dark:text-white/40 cursor-default'
    ].join(' ')

    ;(th as any).dataset.key = key
    th.textContent = label
    th.tabIndex = sortable ? 0 : -1
    th.setAttribute('role', sortable ? 'button' : 'columnheader')
    if (!sortable) th.setAttribute('aria-disabled', 'true')

    if (sortable) {
      th.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') th.click() })
    }

    headRow.appendChild(th)
  })
  thead.appendChild(headRow)

  renderEmptyRow(tbody, headers.length, i18n.t('not_available_yet'))

  table.append(thead, tbody)
  tableScroll.appendChild(table)
  wrapper.append(title, alertZone, tableScroll)

  let currentKey: SortKey = 'wins'

  const updateHeaderIndicators = () => {
    Array.from(headRow.children).forEach((th: any) => {
      const key = th.dataset.key as SortKey
      const base = headers.find(h => h.key === key)!.label
      const isActive = key === currentKey && ALLOWED_STAT_KEYS.includes(key as StatKey)
      th.textContent = isActive ? `${base} ▼` : base
      th.classList.toggle('text-white', isActive)
      th.setAttribute('aria-sort', isActive ? 'other' : 'none')
    })
  }

  const rowsFrom = (entries: LeaderEntry[]) => {
    const frag = document.createDocumentFragment()
    entries.forEach((d, idx) => {
      const tr = document.createElement('tr')
      tr.className = 'bg-white/80 dark:bg-white/10 text-black dark:text-white rounded-xl overflow-hidden'

      const rank = document.createElement('td'); rank.className = 'px-3 py-2 text-sm opacity-60'; rank.textContent = String(idx + 1)
      const user = document.createElement('td');
      user.className = 'px-3 py-2 font-medium text-blue-500 cursor-pointer hover:underline';
      user.textContent = d.username;
      user.addEventListener('click', () => navigateTo(`/stats/${d.username}`));
      const wins = document.createElement('td'); wins.className = 'px-3 py-2'; wins.textContent = String(d.wins)
      const losses = document.createElement('td'); losses.className = 'px-3 py-2'; losses.textContent = String(d.losses)
      const tWon = document.createElement('td'); tWon.className = 'px-3 py-2'; tWon.textContent = String(d.tWon)
      const wr = document.createElement('td'); wr.className = 'px-3 py-2'; wr.textContent = `${(d.winRate * 100).toFixed(1)}%`
      const time = document.createElement('td'); time.className = 'px-3 py-2'; time.textContent = `${(d.time).toFixed(0)}s`
      const create = document.createElement('td'); create.className = 'px-3 py-2'; create.textContent = String(d.create)

      tr.append(rank, user, wins, losses, tWon, wr, time, create)
      frag.append(tr)
    })
    return frag
  }

  async function load() {
    alertZone.replaceChildren()
    renderSkeletonRows(tbody, 8, headers.length)

    try {
      if (!ALLOWED_STAT_KEYS.includes(currentKey as StatKey)) {
        currentKey = 'wins'
      }

      const fn = fetchers[currentKey as StatKey]
      if (!fn) {
        renderEmptyRow(tbody, headers.length, i18n.t('not_available_yet'))
        return
      }

      const data = await fn()

      if (!data || data.length === 0) {
        renderEmptyRow(tbody, headers.length,i18n.t('not_available_yet'))
      } else {
        tbody.replaceChildren(rowsFrom(data))
      }
    } catch (_e) {
      renderEmptyRow(tbody, headers.length, i18n.t('not_available_yet'))
    } finally {
      updateHeaderIndicators()
    }
  }

  Array.from(headRow.children).forEach((th: any) => {
    th.addEventListener('click', () => {
      const key = th.dataset.key as SortKey
      if (!ALLOWED_STAT_KEYS.includes(key as StatKey)) return
      if (key === currentKey) return
      currentKey = key
      void load()
    })
  })

  void load()

  return wrapper
}

export function renderHome(): HTMLElement {
    refreshToken().catch(() => {})

    const page = document.createElement('div')
    page.className = 'w-full min-h-screen px-4 py-6'
    document.documentElement.classList.add('h-full')
    document.body.classList.add('min-h-screen', 'overflow-y-auto')

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