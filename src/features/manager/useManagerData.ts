import { useMemo } from 'react'
import { daysSince, tierFor } from '@/data/invariants'
import { useSessionSelector } from '@/session/react'
import { initials } from '@/util/initials'
import { selectCaseloads, selectSuggestedCoordinator, shallowArrayEqual } from '@/session/selectors'
import type { Caseload, CoordinatorId, Patient, RiskTier, SessionState } from '@/session/types'

/** A patient plus everything derived from current settings. */
export interface ManagedPatient {
  patient: Patient
  tier: RiskTier
  days: number
  coordinatorName: string | null
}

export interface ManagerOverview {
  patients: readonly ManagedPatient[]
  unassigned: readonly ManagedPatient[]
  caseloads: readonly Caseload[]
  suggested: CoordinatorId
  total: number
  counts: Record<RiskTier, number>
  uncontacted: number
  /** Share of patients past the contact window who have been reached. */
  contactRate: number
  overCapacity: readonly Caseload[]
  /** Most common diagnoses among high-risk patients, most frequent first. */
  topHighRiskDiagnoses: readonly { dx: string; count: number }[]
}

const selectOverviewInput = (s: SessionState) => s

export function useManagerOverview(): ManagerOverview {
  // One snapshot, one derivation — the legacy page called caseloads() (which
  // walks all 54 patients) once per row, plus again per assign-row.
  const state = useSessionSelector(selectOverviewInput)
  const caseloads = useSessionSelector(selectCaseloads, shallowArrayEqual)
  const suggested = useSessionSelector(selectSuggestedCoordinator)

  return useMemo(() => {
    const { settings } = state
    const nameOf = (id: CoordinatorId | null) =>
      id === null ? null : (caseloads.find((c) => c.coord.id === id)?.coord.short ?? null)

    const patients: ManagedPatient[] = state.patients.map((patient) => ({
      patient,
      tier: tierFor(patient.score, settings),
      days: daysSince(patient.hoursSince),
      coordinatorName: nameOf(patient.assignedTo),
    }))

    const eligible = patients.filter((p) => p.patient.hoursSince >= settings.contactWindowHours)
    const reached = eligible.filter((p) => p.patient.contacted).length

    const dxTally = new Map<string, number>()
    for (const p of patients) {
      if (p.tier !== 'high') continue
      dxTally.set(p.patient.dx, (dxTally.get(p.patient.dx) ?? 0) + 1)
    }

    return {
      patients,
      unassigned: patients.filter((p) => p.patient.assignedTo === null),
      caseloads,
      suggested,
      total: patients.length,
      counts: {
        high: patients.filter((p) => p.tier === 'high').length,
        medium: patients.filter((p) => p.tier === 'medium').length,
        low: patients.filter((p) => p.tier === 'low').length,
      },
      uncontacted: patients.filter((p) => !p.patient.contacted).length,
      contactRate: eligible.length ? Math.round((reached / eligible.length) * 100) : 0,
      overCapacity: caseloads.filter((c) => c.overBy > 0),
      topHighRiskDiagnoses: [...dxTally.entries()]
        .map(([dx, count]) => ({ dx, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    }
  }, [state, caseloads, suggested])
}

export { initials }
