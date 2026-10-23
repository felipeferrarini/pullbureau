import type { SceneEvent } from '@/types/domain'
import type { Plan } from '@/types/scene'

export const ALARM_MS = 5000

export function planFireAlarm(at: string): Plan {
  return {
    id: `egg:fire-alarm:${at}`,
    repo: null,
    duration: ALARM_MS,
    overrides: [],
    spawns: [],
    effects: [
      { kind: 'alarm', at: 0, duration: ALARM_MS },
      { kind: 'sound', sound: 'alarm', at: 0, duration: 0 },
    ],
  }
}

// A merge on Friday after 16h sets off the fire alarm.
export const alarmFor = (event: SceneEvent, noDeploy: boolean): Plan | null => (noDeploy && event.kind === 'merged' ? planFireAlarm(event.at) : null)
