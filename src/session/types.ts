/**
 * The session-borne domain model.
 *
 * This is the consolidated shape: one `patients` collection replaces the
 * legacy split between a mutable 7-patient `pool` and a frozen 47-row
 * `ROSTER`. Every patient is now assignable and loggable, which is what
 * fixes the silent no-ops in the legacy manager drawer.
 */

export type CoordinatorId = 'sarah' | 'marcus' | 'denise' | 'anthony' | 'priya' | 'gerald'

/** MRN doubles as the canonical patient id — the only field every legacy
 *  source already agreed on. */
export type Mrn = string

export type RiskTier = 'high' | 'medium' | 'low'

export type Sex = 'M' | 'F'

export interface Coordinator {
  id: CoordinatorId
  name: string
  short: string
  team: string
  /** On leave — excluded from assignment suggestions. */
  away?: boolean
}

export interface Patient {
  mrn: Mrn
  name: string
  age: number
  sex: Sex
  dx: string
  score: number
  assignedTo: CoordinatorId | null
  contacted: boolean
  /** Hours since discharge. `daysSince` is derived, never stored. */
  hoursSince: number
  lastOutcome: string | null
  lastContactAt?: number
  /**
   * Epic / Salesforce split of `score`. Present only where it was actually
   * authored (16 of 54). Absent means "unknown" — the UI shows nothing
   * rather than the legacy manager's fabricated `score * 0.58`.
   */
  epicPts?: number
  sfdcPts?: number
  /** Set when a manager assigns from the unassigned queue. */
  assignedAt?: number | null
  assignedBy?: string
  priority?: boolean
  acknowledged?: boolean
}

export interface Settings {
  highThreshold: number
  mediumThreshold: number
  contactWindowHours: number
  defaultCapacity: number
  notifyOnUnassigned: boolean
}

export interface Message {
  id: string
  ts: number
  from: 'james'
  fromName: string
  to: CoordinatorId
  patientMrn: Mrn | null
  patientName: string | null
  kind: 'assignment' | 'message'
  priority: boolean
  body: string
  read: boolean
}

/** Closed set — the manager's activity feed keys its icon and colour off this. */
export type ActivityVerb =
  | 'assigned'
  | 'unassigned'
  | 'messaged'
  | 'logged call'
  | 'acknowledged'
  | 'updated settings'

export interface Activity {
  id: string
  ts: number
  actorName: string
  verb: ActivityVerb
  detail: string
  patientMrn: Mrn | null
}

export interface SessionState {
  readonly v: 2
  readonly patients: readonly Patient[]
  readonly messages: readonly Message[]
  readonly activity: readonly Activity[]
  readonly settings: Settings
  readonly startedAt: number
}

export type SessionEvent =
  | { type: 'assign'; mrn: Mrn; coordId: CoordinatorId }
  | { type: 'unassign'; mrn: Mrn }
  | { type: 'reassign'; mrn: Mrn; coordId: CoordinatorId }
  | { type: 'message'; coordId: CoordinatorId; messageId: string }
  | { type: 'call'; mrn: Mrn; outcome: string }
  | { type: 'read'; messageId: string }
  | { type: 'read-all'; coordId: CoordinatorId }
  | { type: 'ack'; mrn: Mrn }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'reset' }
  | { type: 'sync'; remote: true }

/** Broadcast envelope. `origin` lets a tab ignore its own messages. */
export type SessionEventWire = SessionEvent & { origin?: string }

/** Per-coordinator rollup. Recomputed by selector, never stored. */
export interface Caseload {
  coord: Coordinator
  total: number
  high: number
  uncontacted: number
  withinWindow: number
  /** Null when no patient is past the contact window yet. */
  contactRate: number | null
  capacity: number
  overBy: number
  patients: readonly Patient[]
}
