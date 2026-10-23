'use client'

import { t } from '@/i18n'


// Prototype: explore how filtering appears in the 3D scene.
import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/client/store'
import { isClosedRepo } from '@/domain/hudStrip'
import type { Snapshot } from '@/types/domain'
import { type Dimension, type Facet, DIMENSIONS, DIMENSION_LABELS, allPrs, emptyFilter, facets, isActive, matches, toggle, valueLabel } from './filter'
import { useFilterStore } from './filterStore'
import { PrototypeSwitcher } from './PrototypeSwitcher'
import styles from './FilterHud.module.css'

function useResult(snapshot: Snapshot) {
  const filter = useFilterStore(state => state.filter)
  return useMemo(() => {
    const prs = allPrs(snapshot)
    const hits = prs.filter(pr => matches(pr, filter))
    const repos = new Set(hits.map(pr => pr.repo))
    return { total: prs.length, hits, repos: repos.size, active: isActive(filter) }
  }, [snapshot, filter])
}

function Clear() {
  const setFilter = useFilterStore(state => state.setFilter)
  return (
    <button type="button" className={styles.clear} onClick={() => setFilter(emptyFilter())}>
      {t('ui.clear')}
    </button>
  )
}

// A: chips under the HUD strip, a popover to add more, everyone else turns to ghosts.
function ChipBar({ snapshot }: { snapshot: Snapshot }) {
  const filter = useFilterStore(state => state.filter)
  const setFilter = useFilterStore(state => state.setFilter)
  const [open, setOpen] = useState(false)
  const [dimension, setDimension] = useState<Dimension>('author')
  const all = useMemo(() => facets(snapshot), [snapshot])
  const facet = all.find(candidate => candidate.dimension === dimension) as Facet
  const result = useResult(snapshot)
  const chips = DIMENSIONS.flatMap(key => filter[key].map(value => ({ key, value })))
  return (
    <div className={styles.chipBar} data-keep-panel>
      <span className={styles.chipLabel}>{t('ui.filter')}</span>
      {chips.map(chip => (
        <span key={`${chip.key}:${chip.value}`} className={styles.chip}>
          <small>{DIMENSION_LABELS[chip.key]}</small>
          {valueLabel(chip.key, chip.value)}
          <button type="button" aria-label={t('ui.remove')} onClick={() => setFilter(toggle(filter, chip.key, chip.value))}>×</button>
        </span>
      ))}
      <span className={styles.addWrap}>
        <button type="button" className={styles.add} aria-expanded={open} onClick={() => setOpen(!open)}>
          {t('ui.filterLabel')}
        </button>
        {open && (
          <div className={styles.popover}>
            <div className={styles.popTabs}>
              {DIMENSIONS.map(key => (
                <button key={key} type="button" aria-pressed={key === dimension} onClick={() => setDimension(key)}>
                  {DIMENSION_LABELS[key]}
                  {filter[key].length > 0 && <b>{filter[key].length}</b>}
                </button>
              ))}
            </div>
            <div className={styles.popValues}>
              {facet.values.map(value => (
                <label key={value.value} className={styles.option}>
                  <input type="checkbox" checked={filter[dimension].includes(value.value)} onChange={() => setFilter(toggle(filter, dimension, value.value))} />
                  <span>{value.label}</span>
                  <small>{value.count}</small>
                </label>
              ))}
              {facet.values.length === 0 && <span className={styles.empty}>{t('ui.nobodyHere')}</span>}
            </div>
          </div>
        )}
      </span>
      {result.active && (
        <>
          <span className={styles.result}>
            <strong>{result.hits.length}</strong> {t('ui.of')} {result.total} PRs
          </span>
          <Clear />
        </>
      )}
    </div>
  )
}

const FACET_PREVIEW = 6

function FacetGroup({ facet }: { facet: Facet }) {
  const filter = useFilterStore(state => state.filter)
  const setFilter = useFilterStore(state => state.setFilter)
  const [expanded, setExpanded] = useState(false)
  const max = Math.max(1, ...facet.values.map(value => value.count))
  const values = expanded ? facet.values : facet.values.slice(0, FACET_PREVIEW)
  return (
    <section className={styles.facet}>
      <h3>{facet.label}</h3>
      {values.map(value => {
        const checked = filter[facet.dimension].includes(value.value)
        return (
          <label key={value.value} className={styles.facetRow} data-checked={checked}>
            <input type="checkbox" checked={checked} onChange={() => setFilter(toggle(filter, facet.dimension, value.value))} />
            <span className={styles.facetName}>{value.label}</span>
            <span className={styles.bar} style={{ width: `${(value.count / max) * 48}px` }} />
            <small>{value.count}</small>
          </label>
        )
      })}
      {facet.values.length > FACET_PREVIEW && (
        <button type="button" className={styles.more} onClick={() => setExpanded(!expanded)}>
          {expanded ? t('ui.less') : t('ui.more', { count: facet.values.length - FACET_PREVIEW })}
        </button>
      )}
    </section>
  )
}

