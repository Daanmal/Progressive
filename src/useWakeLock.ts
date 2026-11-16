import { useEffect } from 'react'

interface WakeLockSentinelLike {
  release: () => Promise<void>
}

type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> }
}

/**
 * Keeps the screen awake while the sign is visible (tablet or kiosk TV). Browsers
 * drop the lock whenever the page is hidden, so it is re-acquired on the next
 * `visibilitychange` back to visible.
 */
export function useWakeLock() {
  useEffect(() => {
    const wakeLock = (navigator as WakeLockNavigator).wakeLock
    if (!wakeLock) return

    let sentinel: WakeLockSentinelLike | null = null
    let disposed = false

    const acquire = () => {
      if (disposed || document.visibilityState !== 'visible') return
      wakeLock.request('screen').then(
        (lock) => {
          if (disposed) {
            void lock.release().catch(() => {})
            return
          }
          sentinel = lock
        },
        () => {
          sentinel = null
        },
      )
    }

    acquire()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') acquire()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', onVisibility)
      if (sentinel) void sentinel.release().catch(() => {})
      sentinel = null
    }
  }, [])
}
