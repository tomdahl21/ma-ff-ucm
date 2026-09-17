import type { TimelineEntry } from '@/data/types'
import type { RiskTier } from '@/session/types'
import { DEMO_YEAR } from '@/data/demoClock'
import type { CaseloadRow } from './useCaseload'

const TIER_LABEL: Record<RiskTier, string> = { high: 'High', medium: 'Medium', low: 'Low' }

/**
 * Assembles a patient's unified Epic + Salesforce timeline.
 *
 * Only the admission and discharge moments are authored; the scoring,
 * action-generation and assignment steps are generated from the patient's own
 * values, so they can't drift out of sync with the score on screen.
 */
export function buildTimeline(row: CaseloadRow): TimelineEntry[] {
  const { patient, tier, detail } = row
  if (!detail) return []

  const actionTitles = detail.actions.map((a) => a.title).join(' · ')
  const count = detail.actions.length

  return [
    {
      icon: '🏥',
      dot: 'red',
      title: 'ED Admission',
      desc: detail.admit.desc,
      time: detail.admit.time,
      src: 'epic',
    },
    {
      icon: '📋',
      title: 'Discharged — Clinical Record Closed',
      desc: detail.discharge.desc,
      time: detail.discharge.time,
      src: 'epic',
    },
    {
      icon: '⚡',
      title: `Risk Scored — Flagged ${TIER_LABEL[tier]}`,
      desc: `Epic clinical data joined with Salesforce engagement history. Score ${patient.score}/100.`,
      time: `${detail.dischargedOn}, ${DEMO_YEAR} · 9:31 AM`,
      src: 'dc',
    },
    {
      icon: '🤖',
      title: `${count} Next Best Action${count === 1 ? '' : 's'} Generated`,
      desc: `${actionTitles}. Routed to coordinator queue.`,
      time: `${detail.dischargedOn}, ${DEMO_YEAR} · 9:32 AM`,
      src: 'agent',
    },
    {
      icon: '👤',
      dot: 'maroon',
      title: 'Assigned to Sarah Lin',
      desc: 'Auto-assigned by caseload balancing rule.',
      time: `${detail.assignedOn}, ${DEMO_YEAR} · 8:00 AM`,
      src: 'hc',
    },
    ...(detail.events ?? []),
  ]
}
