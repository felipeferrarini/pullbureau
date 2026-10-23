import { t } from '@/i18n'
// Prototype: explore how filtering appears in the 3D scene.
import type { CiState, QueuedPr, Snapshot } from '@/types/domain'

export type Dimension = 'author' | 'reviewer' | 'repo' | 'age' | 'ci' | 'status'
export type Filter = Record<Dimension, string[]>
export type FacetValue = { value: string; label: string; count: number }
export type Facet = { dimension: Dimension; label: string; values: FacetValue[] }

export const DIMENSIONS: Dimension[] = ['author', 'reviewer', 'repo', 'age', 'ci', 'status']
export const DIMENSION_LABELS: Record<Dimension, string> = { author: t('ui.author'), reviewer: t('ui.reviewer'), repo: t('ui.counter'), age: t('ui.age'), ci: 'CI', status: t('ui.status') }

const AGE_BUCKETS = [
  { value: 'up-to-3d', label: t('ui.upTo3DaysStanding'), max: 3 },
  { value: '3-14d', label: t('ui.3To14DaysSeated'), max: 14 },
  { value: '14-60d', label: t('ui.14To60DaysSleeping'), max: 60 },
  { value: 'over-60d', label: t('ui.over60DaysSkeleton'), max: Infinity },
]
const CI_VALUES: Record<CiState, string> = { success: 'green', failure: 'red', pending: 'running', none: 'no-ci' }
const CI_LABELS: Record<string, string> = { green: t('ui.green'), red: t('ui.red'), running: t('ui.running'), 'no-ci': t('ui.noCi') }
const STATUS_LABELS: Record<string, string> = { 'unreviewed': t('ui.unreviewedLabel'), reviewed: t('ui.reviewed'), draft: t('ui.draft') }

export const emptyFilter = (): Filter => ({ author: [], reviewer: [], repo: [], age: [], ci: [], status: [] })
export const isActive = (filter: Filter) => DIMENSIONS.some(dimension => filter[dimension].length > 0)

const ageBucket = (pr: QueuedPr) => AGE_BUCKETS.find(bucket => pr.ageDays < bucket.max)?.value ?? 'over-60d'
const status = (pr: QueuedPr) => (pr.isDraft ? 'draft' : pr.reviewedBy.length ? 'reviewed' : 'unreviewed')

function valuesOf(pr: QueuedPr, dimension: Dimension): string[] {
  if (dimension === 'author') return [pr.author]
  if (dimension === 'reviewer') return pr.reviewedBy
  if (dimension === 'repo') return [pr.repo]
  if (dimension === 'age') return [ageBucket(pr)]
  if (dimension === 'ci') return [CI_VALUES[pr.ci]]
  return [status(pr)]
}

export function valueLabel(dimension: Dimension, value: string): string {
  if (dimension === 'age') return AGE_BUCKETS.find(bucket => bucket.value === value)?.label ?? value
  if (dimension === 'ci') return CI_LABELS[value] ?? value
  if (dimension === 'status') return STATUS_LABELS[value] ?? value
  return value
}

// OR inside a dimension, AND across dimensions.
export function matches(pr: QueuedPr, filter: Filter): boolean {
  return DIMENSIONS.every(dimension => !filter[dimension].length || valuesOf(pr, dimension).some(value => filter[dimension].includes(value)))
}

export const allPrs = (snapshot: Snapshot): QueuedPr[] => [...snapshot.counters.flatMap(counter => counter.queue), ...snapshot.waitingRoom]

export function facets(snapshot: Snapshot): Facet[] {
  const prs = allPrs(snapshot)
  return DIMENSIONS.map(dimension => {
    const counts = new Map<string, number>()
    for (const pr of prs) for (const value of valuesOf(pr, dimension)) counts.set(value, (counts.get(value) ?? 0) + 1)
    const fixed = dimension === 'age' ? AGE_BUCKETS.map(bucket => bucket.value) : null
    const keys = fixed ?? [...counts.keys()].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b))
    return { dimension, label: DIMENSION_LABELS[dimension], values: keys.map(value => ({ value, label: valueLabel(dimension, value), count: counts.get(value) ?? 0 })) }
  })
}

export const toggle = (filter: Filter, dimension: Dimension, value: string): Filter => ({
  ...filter,
  [dimension]: filter[dimension].includes(value) ? filter[dimension].filter(other => other !== value) : [...filter[dimension], value],
})

// URL shape 1 (variants A and B): one repeatable param per dimension, ?author=x&ci=red.
export function fromParams(params: URLSearchParams): Filter {
  const filter = emptyFilter()
  for (const dimension of DIMENSIONS) filter[dimension] = params.getAll(dimension)
  return filter
}

export function writeParams(params: URLSearchParams, filter: Filter) {
  for (const dimension of DIMENSIONS) {
    params.delete(dimension)
    for (const value of filter[dimension]) params.append(dimension, value)
  }
}

// URL shape 2 (variant C): one search string, ?q=author:x ci:red.
export function fromQuery(query: string): Filter {
  const filter = emptyFilter()
  for (const token of query.trim().split(/\s+/)) {
    const [key, ...rest] = token.split(':')
    const value = rest.join(':')
    if (value && DIMENSIONS.includes(key as Dimension)) filter[key as Dimension].push(value)
  }
  return filter
}

export const toQuery = (filter: Filter) => DIMENSIONS.flatMap(dimension => filter[dimension].map(value => `${dimension}:${value}`)).join(' ')
