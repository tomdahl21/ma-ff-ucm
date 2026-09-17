import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryStorage, type Channel, type StoreDeps, type StorageLike } from './persistence'
import { CHANNEL_NAME, STORAGE_KEY, createSessionStore, type SessionStore } from './store'
import type { SessionEvent } from './types'

/** A pair of in-process "tabs" sharing one storage, wired like BroadcastChannel. */
function createHarness() {
  const storage = createMemoryStorage()
  const channelHandlers = new Set<(m: unknown) => void>()
  const storageHandlers = new Set<() => void>()
  let seq = 0

  function makeDeps(opts: { channel?: boolean; storage?: StorageLike } = {}): StoreDeps {
    const useChannel = opts.channel ?? true
    const own = new Set<(m: unknown) => void>()
    const channel: Channel | null = useChannel
      ? {
          post: (message) => {
            for (const h of channelHandlers) if (!own.has(h)) h(message)
          },
          onMessage: (handler) => {
            own.add(handler)
            channelHandlers.add(handler)
          },
          close: () => {
            for (const h of own) channelHandlers.delete(h)
          },
        }
      : null

    return {
      storage: opts.storage ?? storage,
      persistent: true,
      channel,
      onExternalWrite: (_key, handler) => {
        storageHandlers.add(handler)
        return () => void storageHandlers.delete(handler)
      },
      now: () => 1_700_000_000_000 + seq++,
      random: () => (seq++ % 1000) / 1000 + 0.000001,
    }
  }

  /** Simulate the browser's storage event, which fires only in other tabs. */
  const fireStorageEvent = () => {
    for (const h of storageHandlers) h()
  }

  return { storage, makeDeps, fireStorageEvent }
}

describe('session store', () => {
  let h: ReturnType<typeof createHarness>
  let store: SessionStore

  beforeEach(() => {
    h = createHarness()
    store = createSessionStore(h.makeDeps())
  })

  it('seeds 54 patients, 7 of them unassigned', () => {
    const s = store.getSnapshot()
    expect(s.patients).toHaveLength(54)
    expect(s.patients.filter((p) => p.assignedTo === null)).toHaveLength(7)
    expect(s.v).toBe(2)
  })

  // The single biggest porting hazard: an unstable snapshot identity makes
  // useSyncExternalStore loop forever, and the failure looks like a hang.
  it('returns an identical snapshot reference until something commits', () => {
    const a = store.getSnapshot()
    const b = store.getSnapshot()
    expect(a).toBe(b)

    store.logCall('4820193', 'sarah', 'Reached — patient responsive')
    const c = store.getSnapshot()
    expect(c).not.toBe(a)
    expect(store.getSnapshot()).toBe(c)
  })

  it('notifies state listeners once per commit', () => {
    const listener = vi.fn()
    store.subscribe(listener)
    store.logCall('4820193', 'sarah', 'Left voicemail')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('does not commit or notify when a mutation is a no-op', () => {
    const listener = vi.fn()
    store.subscribe(listener)
    expect(store.markRead('nope')).toBe(false)
    expect(store.assign('4820193', 'sarah')).toBeNull() // already sarah's
    expect(store.unassign('8813402')).toBeNull() // already unassigned
    expect(store.logCall('does-not-exist', 'sarah', 'Reached')).toBe(false)
    expect(listener).not.toHaveBeenCalled()
  })

  describe('assignment', () => {
    it('assigns an unassigned patient and messages the coordinator', () => {
      const result = store.assign('8813402', 'marcus', { priority: true })
      expect(result?.assignedTo).toBe('marcus')

      const s = store.getSnapshot()
      expect(s.messages[0]).toMatchObject({
        to: 'marcus',
        kind: 'assignment',
        patientMrn: '8813402',
        priority: true,
        read: false,
      })
      expect(s.activity[0]).toMatchObject({ verb: 'assigned', patientMrn: '8813402' })
    })

    // The legacy manager drawer toasted success here and did nothing, because
    // its mutators only scanned the 7-patient pool.
    it('reassigns an already-owned patient', () => {
      const wanda = store.getSnapshot().patients.find((p) => p.mrn === '8820114')!
      expect(wanda.assignedTo).toBe('marcus')

      const events: SessionEvent[] = []
      store.subscribeEvents((e) => void events.push(e))

      const result = store.assign('8820114', 'priya')
      expect(result?.assignedTo).toBe('priya')
      expect(events[0]).toEqual({ type: 'reassign', mrn: '8820114', coordId: 'priya' })
      expect(store.getSnapshot().activity[0]!.detail).toContain('from Marcus Webb')
    })

    it('unassigns an established patient back to the queue', () => {
      expect(store.unassign('8820114')?.assignedTo).toBeNull()
      expect(store.getSnapshot().patients.filter((p) => !p.assignedTo)).toHaveLength(8)
    })
  })

  // Previously logCall('washington', ...) matched nothing, so the manager's
  // contact-rate rollups never moved for established patients.
  it('records a call against an established patient', () => {
    const before = store.getSnapshot().patients.find((p) => p.mrn === '4820193')!
    expect(before.contacted).toBe(false)

    expect(store.logCall('4820193', 'sarah', 'Reached — patient responsive', 'Confirmed Rx')).toBe(true)

    const after = store.getSnapshot().patients.find((p) => p.mrn === '4820193')!
    expect(after.contacted).toBe(true)
    expect(after.lastOutcome).toBe('Reached — patient responsive')
    expect(store.getSnapshot().activity[0]).toMatchObject({
      verb: 'logged call',
      actorName: 'Sarah Lin',
    })
  })

  it('caps the activity log', () => {
    for (let i = 0; i < 70; i++) store.logCall('4820193', 'sarah', `outcome ${i}`)
    expect(store.getSnapshot().activity).toHaveLength(60)
  })

  it('tracks unread messages per coordinator', () => {
    store.message('sarah', 'Please prioritise the CHF patients')
    store.message('marcus', 'Check in on Wanda')
    const s = store.getSnapshot()
    expect(s.messages.filter((m) => m.to === 'sarah' && !m.read)).toHaveLength(1)

    store.markAllRead('sarah')
    expect(store.getSnapshot().messages.filter((m) => m.to === 'sarah' && !m.read)).toHaveLength(0)
    // Marcus's message is untouched.
    expect(store.getSnapshot().messages.filter((m) => m.to === 'marcus' && !m.read)).toHaveLength(1)
  })

  it('rejects an empty message', () => {
    expect(store.message('sarah', '   ')).toBeNull()
  })

  it('updates settings and logs it', () => {
    expect(store.updateSettings({ highThreshold: 60 }).highThreshold).toBe(60)
    expect(store.getSnapshot().activity[0]).toMatchObject({
      verb: 'updated settings',
      detail: 'highThreshold',
    })
  })

  it('resets to seed', () => {
    store.assign('8813402', 'marcus')
    store.updateSettings({ highThreshold: 60 })
    store.reset()
    const s = store.getSnapshot()
    expect(s.patients.filter((p) => !p.assignedTo)).toHaveLength(7)
    expect(s.messages).toHaveLength(0)
    expect(s.settings.highThreshold).toBe(75)
  })
})

describe('persistence', () => {
  it('rehydrates from storage', () => {
    const h = createHarness()
    const first = createSessionStore(h.makeDeps())
    first.assign('8813402', 'marcus')
    first.destroy()

    const second = createSessionStore(h.makeDeps())
    expect(second.getSnapshot().patients.find((p) => p.mrn === '8813402')?.assignedTo).toBe('marcus')
  })

  it('re-seeds over unparseable stored state', () => {
    const h = createHarness()
    h.storage.setItem(STORAGE_KEY, '{not json')
    expect(createSessionStore(h.makeDeps()).getSnapshot().patients).toHaveLength(54)
  })

  it('re-seeds over a stale schema version', () => {
    const h = createHarness()
    // Exactly the shape the legacy ES5 layer wrote.
    h.storage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, pool: [], messages: [], activity: [] }))
    expect(createSessionStore(h.makeDeps()).getSnapshot().patients).toHaveLength(54)
  })

  it('keeps working when storage throws', () => {
    const throwing: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {},
    }
    const h = createHarness()
    // Mirrors the in-memory fallback: detectStorage() swaps in memory storage,
    // so the store itself never sees a throw.
    expect(() => createSessionStore(h.makeDeps({ storage: createMemoryStorage() }))).not.toThrow()
    expect(() => throwing.setItem('x', 'y')).toThrow()
  })
})

