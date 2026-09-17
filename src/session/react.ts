import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import { sessionStore } from './store'
import {
  relTime,
  selectAssignedTo,
  selectCaseloads,
  selectInbox,
  selectPatient,
  selectSettings,
  selectUnassigned,
  selectUnreadCount,
  shallowArrayEqual,
} from './selectors'
import type {
  Activity,
  Caseload,
  CoordinatorId,
  Message,
  Mrn,
  Patient,
  SessionEvent,
  SessionState,
  Settings,
} from './types'

/**
 * Subscribe to a slice of session state.
 *
 * `selector` must be referentially stable across renders — pass a module-level
 * function or wrap it in useMemo. `isEqual` lets a slice that recomputed to an
 * equal value keep its previous reference, so consumers don't re-render; this
 * is what stops a cross-tab update (which rebuilds the whole object graph)
 * from re-rendering the entire page.
 */
export function useSessionSelector<T>(
  selector: (state: SessionState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  return useSyncExternalStoreWithSelector(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getSnapshot,
    selector,
    isEqual,
  )
}

export function useSessionState(): SessionState {
  return useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getSnapshot,
  )
}

export function useSettings(): Settings {
  return useSessionSelector(selectSettings)
}

export function useAssignedTo(coordId: CoordinatorId): readonly Patient[] {
  const selector = useMemo(() => selectAssignedTo(coordId), [coordId])
  return useSessionSelector(selector, shallowArrayEqual)
}

export function useUnassigned(): readonly Patient[] {
  return useSessionSelector(selectUnassigned, shallowArrayEqual)
}

export function usePatient(mrn: Mrn | null): Patient | null {
  const selector = useMemo(() => selectPatient(mrn), [mrn])
  return useSessionSelector(selector)
}

export function useInbox(coordId: CoordinatorId): readonly Message[] {
  const selector = useMemo(() => selectInbox(coordId), [coordId])
  return useSessionSelector(selector, shallowArrayEqual)
}

/** Scalar slice, so the bell only re-renders when the count actually moves. */
export function useUnreadCount(coordId: CoordinatorId): number {
  const selector = useMemo(() => selectUnreadCount(coordId), [coordId])
  return useSessionSelector(selector)
}

export function useActivity(): readonly Activity[] {
  return useSessionSelector(selectActivity, shallowArrayEqual)
}
const selectActivity = (s: SessionState): readonly Activity[] => s.activity

export function useCaseloads(): readonly Caseload[] {
  return useSessionSelector(selectCaseloads, shallowArrayEqual)
}

/**
 * Tagged session events — for toasts and arrival animations, which need to
 * fire once per event rather than once per render. Separate from state
 * subscription on purpose.
 */
export function useSessionEvent(
  handler: (event: SessionEvent, state: SessionState, remote: boolean) => void,
): void {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  }, [handler])
  useEffect(
    () => sessionStore.subscribeEvents((event, state, remote) => ref.current(event, state, remote)),
    [],
  )
}

/* One ticker for the whole app, replacing the legacy per-page
   setInterval(render, 30000) that existed only to refresh these strings. */
const TICK_MS = 30_000
const tickListeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null

function subscribeTick(listener: () => void) {
  tickListeners.add(listener)
  if (timer === null) {
    timer = setInterval(() => {
      for (const fn of tickListeners) fn()
    }, TICK_MS)
  }
  return () => {
    tickListeners.delete(listener)
    if (tickListeners.size === 0 && timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }
}

export function useRelTime(ts: number): string {
  const [, force] = useState(0)
  useEffect(() => subscribeTick(() => force((n) => n + 1)), [])
  return relTime(ts)
}

/** Mutators, imported directly so handlers never enter a dependency array. */
export const sessionActions = sessionStore

export function useResetDemo(): () => void {
  return useCallback(() => sessionStore.reset(), [])
}
