import type { Patient, RiskTier, Settings } from '@/session/types'
import { DEFAULT_SETTINGS, SEED_PATIENTS } from './patients'
import { PATIENT_DETAIL } from './patientDetail'
import type { PatientDetail } from './types'

/**
 * The single place risk tier is decided. Never stored on a patient — storing
 * it is what let the legacy coordinator and manager pages disagree about the
 * same person after a threshold change.
 */
export function tierFor(score: number, settings: Settings): RiskTier {
  if (score >= settings.highThreshold) return 'high'
  if (score >= settings.mediumThreshold) return 'medium'
  return 'low'
}

/** Hours-since-discharge is stored; days are always derived. */
export function daysSince(hoursSince: number): number {
  return Math.floor(hoursSince / 24)
}

/**
 * Checks the authored demo data holds together. The risk-factor points are
 * hand-authored to sum to the score, and nothing about a wrong sum is visible
 * on screen — so it gets asserted rather than trusted.
 */
export function validateData(
  patients: readonly Patient[] = SEED_PATIENTS,
  details: readonly PatientDetail[] = PATIENT_DETAIL,
  settings: Settings = DEFAULT_SETTINGS,
): string[] {
  const errors: string[] = []
  const byMrn = new Map(patients.map((p) => [p.mrn, p]))

  if (byMrn.size !== patients.length) {
    errors.push(`MRN is the canonical id but ${patients.length - byMrn.size} duplicate(s) exist`)
  }

  for (const p of patients) {
    if (p.epicPts === undefined) continue
    const sfdc = p.sfdcPts ?? 0
    if (p.epicPts + sfdc !== p.score) {
      errors.push(`${p.mrn} ${p.name}: epicPts ${p.epicPts} + sfdcPts ${sfdc} !== score ${p.score}`)
    }
  }

  for (const d of details) {
    const p = byMrn.get(d.mrn)
    if (!p) {
      errors.push(`detail ${d.mrn} has no matching patient`)
      continue
    }

    const sum = (src: 'epic' | 'sfdc') =>
      d.factors.filter((f) => f.src === src).reduce((n, f) => n + f.pts, 0)

    if (p.epicPts === undefined || p.sfdcPts === undefined) {
      errors.push(`${p.name} has authored detail but no score split`)
      continue
    }
    if (sum('epic') !== p.epicPts) {
      errors.push(`${p.name}: epic factors sum to ${sum('epic')}, epicPts is ${p.epicPts}`)
    }
    if (sum('sfdc') !== p.sfdcPts) {
      errors.push(`${p.name}: sfdc factors sum to ${sum('sfdc')}, sfdcPts is ${p.sfdcPts}`)
    }

    // The authored copy should agree with the tier the default thresholds imply.
    const derived = tierFor(p.score, settings)
    if (d.authoredTier !== derived) {
      errors.push(`${p.name}: authored tier ${d.authoredTier}, score ${p.score} implies ${derived}`)
    }
  }

  return errors
}

// Loud in dev even if nobody runs the tests.
if (import.meta.env?.DEV) {
  const errors = validateData()
  if (errors.length) {
    console.error('[ucm] demo data invariants violated:\n' + errors.map((e) => `  - ${e}`).join('\n'))
  }
}
