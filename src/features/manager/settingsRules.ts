import type { Settings } from '@/session/types'

export type SteppableSetting =
  | 'highThreshold'
  | 'mediumThreshold'
  | 'defaultCapacity'
  | 'contactWindowHours'

const BOUNDS: Record<SteppableSetting, readonly [number, number]> = {
  highThreshold: [50, 95],
  mediumThreshold: [10, 70],
  defaultCapacity: [5, 40],
  contactWindowHours: [12, 120],
}

const STEP: Record<SteppableSetting, number> = {
  highThreshold: 1,
  mediumThreshold: 1,
  defaultCapacity: 1,
  contactWindowHours: 6,
}

/** Thresholds must stay this far apart so the medium band never collapses. */
const THRESHOLD_GAP = 5

/**
 * The domain rules for stepping a setting. These lived only in the legacy
 * page's click handler, which meant `updateSettings` would happily accept a
 * high threshold below the medium one. Keeping them here lets the UI disable
 * the control AND lets the value be validated in one place.
 *
 * Returns the next valid value, or null if the step isn't allowed.
 */
export function stepSetting(
  settings: Settings,
  key: SteppableSetting,
  direction: -1 | 1,
): number | null {
  const next = settings[key] + direction * STEP[key]
  const [min, max] = BOUNDS[key]
  if (next < min || next > max) return null

  if (key === 'highThreshold' && next <= settings.mediumThreshold + THRESHOLD_GAP) return null
  if (key === 'mediumThreshold' && next >= settings.highThreshold - THRESHOLD_GAP) return null

  return next
}

export function canStep(settings: Settings, key: SteppableSetting, direction: -1 | 1): boolean {
  return stepSetting(settings, key, direction) !== null
}
