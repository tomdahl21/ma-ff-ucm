/**
 * Figures that are authored demo content, not derived from session state.
 *
 * Everything the app can actually compute — caseloads, contact rates, tier
 * counts, conflict-free patient totals — is computed. What's left here is
 * narrative: history the prototype has no data for (a 14-day trend), and
 * reconciliation outcomes that would come from a real integration layer.
 *
 * Collected in one module so it's obvious which numbers on the Performance
 * view are illustrative rather than live.
 */

/** 14-day contact-rate history. The prototype only knows about "today". */
export const CONTACT_RATE_TREND = [
  { day: 4, pct: 78 },
  { day: 5, pct: 82 },
  { day: 6, pct: 85 },
  { day: 7, pct: 80 },
  { day: 8, pct: 76 },
  { day: 9, pct: 88 },
  { day: 10, pct: 84 },
  { day: 11, pct: 79 },
  { day: 12, pct: 81 },
  { day: 13, pct: 75 },
  { day: 14, pct: 69, belowTarget: true },
  { day: 15, pct: 66, belowTarget: true },
  { day: 16, pct: 72, belowTarget: true },
  { day: 17, pct: 71, belowTarget: true },
] as const

export const CONTACT_RATE_TARGET = 80

/** Reconciliation outcomes — would come from the integration layer. */
export const RECONCILIATION = {
  conflictsResolved: 41,
  needsManualReview: 6,
  wouldHaveBeenMissed: 23,
  epicSyncLag: '4h 12m',
} as const

export interface ConflictType {
  type: string
  epic: string
  sfdc: string
  rule: string
  unresolved?: boolean
  count: number
}

export const CONFLICT_TYPES: readonly ConflictType[] = [
  {
    type: 'Discharge status mismatch',
    epic: 'Discharged',
    sfdc: 'Case still open',
    rule: 'Epic wins — clinical source of truth',
    count: 17,
  },
  {
    type: 'Contact number differs',
    epic: 'Registration phone',
    sfdc: 'Last-responded phone',
    rule: 'Salesforce wins — verified more recently',
    count: 12,
  },
  {
    type: 'Follow-up appointment',
    epic: 'Scheduled',
    sfdc: 'No record',
    rule: 'Epic wins — scheduling system of record',
    count: 8,
  },
  {
    type: 'Duplicate patient record',
    epic: 'Single MRN',
    sfdc: 'Two contact records',
    rule: 'Unresolved — needs manual merge',
    unresolved: true,
    count: 6,
  },
]
