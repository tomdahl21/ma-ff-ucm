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
/**
 * Why a patient still needs a call.
 * - `never-contacted`: no outreach logged since discharge
 * - `retry`: an attempt was logged but nobody was actually reached
 */
export type CallbackReason = 'never-contacted' | 'retry' | null

/** Outcomes that record an attempt without reaching the patient. */
const NO_CONTACT_OUTCOMES = new Set(['Left voicemail', 'No answer'])

export interface CaseloadRow {
  patient: Patient
  /** Derived from score + live thresholds. Never stored on the patient. */
  tier: RiskTier
  days: number
  /** Authored narrative, where it exists. Undefined for most patients. */
  detail: PatientDetail | undefined
  /** Arrived during this session — drives the arrival highlight. */
  isNew: boolean
  callback: CallbackReason
  /** Needs a call AND is already past the contact window. */
  overdue: boolean
}

export interface Caseload {
  rows: readonly CaseloadRow[]
  byMrn: ReadonlyMap<Mrn, CaseloadRow>
  total: number
  /** Everyone still owed a call, most urgent first. */
  callbacks: readonly CaseloadRow[]
  counts: {
    high: number
    medium: number
    low: number
    uncontacted: number
    unacknowledged: number
    callbacks: number
    overdue: number
    retry: number
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
      .map((patient) => {
        const callback: CallbackReason = !patient.contacted
          ? 'never-contacted'
          : NO_CONTACT_OUTCOMES.has(patient.lastOutcome ?? '')
            ? 'retry'
            : null
        return {
          patient,
          tier: tierFor(patient.score, settings),
          days: daysSince(patient.hoursSince),
          detail: DETAIL_BY_MRN.get(patient.mrn),
          isNew: patient.assignedAt != null && patient.assignedAt > openedAt,
          callback,
          overdue: callback !== null && patient.hoursSince >= settings.contactWindowHours,
        }
      })

    // Overdue first, then never-contacted before retries, then by risk.
    const callbacks = rows
      .filter((r) => r.callback !== null)
      .sort((a, b) => {
        if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
        if (a.callback !== b.callback) return a.callback === 'never-contacted' ? -1 : 1
        return b.patient.score - a.patient.score
      })

    return {
      rows,
      byMrn: new Map(rows.map((r) => [r.patient.mrn, r])),
      total: rows.length,
      callbacks,
      counts: {
        high: rows.filter((r) => r.tier === 'high').length,
        medium: rows.filter((r) => r.tier === 'medium').length,
        low: rows.filter((r) => r.tier === 'low').length,
        uncontacted: rows.filter((r) => !r.patient.contacted).length,
        unacknowledged: rows.filter(
          (r) => r.patient.assignedAt != null && r.patient.acknowledged === false,
        ).length,
        callbacks: callbacks.length,
        overdue: callbacks.filter((r) => r.overdue).length,
        retry: callbacks.filter((r) => r.callback === 'retry').length,
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
