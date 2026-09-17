/**
 * The protocol document index.
 *
 * Deliberately metadata only — titles, owning service, version and review
 * date. The prototype has no document store behind this, so inventing
 * clinical guidance here would be dressing up content the app cannot stand
 * behind. What IS real is `appliesToDx`: it joins each protocol to the
 * diagnoses actually present in the caseload, so the counts on screen are
 * derived rather than authored.
 */

export interface Protocol {
  id: string
  title: string
  service: string
  version: string
  reviewed: string
  /** Matched against patient `dx` to count applicable patients. */
  appliesToDx: readonly string[]
}

export const PROTOCOLS: readonly Protocol[] = [
  {
    id: 'chf',
    title: 'Heart Failure Post-Discharge Pathway',
    service: 'Cardiology',
    version: 'v2.3',
    reviewed: 'Aug 2026',
    appliesToDx: ['CHF Exacerbation'],
  },
  {
    id: 'copd',
    title: 'COPD Exacerbation Follow-Up',
    service: 'Pulmonology',
    version: 'v1.8',
    reviewed: 'Jul 2026',
    appliesToDx: ['COPD', 'COPD Exacerbation', 'Asthma'],
  },
  {
    id: 'sepsis',
    title: 'Post-Sepsis Recovery Monitoring',
    service: 'Infectious Disease',
    version: 'v3.1',
    reviewed: 'Sep 2026',
    appliesToDx: ['Sepsis Recovery'],
  },
  {
    id: 'dka',
    title: 'Diabetic Ketoacidosis Transition of Care',
    service: 'Endocrinology',
    version: 'v2.0',
    reviewed: 'Jun 2026',
    appliesToDx: ['Diabetic Ketoacidosis'],
  },
  {
    id: 'pneumonia',
    title: 'Community-Acquired Pneumonia Follow-Up',
    service: 'Infectious Disease',
    version: 'v1.4',
    reviewed: 'May 2026',
    appliesToDx: ['Pneumonia'],
  },
  {
    id: 'cardiac-surgical',
    title: 'Cardiac Surgical Recovery Pathway',
    service: 'Cardiothoracic Surgery',
    version: 'v4.0',
    reviewed: 'Sep 2026',
    appliesToDx: ['Post-Op Cardiac', 'Afib'],
  },
  {
    id: 'wound',
    title: 'Skin and Soft Tissue Infection Care',
    service: 'General Surgery',
    version: 'v1.2',
    reviewed: 'Apr 2026',
    appliesToDx: ['Cellulitis', 'Laceration Repair'],
  },
  {
    id: 'surgical-general',
    title: 'General Surgical Discharge Checklist',
    service: 'General Surgery',
    version: 'v2.7',
    reviewed: 'Aug 2026',
    appliesToDx: ['Appendectomy', 'Post-Op Orthopedic'],
  },
  {
    id: 'aki',
    title: 'Acute Kidney Injury Post-Discharge Review',
    service: 'Nephrology',
    version: 'v1.1',
    reviewed: 'Mar 2026',
    appliesToDx: ['Acute Kidney Injury'],
  },
  {
    id: 'gi-bleed',
    title: 'Upper GI Bleed Follow-Up',
    service: 'Gastroenterology',
    version: 'v1.6',
    reviewed: 'Jul 2026',
    appliesToDx: ['GI Bleed'],
  },
  {
    id: 'stroke',
    title: 'Stroke and TIA Secondary Prevention',
    service: 'Neurology',
    version: 'v3.4',
    reviewed: 'Sep 2026',
    appliesToDx: ['Stroke / TIA'],
  },
  {
    id: 'general',
    title: 'Universal Post-Discharge Contact Standard',
    service: 'Care Coordination',
    version: 'v5.2',
    reviewed: 'Sep 2026',
    // The baseline standard — applies to everyone, so it's matched by
    // absence of a dx list rather than an enumeration.
    appliesToDx: [],
  },
]

export const PROTOCOL_SERVICES = [...new Set(PROTOCOLS.map((p) => p.service))].sort()
