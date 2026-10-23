import { BUSINESS_END_HOUR, BUSINESS_START_HOUR, TIME_ZONE } from '@/shared/constants'
import { LOCALE, t } from './index'

// Business-hour settings are wall-clock hours in the deployment time zone.
const hourFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' })
const wallTime = (hour: number, minute = 0) => hourFormat.format(new Date(Date.UTC(2000, 0, 1, hour, minute)))

export const BUSINESS_HOURS_LABEL = t('ui.businessHoursRange', {
  start: wallTime(BUSINESS_START_HOUR),
  end: wallTime(BUSINESS_END_HOUR),
})
export const BUSINESS_DAY_HOURS = BUSINESS_END_HOUR - BUSINESS_START_HOUR
export const BEFORE_OPENING_LABEL = wallTime(BUSINESS_START_HOUR, -1)
export const DEPLOYMENT_TIME_ZONE = TIME_ZONE
