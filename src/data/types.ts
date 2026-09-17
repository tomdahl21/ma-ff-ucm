import type { Mrn, RiskTier } from '@/session/types'

/** Which system a value came from. Semantic, not decorative. */
export type SourceKey = 'epic' | 'sfdc' | 'dc' | 'hc' | 'agent' | 'mc'

/** Factors only ever come from the two systems of record. */
export type FactorSource = 'epic' | 'sfdc'

export interface RiskFactor {
  text: string
  src: FactorSource
  /** Signed: positive drives risk up, negative is protective. */
  pts: number
}

export interface SourceConflict {
  head: string
  a: { src: SourceKey; value: string }
  b: { src: SourceKey; value: string }
  verdict: string
  why: string
}

/**
 * Which provenance footer an action card shows. Replaces the legacy `PROV`
 * table of raw HTML strings, so nothing needs dangerouslySetInnerHTML.
 */
export type ProvenanceKind = 'reason' | 'mychart' | 'healthCloud' | 'rxSms' | 'sms'

export type NbaTone = 'call' | 'visit' | 'rx' | 'alert'

export interface NextBestAction {
  icon: string
  tone: NbaTone
  /** AI-generated recommendations get the tinted overline. */
  ai: boolean
  label: string
  title: string
  desc: string
  prov: ProvenanceKind
  buttons: { text: string; kind: 'primary' | 'secondary' | 'ghost' }[]
}

export type TimelineDot = '' | 'red' | 'green' | 'maroon'

export interface TimelineEntry {
  icon: string
  dot?: TimelineDot
  title: string
  desc: string
  time: string
  src: SourceKey
}

export interface TimelineMoment {
  desc: string
  time: string
}

/**
 * Authored narrative depth. Exists for 9 patients today; the other 45 render
 * the same layout minus these sections.
 */
export interface PatientDetail {
  mrn: Mrn
  dischargedOn: string
  dischargedAgo: string
  assignedOn: string
  nextAction: string
  /** Stored only as authored copy; the live tier is always derived from score. */
  authoredTier: RiskTier
  admit: TimelineMoment
  discharge: TimelineMoment
  factors: RiskFactor[]
  conflicts: SourceConflict[]
  actions: NextBestAction[]
  events?: TimelineEntry[]
}
