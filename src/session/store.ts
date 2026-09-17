import { COORDINATORS, DEFAULT_SETTINGS, MANAGER, SEED_PATIENTS } from '@/data/patients'
import { browserDeps, type StoreDeps } from './persistence'
import type {
  Activity,
  ActivityVerb,
  Coordinator,
  CoordinatorId,
  Message,
  Mrn,
  Patient,
  SessionEvent,
  SessionEventWire,
  SessionState,
  Settings,
} from './types'

export const STORAGE_KEY = 'ucm.session.v2'
export const CHANNEL_NAME = 'ucm-session'

const ACTIVITY_LIMIT = 60

type StateListener = () => void
type EventListener = (event: SessionEvent, state: SessionState, remote: boolean) => void

export interface SessionStore {
  readonly coordinators: readonly Coordinator[]
  readonly manager: typeof MANAGER
  /** False when localStorage was blocked, so cross-tab sync is unavailable. */
  readonly persistent: boolean

  /** Stable identity between commits — required by useSyncExternalStore. */
  getSnapshot(): SessionState
  subscribe(listener: StateListener): () => void
  /** Tagged events, for toasts and arrival animations. Fires once per event. */
  subscribeEvents(listener: EventListener): () => void

  assign(mrn: Mrn, coordId: CoordinatorId, opts?: { priority?: boolean; note?: string }): Patient | null
  unassign(mrn: Mrn): Patient | null
  message(coordId: CoordinatorId, body: string, opts?: { priority?: boolean; patientMrn?: Mrn | null }): Message | null
  logCall(mrn: Mrn, coordId: CoordinatorId, outcome: string, note?: string): boolean
  markRead(messageId: string): boolean
  markAllRead(coordId: CoordinatorId): void
  acknowledge(mrn: Mrn, coordId: CoordinatorId): void
  updateSettings(patch: Partial<Settings>): Settings
  reset(): void

  /** Test/HMR teardown. */
  destroy(): void
}

function seedState(now: number): SessionState {
  return {
    v: 2,
    patients: SEED_PATIENTS.map((p) => ({ ...p })),
    messages: [],
    activity: [],
    settings: { ...DEFAULT_SETTINGS },
    startedAt: now,
  }
}

/** Never throws. Has to survive anything already sitting in localStorage. */
function normalize(raw: unknown, now: number): SessionState | null {
  if (typeof raw !== 'object' || raw === null) return null
  const s = raw as Partial<SessionState>
  if (s.v !== 2) return null
  if (!Array.isArray(s.patients) || s.patients.length === 0) return null
  return {
    v: 2,
    patients: s.patients as Patient[],
    messages: Array.isArray(s.messages) ? (s.messages as Message[]) : [],
    activity: Array.isArray(s.activity) ? (s.activity as Activity[]) : [],
    settings: { ...DEFAULT_SETTINGS, ...(s.settings ?? {}) },
    startedAt: typeof s.startedAt === 'number' ? s.startedAt : now,
  }
}

/**
 * Reuse previous element objects where a remote read produced an equal value.
 * A cross-tab read rebuilds the whole object graph, so without this every
 * selector's equality check fails and the entire tree re-renders even when
 * the slice it cares about did not change.
 */
function reconcile<T>(prev: readonly T[], next: readonly T[]): readonly T[] {
  if (prev.length !== next.length) {
    return next.map((n, i) => reuse(prev[i], n))
  }
  let identical = true
  const out = next.map((n, i) => {
    const merged = reuse(prev[i], n)
    if (merged !== prev[i]) identical = false
    return merged
  })
  return identical ? prev : out
}

function reuse<T>(prev: T | undefined, next: T): T {
  if (prev === undefined) return next
  return JSON.stringify(prev) === JSON.stringify(next) ? prev : next
}