// B: a left-side faceted panel, always open; the hall rebuilds with only what matches.
function FacetPanel({ snapshot }: { snapshot: Snapshot }) {
  const all = useMemo(() => facets(snapshot), [snapshot])
  const result = useResult(snapshot)
  return (
    <aside className={styles.panel} data-keep-panel>
      <header className={styles.panelHead}>
        <span className={styles.chipLabel}>{t('ui.informationDesk')}</span>
        <p>
          {result.active ? (
            <>
              {t('ui.showing')} <strong>{result.hits.length}</strong> {t('ui.of')} {result.total} {t('ui.prsAcross')} {result.repos} {t('ui.counters')}
            </>
          ) : (
            <>{t('ui.all')} {result.total} {t('ui.prsSelectBelowToNarrowTheBureau')}</>
          )}
        </p>
        {result.active && <Clear />}
      </header>
      <div className={styles.panelBody}>
        {all.map(facet => (
          <FacetGroup key={facet.dimension} facet={facet} />
        ))}
      </div>
    </aside>
  )
}

const lastToken = (query: string) => query.split(/\s+/).pop() ?? ''

function suggestionsFor(query: string, all: Facet[]): { text: string; hint: string }[] {
  const token = lastToken(query)
  if (!token.includes(':')) return DIMENSIONS.filter(key => key.startsWith(token.toLowerCase())).map(key => ({ text: `${key}:`, hint: DIMENSION_LABELS[key] }))
  const [key, partial] = token.split(':')
  const facet = all.find(candidate => candidate.dimension === key)
  if (!facet) return []
  return facet.values
    .filter(value => value.value.toLowerCase().includes(partial.toLowerCase()))
    .slice(0, 8)
    .map(value => ({ text: `${key}:${value.value} `, hint: `${value.label} · ${value.count}` }))
}

// C: one search line (?q=), matching PRs walk to the front of their queue and you step through them.
function CommandBar({ snapshot }: { snapshot: Snapshot }) {
  const query = useFilterStore(state => state.query)
  const setQuery = useFilterStore(state => state.setQuery)
  const [focused, setFocused] = useState(false)
  const [cursor, setCursor] = useState(-1)
  const all = useMemo(() => facets(snapshot), [snapshot])
  const result = useResult(snapshot)
  const suggestions = focused ? suggestionsFor(query, all) : []

  const pick = (text: string) => {
    const head = query.slice(0, query.length - lastToken(query).length)
    setQuery(head + text)
  }
  const step = (delta: number) => {
    if (!result.hits.length) return
    const next = (cursor + delta + result.hits.length) % result.hits.length
    const pr = result.hits[next]
    const store = useAppStore.getState()
    if (!store.showClosed && isClosedRepo(snapshot, pr.repo)) store.setShowClosed(true)
    store.focus(pr.repo)
    store.select({ repo: pr.repo, number: pr.number })
    setCursor(next)
  }

  return (
    <div className={styles.command} data-keep-panel>
      <div className={styles.searchBox}>
        <span aria-hidden>⌕</span>
        <input
          value={query}
          placeholder={t('ui.autorSomeoneCiVermelhoIdadeMais60d')}
          spellCheck={false}
          onChange={event => {
            setQuery(event.target.value)
            setCursor(-1)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
        />
        {query && (
          <button type="button" className={styles.clear} onClick={() => setQuery('')}>
            {t('ui.clear')}
          </button>
        )}
      </div>
      {suggestions.length > 0 && (
        <ul className={styles.suggestions}>
          {suggestions.map(suggestion => (
            <li key={suggestion.text}>
              <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => pick(suggestion.text)}>
                <code>{suggestion.text}</code>
                <small>{suggestion.hint}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      {result.active && (
        <div className={styles.stepper}>
          <span>
            <strong>{result.hits.length}</strong> {t('ui.of')} {result.total} {t('ui.prsMovedToTheFrontOfTheQueue')}
          </span>
          <button type="button" onClick={() => step(-1)} disabled={!result.hits.length}>
            {t('ui.previous')}
          </button>
          <span className={styles.position}>{cursor >= 0 ? `${cursor + 1}/${result.hits.length}` : '–'}</span>
          <button type="button" onClick={() => step(1)} disabled={!result.hits.length}>
            {t('ui.next')}
          </button>
        </div>
      )}
    </div>
  )
}

export function FilterHud({ snapshot }: { snapshot: Snapshot }) {
  const variant = useFilterStore(state => state.variant)
  const load = useFilterStore(state => state.load)
  useEffect(load, [load])
  return (
    <>
      {variant === 'A' && <ChipBar snapshot={snapshot} />}
      {variant === 'B' && <FacetPanel snapshot={snapshot} />}
      {variant === 'C' && <CommandBar snapshot={snapshot} />}
      <PrototypeSwitcher />
    </>
  )
}
