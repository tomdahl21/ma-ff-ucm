import { daysSince, tierFor } from '@/data/invariants'
import { COORDINATORS } from '@/data/patients'
import type {
  Caseload,
  CoordinatorId,
  Message,
  Mrn,
  Patient,
  RiskTier,
  SessionState,
  Settings,
} from './types'

/* Pure, state-in / value-out. Kept out of the store so nothing has to be
   recomputed on write, and out of components so it can be unit-tested. */

export const selectSettings = (s: SessionState): Settings => s.settings

export const selectPatients = (s: SessionState): readonly Patient[] => s.patients

export const patientTier = (p: Patient, settings: Settings): RiskTier =>
  tierFor(p.score, settings)

export const patientDays = (p: Patient): number => daysSince(p.hoursSince)

export const selectUnassigned = (s: SessionState): readonly Patient[] =>
  s.patients.filter((p) => p.assignedTo === null)

export const selectAssignedTo =
  (coordId: CoordinatorId) =>
  (s: SessionState): readonly Patient[] =>
    s.patients.filter((p) => p.assignedTo === coordId)

export const selectPatient =
  (mrn: Mrn | null) =>
  (s: SessionState): Patient | null =>
    mrn === null ? null : (s.patients.find((p) => p.mrn === mrn) ?? null)

export const selectInbox =
  (coordId: CoordinatorId) =>
  (s: SessionState): readonly Message[] =>
    s.messages.filter((m) => m.to === coordId).sort((a, b) => b.ts - a.ts)

/** A scalar on purpose — the bell is the most frequently updated widget. */
export const selectUnreadCount =
  (coordId: CoordinatorId) =>
  (s: SessionState): number =>
    s.messages.reduce((n, m) => (m.to === coordId && !m.read ? n + 1 : n), 0)

/**
 * Per-coordinator rollup. `contactRate`'s denominator is only patients already
 * past the contact window, so a just-discharged patient does not count against
 * the coordinator; null when nobody is eligible yet.
 */
export function selectCaseloads(s: SessionState): readonly Caseload[] {
  const { settings } = s
  return COORDINATORS.map((coord) => {
    const mine = s.patients.filter((p) => p.assignedTo === coord.id)
    const eligible = mine.filter((p) => p.hoursSince >= settings.contactWindowHours)
    const reached = eligible.filter((p) => p.contacted).length
    return {
      coord,
      total: mine.length,
      high: mine.filter((p) => patientTier(p, settings) === 'high').length,
      uncontacted: mine.filter((p) => !p.contacted).length,
      withinWindow: mine.filter((p) => p.contacted && p.hoursSince <= settings.contactWindowHours)
        .length,
      contactRate: eligible.length ? Math.round((reached / eligible.length) * 100) : null,
      capacity: settings.defaultCapacity,
      overBy: Math.max(0, mine.length - settings.defaultCapacity),
      patients: mine,
    }
  })
}

/** Lowest current load, excluding anyone on leave. */
export function selectSuggestedCoordinator(s: SessionState): CoordinatorId {
  const available = selectCaseloads(s).filter((c) => !c.coord.away)
  if (!available.length) return 'sarah'
  return available.reduce((best, c) => (c.total < best.total ? c : best)).coord.id
}

export function shallowArrayEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/** Relative timestamps, matching the legacy layer's wording exactly. */
export function relTime(ts: number, nowMs: number = Date.now()): string {
  const s = Math.floor((nowMs - ts) / 1000)
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