export function createSessionStore(deps: StoreDeps = browserDeps(CHANNEL_NAME)): SessionStore {
  const { storage, channel, now, random } = deps

  const tabId = `tab-${random().toString(36).slice(2, 9)}`
  const stateListeners = new Set<StateListener>()
  const eventListeners = new Set<EventListener>()

  let snapshot: SessionState
  /** Fences the BroadcastChannel + storage double-fire in receiving tabs. */
  let lastRaw: string

  {
    const stored = storage.getItem(STORAGE_KEY)
    let parsed: SessionState | null = null
    if (stored) {
      try {
        parsed = normalize(JSON.parse(stored), now())
      } catch {
        parsed = null
      }
    }
    snapshot = parsed ?? seedState(now())
    lastRaw = JSON.stringify(snapshot)
    if (!parsed) storage.setItem(STORAGE_KEY, lastRaw)
  }

  function publish(event: SessionEvent, remote: boolean) {
    // State listeners take no arguments — React pulls via getSnapshot().
    for (const fn of stateListeners) fn()
    for (const fn of eventListeners) {
      try {
        fn(event, snapshot, remote)
      } catch (err) {
        console.error(err)
      }
    }
  }

  function commit(next: SessionState, event: SessionEvent) {
    const raw = JSON.stringify(next)
    storage.setItem(STORAGE_KEY, raw)
    lastRaw = raw
    snapshot = next
    publish(event, false)
    channel?.post({ ...event, origin: tabId } satisfies SessionEventWire)
  }

  /** A remote notification: re-read storage rather than trusting the payload. */
  function applyExternal(event: SessionEvent) {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null || raw === lastRaw) return
    let parsed: SessionState | null
    try {
      parsed = normalize(JSON.parse(raw), now())
    } catch {
      return
    }
    if (!parsed) return
    lastRaw = raw
    snapshot = {
      ...parsed,
      patients: reconcile(snapshot.patients, parsed.patients),
      messages: reconcile(snapshot.messages, parsed.messages),
      activity: reconcile(snapshot.activity, parsed.activity),
    }
    publish(event, true)
  }

  channel?.onMessage((message) => {
    const wire = (message ?? { type: 'sync', remote: true }) as SessionEventWire
    // Ignore our own broadcasts (StrictMode/HMR can double-instantiate).
    if (wire.origin && wire.origin === tabId) return
    const { origin: _origin, ...event } = wire
    applyExternal(event as SessionEvent)
  })

  const stopWatchingStorage = deps.onExternalWrite(STORAGE_KEY, () => {
    applyExternal({ type: 'sync', remote: true })
  })

  /* ── helpers ─────────────────────────────────────────────────────── */

  const uid = (prefix: string) => `${prefix}-${random().toString(36).slice(2, 9)}`

  const coordinator = (id: CoordinatorId | null): Coordinator | null =>
    COORDINATORS.find((c) => c.id === id) ?? null

  const findPatient = (mrn: Mrn): Patient | undefined =>
    snapshot.patients.find((p) => p.mrn === mrn)

  function withPatient(mrn: Mrn, change: (p: Patient) => Patient): readonly Patient[] {
    return snapshot.patients.map((p) => (p.mrn === mrn ? change(p) : p))
  }

  function logged(
    actorName: string,
    verb: ActivityVerb,
    detail: string,
    mrn: Mrn | null,
  ): readonly Activity[] {
    const entry: Activity = {
      id: uid('a'),
      ts: now(),
      actorName,
      verb,
      detail,
      patientMrn: mrn,
    }
    return [entry, ...snapshot.activity].slice(0, ACTIVITY_LIMIT)
  }

  /* ── mutators ────────────────────────────────────────────────────── */

  const store: SessionStore = {
    coordinators: COORDINATORS,
    manager: MANAGER,
    persistent: deps.persistent,

    getSnapshot: () => snapshot,

    subscribe(listener) {
      stateListeners.add(listener)
      return () => void stateListeners.delete(listener)
    },

    subscribeEvents(listener) {
      eventListeners.add(listener)
      return () => void eventListeners.delete(listener)
    },

    assign(mrn, coordId, opts = {}) {
      const patient = findPatient(mrn)
      const coord = coordinator(coordId)
      if (!patient || !coord) return null
      if (patient.assignedTo === coordId) return null

      const previous = coordinator(patient.assignedTo)
      const next: Patient = {
        ...patient,
        assignedTo: coordId,
        assignedAt: now(),
        assignedBy: MANAGER.name,
        priority: !!opts.priority,
        acknowledged: false,
      }

      const body =
        opts.note ??
        `Assigning ${patient.name} to you — risk score ${patient.score}, ` +
          `${Math.floor(patient.hoursSince)} hours post-discharge` +
          `${patient.contacted ? '' : ' and never contacted'}. Please make contact today.`

      const message: Message = {
        id: uid('m'),
        ts: now(),
        from: 'james',
        fromName: MANAGER.name,
        to: coordId,
        patientMrn: patient.mrn,
        patientName: patient.name,
        kind: 'assignment',
        priority: !!opts.priority,
        body,
        read: false,
      }

      // Moving a patient between coordinators is a reassignment, not a first
      // assignment. The legacy manager drawer silently no-opped here.
      const isReassign = previous !== null
      commit(
        {
          ...snapshot,
          patients: withPatient(mrn, () => next),
          messages: [message, ...snapshot.messages],
          activity: logged(
            MANAGER.name,
            'assigned',
            isReassign
              ? `${patient.name} → ${coord.short} (from ${previous!.short})`
              : `${patient.name} → ${coord.short}`,
            mrn,
          ),
        },
        isReassign
          ? { type: 'reassign', mrn, coordId }
          : { type: 'assign', mrn, coordId },
      )
      return next
    },

    unassign(mrn) {
      const patient = findPatient(mrn)
      if (!patient || !patient.assignedTo) return null
      const previous = coordinator(patient.assignedTo)
      const next: Patient = { ...patient, assignedTo: null, assignedAt: null, acknowledged: false }
      commit(
        {
          ...snapshot,
          patients: withPatient(mrn, () => next),
          activity: logged(
            MANAGER.name,
            'unassigned',
            `${patient.name} from ${previous?.short ?? 'coordinator'}`,
            mrn,
          ),
        },
        { type: 'unassign', mrn },
      )
      return next
    },

    message(coordId, body, opts = {}) {
      const coord = coordinator(coordId)
      const trimmed = body.trim()
      if (!coord || !trimmed) return null
      const patient = opts.patientMrn ? findPatient(opts.patientMrn) : undefined
      const message: Message = {
        id: uid('m'),
        ts: now(),
        from: 'james',
        fromName: MANAGER.name,
        to: coordId,
        patientMrn: patient?.mrn ?? null,
        patientName: patient?.name ?? null,
        kind: 'message',
        priority: !!opts.priority,
        body: trimmed,
        read: false,
      }
      const preview = trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed
      commit(
        {
          ...snapshot,
          messages: [message, ...snapshot.messages],
          activity: logged(MANAGER.name, 'messaged', `${coord.short} — "${preview}"`, message.patientMrn),
        },
        { type: 'message', coordId, messageId: message.id },
      )
      return message
    },

    logCall(mrn, coordId, outcome, note = '') {
      const patient = findPatient(mrn)
      if (!patient) return false
      const coord = coordinator(coordId)
      const detail = `${patient.name} — ${outcome}${note ? ` · ${note.slice(0, 50)}` : ''}`
      commit(
        {
          ...snapshot,
          patients: withPatient(mrn, (p) => ({
            ...p,
            contacted: true,
            lastOutcome: outcome,
            lastContactAt: now(),
          })),
          activity: logged(coord?.short ?? 'Coordinator', 'logged call', detail, mrn),
        },
        { type: 'call', mrn, outcome },
      )
      return true
    },

    markRead(messageId) {
      const target = snapshot.messages.find((m) => m.id === messageId)
      if (!target || target.read) return false
      commit(
        {
          ...snapshot,
          messages: snapshot.messages.map((m) => (m.id === messageId ? { ...m, read: true } : m)),
        },
        { type: 'read', messageId },
      )
      return true
    },

    markAllRead(coordId) {
      if (!snapshot.messages.some((m) => m.to === coordId && !m.read)) return
      commit(
        {
          ...snapshot,
          messages: snapshot.messages.map((m) => (m.to === coordId ? { ...m, read: true } : m)),
        },
        { type: 'read-all', coordId },
      )
    },

    acknowledge(mrn, coordId) {
      const patient = findPatient(mrn)
      if (!patient) return
      const coord = coordinator(coordId)
      commit(
        {
          ...snapshot,
          patients: withPatient(mrn, (p) => ({ ...p, acknowledged: true })),
          activity: logged(
            coord?.short ?? 'Coordinator',
            'acknowledged',
            `assignment of ${patient.name}`,
            mrn,
          ),
        },
        { type: 'ack', mrn },
      )
    },

    updateSettings(patch) {
      const settings = { ...snapshot.settings, ...patch }
      commit(
        {
          ...snapshot,
          settings,
          activity: logged(MANAGER.name, 'updated settings', Object.keys(patch).join(', '), null),
        },
        { type: 'settings', patch },
      )
      return settings
    },

    reset() {
      commit(seedState(now()), { type: 'reset' })
    },

    destroy() {
      stopWatchingStorage()
      channel?.close()
      stateListeners.clear()
      eventListeners.clear()
    },
  }

  return store
}

/* One instance per tab. Stashed on globalThis so Vite HMR and StrictMode
   cannot install a second set of channel listeners. */
const globalRef = globalThis as typeof globalThis & { __ucmSessionStore?: SessionStore }
export const sessionStore: SessionStore = (globalRef.__ucmSessionStore ??= createSessionStore())
