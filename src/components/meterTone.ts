export type MeterTone = 'ok' | 'near' | 'over'

/** Over capacity, within 2 of it, or comfortable. */
export function meterTone(value: number, capacity: number): MeterTone {
  if (value > capacity) return 'over'
  if (value >= capacity - 2) return 'near'
  return 'ok'
}
