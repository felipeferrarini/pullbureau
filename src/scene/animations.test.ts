import { describe, expect, it } from 'vitest'
import type { LogicalAnim } from '@/types/scene'
import { clipLead, playsOnce, resolveClip } from './animations'

// Real clip names of the pack (checked on 15/10/2026); the armature prefix may or may not be there.
const quaternius = ['Death', 'Defeat', 'Idle', 'Jump', 'PickUp', 'Punch', 'RecieveHit', 'Roll', 'Run', 'Run_Carry', 'Shoot_OneHanded', 'SitDown', 'StandUp', 'SwordSlash', 'Victory', 'Walk', 'Walk_Carry'].map(name => `CharacterArmature|${name}`)

describe('resolveClip', () => {
  it('matches the name after the armature prefix', () => {
    expect(resolveClip(quaternius, 'idle')).toBe('CharacterArmature|Idle')
    expect(resolveClip(quaternius, 'hit')).toBe('CharacterArmature|RecieveHit')
    expect(resolveClip(quaternius, 'sit')).toBe('CharacterArmature|SitDown')
  })

  it('prefers the plain walk over carry variants', () => {
    expect(resolveClip(quaternius, 'walk')).toBe('CharacterArmature|Walk')
  })

  it('maps the moves the pack lacks to the closest clip it has', () => {
    expect(resolveClip(quaternius, 'wave')).toBe('CharacterArmature|Jump')
    expect(resolveClip(quaternius, 'yes')).toBe('CharacterArmature|Victory')
    expect(resolveClip(quaternius, 'no')).toBe('CharacterArmature|Defeat')
    expect(resolveClip(quaternius, 'interact')).toBe('CharacterArmature|PickUp')
  })

  it('does not confuse "no" with names that merely contain the letters', () => {
    expect(resolveClip(['Idle', 'Nod', 'No'], 'no')).toBe('No')
  })

  it('falls back to idle, then to the first clip', () => {
    expect(resolveClip(['CharacterArmature|Idle', 'CharacterArmature|Walk'], 'roll')).toBe('CharacterArmature|Idle')
    expect(resolveClip(['Dance'], 'roll')).toBe('Dance')
    expect(resolveClip([], 'idle')).toBeNull()
  })
})

describe('playsOnce', () => {
  it('holds the end pose of sitting down, dying and the counter gesture', () => {
    expect(['sit', 'death', 'interact'].every(anim => playsOnce(anim as LogicalAnim))).toBe(true)
  })

  it('keeps looping the moves that repeat', () => {
    const loops: LogicalAnim[] = ['idle', 'walk', 'run', 'roll', 'jump', 'wave', 'yes', 'no', 'victory', 'punch', 'hit']
    expect(loops.some(playsOnce)).toBe(false)
  })
})

describe('clipLead', () => {
  it('plays the whole sit-down when someone changes into it', () => {
    expect(clipLead('sit', 'walk', 0.7)).toBe(0)
    expect(clipLead('sit', 'idle', 0.7)).toBe(0)
  })

  it('shows people who were already seated as seated', () => {
    expect(clipLead('sit', null, 0.7)).toBe(1)
    expect(clipLead('sit', 'sit', 0.7)).toBe(1)
  })

  it('desyncs the loops and starts strikes on the first frame', () => {
    expect(clipLead('idle', null, 0.7)).toBe(0.7)
    expect(clipLead('walk', 'sit', 0.3)).toBe(0.3)
    expect(clipLead('punch', 'idle', 0.7)).toBe(0)
    expect(clipLead('death', 'hit', 0.7)).toBe(0)
  })
})
