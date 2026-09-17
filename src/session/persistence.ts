/**
 * Storage and cross-tab transport for the session store.
 *
 * Both are injectable so the store can be tested in isolation, and so the
 * in-memory fallback is just a different storage rather than a branch in
 * every mutator.
 */

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  }
}

/**
 * Probe real localStorage once. Private browsing and blocked third-party
 * storage both throw on write, not on access, so the probe has to write.
 */
export function detectStorage(): { storage: StorageLike; persistent: boolean } {
  try {
    const probe = '__ucm_probe'
    globalThis.localStorage.setItem(probe, '1')
    globalThis.localStorage.removeItem(probe)
    return { storage: globalThis.localStorage, persistent: true }
  } catch {
    return { storage: createMemoryStorage(), persistent: false }
  }
}

export interface Channel {
  post(message: unknown): void
  onMessage(handler: (message: unknown) => void): void
  close(): void
}

/** Null when BroadcastChannel is unavailable (older browsers, jsdom). */
export function createChannel(name: string): Channel | null {
  let bc: BroadcastChannel
  try {
    bc = new globalThis.BroadcastChannel(name)
  } catch {
    return null
  }
  return {
    post: (message) => {
      try {
        bc.postMessage(message)
      } catch {
        // A structured-clone failure must never break a local mutation.
      }
    },
    onMessage: (handler) => {
      bc.onmessage = (e: MessageEvent) => handler(e.data)
    },
    close: () => bc.close(),
  }
}

export interface StoreDeps {
  storage: StorageLike
  persistent: boolean
  channel: Channel | null
  /** Fires when another tab writes the same key. */
  onExternalWrite(key: string, handler: () => void): () => void
  now(): number
  random(): number
}

export function browserDeps(channelName: string): StoreDeps {
  const { storage, persistent } = detectStorage()
  return {
    storage,
    persistent,
    channel: createChannel(channelName),
    // The storage event only fires in OTHER tabs. It overlaps with
    // BroadcastChannel, but it is the sole cross-tab path when
    // BroadcastChannel is missing, so both are kept.
    onExternalWrite: (key, handler) => {
      const listener = (e: StorageEvent) => {
        if (e.key === key) handler()
      }
      globalThis.addEventListener('storage', listener)
      return () => globalThis.removeEventListener('storage', listener)
    },
    now: () => Date.now(),
    random: () => Math.random(),
  }
}
