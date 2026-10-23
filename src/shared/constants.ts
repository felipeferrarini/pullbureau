export const GHOST_LOGIN = 'ghost'
export const TIME_ZONE = process.env.TIME_ZONE || 'UTC'
export const READY_LABEL = process.env.READY_LABEL || 'ready-for-review'

const hour = (value: string | undefined, fallback: number) => {
  const parsed = value === undefined ? fallback : Number(value)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 24) throw new Error('Business hours must be integers between 0 and 24')
  return parsed
}
export const BUSINESS_START_HOUR = hour(process.env.BUSINESS_START_HOUR, 9)
export const BUSINESS_END_HOUR = hour(process.env.BUSINESS_END_HOUR, 18)
if (BUSINESS_END_HOUR <= BUSINESS_START_HOUR) throw new Error('BUSINESS_END_HOUR must be after BUSINESS_START_HOUR')
new Intl.DateTimeFormat('en', { timeZone: TIME_ZONE })
