import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAssignedTo, useSessionEvent, useUnreadCount } from './react'
import { sessionStore } from './store'
import type { SessionEvent } from './types'

beforeEach(() => {
  sessionStore.reset()
})

describe('useUnreadCount', () => {
  it('does not re-render when unrelated state changes', () => {
    const renders = vi.fn()

    function Bell() {
      const count = useUnreadCount('sarah')
      renders(count)
      return <span>{count}</span>
    }

    render(<Bell />)
    const baseline = renders.mock.calls.length
    expect(renders).toHaveBeenLastCalledWith(0)

    // An activity entry for a different coordinator's patient. The scalar
    // slice is unchanged, so the bell must not re-render.
    act(() => {
      sessionStore.logCall('8820114', 'marcus', 'Reached — patient responsive')
    })
    expect(renders.mock.calls.length).toBe(baseline)

    // A message addressed to sarah does move the count.
    act(() => {
      sessionStore.message('sarah', 'Please prioritise the CHF patients')
    })
    expect(renders.mock.calls.length).toBeGreaterThan(baseline)
    expect(renders).toHaveBeenLastCalledWith(1)
  })
})

describe('useAssignedTo', () => {
  it('keeps array identity stable when another coordinator changes', () => {
    const seen: (readonly unknown[])[] = []

    function Queue() {
      const mine = useAssignedTo('sarah')
      seen.push(mine)
      return <span>{mine.length}</span>
    }

    render(<Queue />)
    const first = seen.at(-1)

    act(() => {
      sessionStore.logCall('8820114', 'marcus', 'Reached — patient responsive')
    })

    // Same 9 patients, same element identities → same array reference.
    expect(seen.at(-1)).toBe(first)
  })

  it('produces a new array when one of my patients changes', () => {
    const seen: (readonly unknown[])[] = []

    function Queue() {
      const mine = useAssignedTo('sarah')
      seen.push(mine)
      return <span>{mine.length}</span>
    }

    render(<Queue />)
    const first = seen.at(-1)

    act(() => {
      sessionStore.logCall('4820193', 'sarah', 'Reached — patient responsive')
    })

    expect(seen.at(-1)).not.toBe(first)
  })
})

describe('useSessionEvent', () => {
  it('fires once per event, not once per render', () => {
    const handler = vi.fn()

    function Listener() {
      useSessionEvent(handler)
      return null
    }

    render(<Listener />)
    expect(handler).not.toHaveBeenCalled()

    act(() => {
      sessionStore.assign('8813402', 'marcus', { priority: true })
    })

    expect(handler).toHaveBeenCalledTimes(1)
    const event = handler.mock.calls[0]![0] as SessionEvent
    expect(event).toEqual({ type: 'assign', mrn: '8813402', coordId: 'marcus' })
  })
})
