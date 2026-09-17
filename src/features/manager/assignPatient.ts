import { sessionActions } from '@/session/react'
import type { Caseload, CoordinatorId, Mrn } from '@/session/types'
import { toast } from '@/ui/toastApi'

/** Shared assign handler so every entry point toasts identically. */
export function assignPatient(
  mrn: Mrn,
  coordId: CoordinatorId,
  caseloads: readonly Caseload[],
): boolean {
  const coord = caseloads.find((c) => c.coord.id === coordId)?.coord
  const patient = sessionActions.assign(mrn, coordId, { priority: true })
  if (!patient || !coord) return false
  toast(
    `Assigned to ${coord.short}`,
    `${patient.name} is now in ${coord.short.split(' ')[0]}'s queue. They've been notified.`,
    'assign',
  )
  return true
}
