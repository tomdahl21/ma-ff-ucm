import { useMemo, useState } from 'react'
import { DETAIL_BY_MRN } from '@/data/patientDetail'
import type { PatientDetail } from '@/data/types'
import { daysSince, tierFor } from '@/data/invariants'
import { useAssignedTo, useSettings } from '@/session/react'
import type { CoordinatorId, Mrn, Patient, RiskTier } from '@/session/types'

/**
 * One row, consumed by both the triage table and the detail rail.
 *
 * The table never sees a raw Patient and the rail never re-derives, so the
 * two cannot disagree about the same person — which is exactly what went
 * wrong when the coordinator page and the manager roster each kept their own
 * copy of these nine patients.
 */
export interface CaseloadRow {
  patient: Patient
  /** Derived from score + live thresholds. Never stored on the patient. */
  tier: RiskTier
  days: number
  /** Authored narrative, where it exists. Undefined for most patients. */
  detail: PatientDetail | undefined
  /** Arrived during this session — drives the arrival highlight. */
  isNew: boolean
}

export interface Caseload {
  rows: readonly CaseloadRow[]
  byMrn: ReadonlyMap<Mrn, CaseloadRow>
  total: number
  counts: {
    high: number
    medium: number
    low: number
    uncontacted: number
    unacknowledged: number
  }
}

export function useCaseload(me: CoordinatorId): Caseload {
  const mine = useAssignedTo(me)
  const settings = useSettings()

  /**
   * "Arrived since this view opened" is derived from the assignment timestamp
   * rather than tracked in a mutable set. A set mutated during render gets
   * double-applied by StrictMode's second pass, which silently swallows the
   * arrival highlight; a timestamp comparison is idempotent.
   */
  const [openedAt] = useState(() => Date.now())

  return useMemo(() => {
    const rows: CaseloadRow[] = [...mine]
      .sort((a, b) => b.score - a.score)
      .map((patient) => ({
        patient,
        tier: tierFor(patient.score, settings),
        days: daysSince(patient.hoursSince),
        detail: DETAIL_BY_MRN.get(patient.mrn),
        isNew: patient.assignedAt != null && patient.assignedAt > openedAt,
      }))

    return {
      rows,
      byMrn: new Map(rows.map((r) => [r.patient.mrn, r])),
      total: rows.length,
      counts: {
        high: rows.filter((r) => r.tier === 'high').length,
        medium: rows.filter((r) => r.tier === 'medium').length,
        low: rows.filter((r) => r.tier === 'low').length,
        uncontacted: rows.filter((r) => !r.patient.contacted).length,
        unacknowledged: rows.filter(
          (r) => r.patient.assignedAt != null && r.patient.acknowledged === false,
        ).length,
      },
    }
  }, [mine, settings, openedAt])
}

/**
 * Selection, derived rather than corrected by an effect — so there is never a
 * frame where the rail shows a patient the table no longer lists. Falls back
 * to the top row when the selected patient is reassigned away.
 */
export function resolveSelection(
  caseload: Caseload,
  requested: Mrn | null,
): CaseloadRow | undefined {
  if (requested !== null) {
    const match = caseload.byMrn.get(requested)
    if (match) return match
  }
  return caseload.rows[0]
}
