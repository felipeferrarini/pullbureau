import { LOCALE } from '@/i18n'
import { TIME_ZONE } from './constants'

const dateFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric' })

export const formatDate = (iso: string) => dateFormat.format(new Date(iso))
