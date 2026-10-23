import { type CursorStore, createLocalCursorStore } from './cursorStore'

export const SHOW_CLOSED_KEY = 'pullbureau:showClosedCounters'

export const readShowClosed = (store: CursorStore) => store.read() === '1'

export const writeShowClosed = (store: CursorStore, show: boolean) => store.write(show ? '1' : '0')

export const closedPreferenceStore = () => createLocalCursorStore(undefined, SHOW_CLOSED_KEY)
