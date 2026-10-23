import { t } from '@/i18n'
// Prototype: explore how filtering appears in the 3D scene.
import { create } from 'zustand'
import { type Filter, emptyFilter, fromParams, fromQuery, toQuery, writeParams } from './filter'

export type Variant = 'A' | 'B' | 'C'
export const VARIANTS: Variant[] = ['A', 'B', 'C']
export const VARIANT_NAMES: Record<Variant, string> = {
  A: t('ui.fadeUnmatchedPrsBecomeGhosts'),
  B: t('ui.hideOnlyMatchingPrsRemain'),
  C: t('ui.regroupMatchingPrsMoveForward'),
}

type FilterState = {
  variant: Variant
  filter: Filter
  query: string
  load: () => void
  setVariant: (variant: Variant) => void
  setFilter: (filter: Filter) => void
  setQuery: (query: string) => void
}

function syncUrl(variant: Variant, filter: Filter, query: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('variant', variant)
  writeParams(url.searchParams, variant === 'C' ? emptyFilter() : filter)
  if (variant === 'C' && query.trim()) url.searchParams.set('q', query.trim())
  else url.searchParams.delete('q')
  window.history.replaceState(null, '', url)
}

const parseVariant = (raw: string | null): Variant => (VARIANTS.includes(raw as Variant) ? (raw as Variant) : 'A')

export const useFilterStore = create<FilterState>((set, get) => ({
  variant: 'A',
  filter: emptyFilter(),
  query: '',
  load: () => {
    const params = new URLSearchParams(window.location.search)
    const variant = parseVariant(params.get('variant'))
    const query = params.get('q') ?? ''
    set({ variant, query, filter: variant === 'C' ? fromQuery(query) : fromParams(params) })
  },
  // The filter carries over between variants so they can be compared on the same selection.
  setVariant: variant => {
    const { filter } = get()
    const query = variant === 'C' ? toQuery(filter) : get().query
    set({ variant, query })
    syncUrl(variant, filter, query)
  },
  setFilter: filter => {
    const query = toQuery(filter)
    set({ filter, query })
    syncUrl(get().variant, filter, query)
  },
  setQuery: query => {
    const filter = fromQuery(query)
    set({ query, filter })
    syncUrl(get().variant, filter, query)
  },
}))
