import { LOCALE } from '@/i18n'
import { TIME_ZONE } from '@/shared/constants'
import type { Board, BoardEntry, HistoryPr, NoticeCard } from '@/types/domain'
import { rankLogins, reviewCounts } from './reviews'
import { DAY_MS, MONTH_MS, WEEK_MS } from './time'

// The cork board ranks the same window as the employee of the month; the slacking post-it stays weekly.
export const RANKING_DAYS = MONTH_MS / DAY_MS

function rank(roster: string[], counts: Map<string, number>): BoardEntry[] {
  return roster
    .map(login => ({ login, reviews: counts.get(login) ?? 0 }))
    .sort((a, b) => b.reviews - a.reviews || a.login.localeCompare(b.login))
}

export function buildBoard(history: HistoryPr[], members: string[], excluded: string[], now: Date): Board {
  const excludedSet = new Set(excluded.map(login => login.toLowerCase()))
  const roster = members.filter(login => !excludedSet.has(login.toLowerCase()))
  const month = reviewCounts(history, now, MONTH_MS)
  const week = reviewCounts(history, now, WEEK_MS)
  return {
    ranking: rank(roster, month),
    employeeOfTheMonth: rankLogins(month).find(login => roster.includes(login)) ?? null,
    slacking: rank(roster, week).filter(entry => entry.reviews === 0).map(entry => entry.login),
  }
}

const MAX_NOTICE_CARDS = 8
const monthFormat = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: TIME_ZONE })

export function monthTitle(iso: string): string {
  const parts = monthFormat.formatToParts(new Date(iso))
  const month = parts.find(part => part.type === 'month')?.value ?? ''
  const year = parts.find(part => part.type === 'year')?.value ?? ''
  return `${month.toUpperCase()}/${year}`
}

export function noticeCards(board: Board, max = MAX_NOTICE_CARDS): NoticeCard[] {
  const ranked = board.ranking.filter(entry => entry.reviews > 0).slice(0, max)
  return ranked.map(entry => ({ rank: ranked.findIndex(other => other.reviews === entry.reviews) + 1, ...entry }))
}