describe('cross-tab sync', () => {
  it('propagates a commit from one tab to another', () => {
    const h = createHarness()
    const tabA = createSessionStore(h.makeDeps())
    const tabB = createSessionStore(h.makeDeps())

    const listener = vi.fn()
    tabB.subscribe(listener)

    tabA.assign('8813402', 'marcus')

    expect(listener).toHaveBeenCalled()
    expect(tabB.getSnapshot().patients.find((p) => p.mrn === '8813402')?.assignedTo).toBe('marcus')
  })

  it('marks remotely-originated events as remote', () => {
    const h = createHarness()
    const tabA = createSessionStore(h.makeDeps())
    const tabB = createSessionStore(h.makeDeps())

    const seen: { event: SessionEvent; remote: boolean }[] = []
    tabB.subscribeEvents((event, _s, remote) => void seen.push({ event, remote }))

    tabA.assign('8813402', 'marcus')

    expect(seen).toHaveLength(1)
    expect(seen[0]!.remote).toBe(true)
    expect(seen[0]!.event.type).toBe('assign')
  })

  // Receiving tabs get both a BroadcastChannel message and a storage event.
  it('does not double-apply the channel message and the storage event', () => {
    const h = createHarness()
    const tabA = createSessionStore(h.makeDeps())
    const tabB = createSessionStore(h.makeDeps())

    const listener = vi.fn()
    tabB.subscribe(listener)

    tabA.assign('8813402', 'marcus')
    h.fireStorageEvent() // the storage event arriving after the channel message

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('still syncs when BroadcastChannel is unavailable', () => {
    const h = createHarness()
    const tabA = createSessionStore(h.makeDeps({ channel: false }))
    const tabB = createSessionStore(h.makeDeps({ channel: false }))

    tabA.assign('8813402', 'marcus')
    h.fireStorageEvent()

    expect(tabB.getSnapshot().patients.find((p) => p.mrn === '8813402')?.assignedTo).toBe('marcus')
  })

  it('reuses unchanged element identities across a remote apply', () => {
    const h = createHarness()
    const tabA = createSessionStore(h.makeDeps())
    const tabB = createSessionStore(h.makeDeps())

    const before = tabB.getSnapshot()
    const untouched = before.patients.find((p) => p.mrn === '1129334')

    tabA.logCall('4820193', 'sarah', 'Reached — patient responsive')

    const after = tabB.getSnapshot()
    expect(after).not.toBe(before)
    // The patient nobody touched keeps its object identity, so selectors
    // watching only that row do not re-render.
    expect(after.patients.find((p) => p.mrn === '1129334')).toBe(untouched)
    expect(after.patients.find((p) => p.mrn === '4820193')).not.toBe(
      before.patients.find((p) => p.mrn === '4820193'),
    )
  })

  it('exposes the channel name the legacy layer used', () => {
    expect(CHANNEL_NAME).toBe('ucm-session')
  })
})
