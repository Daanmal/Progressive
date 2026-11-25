import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { DisplayBoard } from './components/DisplayBoard'
import { defaultConfig, HITS_KEY, STORAGE_KEY } from './defaultConfig'
import { applyWager, hitJackpot, tickDemo } from './engine'
import { openChannel, withoutLogo, type SyncMessage } from './sync'
import type { AppConfig, HitRecord } from './types'
import { useWakeLock } from './useWakeLock'

const AdminPanel = lazy(() =>
  import('./components/AdminPanel').then((module) => ({ default: module.AdminPanel })),
)

const LEGACY_BRAND = { titleLine1: 'BLACKJACK', titleLine2: 'MATCH' }

function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultConfig
    const config = { ...defaultConfig, ...(JSON.parse(raw) as Partial<AppConfig>) }
    // Earlier builds shipped a "Blackjack Match" wordmark. Drop it from saved setups
    // so the branding goes away without resetting meters, theme or logo.
    if (
      config.titleLine1 === LEGACY_BRAND.titleLine1 &&
      config.titleLine2 === LEGACY_BRAND.titleLine2
    ) {
      return { ...config, titleLine1: '', titleLine2: '', showTitle: false }
    }
    return config
  } catch {
    return defaultConfig
  }
}

function loadHits(): HitRecord[] {
  try {
    const raw = localStorage.getItem(HITS_KEY)
    return raw ? (JSON.parse(raw) as HitRecord[]) : []
  } catch {
    return []
  }
}

function isDisplayMode(): boolean {
  return new URLSearchParams(window.location.search).get('mode') === 'display'
}

export default function App() {
  const [isDisplay] = useState(isDisplayMode)
  useWakeLock()
  const [config, setConfig] = useState<AppConfig>(loadConfig)
  const [hits, setHits] = useState<HitRecord[]>(loadHits)
  const [adminOpen, setAdminOpen] = useState(false)
  const [celebrating, setCelebrating] = useState<{
    label: string
    amount: number
  } | null>(null)

  const channelRef = useRef<BroadcastChannel | null>(null)

  const configBooted = useRef(false)
  const hitsBooted = useRef(false)

  useEffect(() => {
    if (isDisplay) return
    if (!configBooted.current) {
      configBooted.current = true
      return
    }
    const t = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    }, 400)
    return () => window.clearTimeout(t)
  }, [config, isDisplay])

  useEffect(() => {
    if (isDisplay) return
    if (!hitsBooted.current) {
      hitsBooted.current = true
      return
    }
    localStorage.setItem(HITS_KEY, JSON.stringify(hits.slice(0, 50)))
  }, [hits, isDisplay])

  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  }, [config])

  const commit = useCallback((next: AppConfig) => {
    configRef.current = next
    setConfig(next)
  }, [])

  const pushHits = useCallback(
    (incoming: HitRecord[]) => {
      if (incoming.length === 0) return
      setHits((prev) => [...incoming, ...prev].slice(0, 50))
      const last = incoming[incoming.length - 1]
      if (!isDisplay) {
        channelRef.current?.postMessage({
          type: 'hit',
          hit: last,
        } satisfies SyncMessage)
      }
      setCelebrating({ label: last.label, amount: last.amount })
      window.setTimeout(() => setCelebrating(null), 4200)
    },
    [isDisplay],
  )

  useEffect(() => {
    const channel = openChannel()
    if (!channel) return
    channelRef.current = channel

    const onMessage = (event: MessageEvent<SyncMessage>) => {
      const message = event.data
      if (!message) return

      if (isDisplay) {
        if (message.type === 'state') {
          commit({ ...message.config, logo: message.config.logo ?? configRef.current.logo })
        }
        if (message.type === 'logo') {
          commit({ ...configRef.current, logo: message.logo })
        }
        if (message.type === 'hit') pushHits([message.hit])
        return
      }

      if (message.type === 'hello') {
        channel.postMessage({
          type: 'state',
          config: configRef.current,
        } satisfies SyncMessage)
      }
    }

    channel.addEventListener('message', onMessage)
    if (isDisplay) {
      channel.postMessage({ type: 'hello' } satisfies SyncMessage)
    }

    return () => {
      channel.removeEventListener('message', onMessage)
      channel.close()
      channelRef.current = null
    }
  }, [isDisplay, commit, pushHits])

  useEffect(() => {
    if (isDisplay) return
    const channel = channelRef.current
    if (!channel) return
    const t = window.setTimeout(() => {
      channel.postMessage({ type: 'state', config: withoutLogo(config) } satisfies SyncMessage)
    }, 60)
    return () => window.clearTimeout(t)
  }, [config, isDisplay])

  useEffect(() => {
    if (isDisplay) return
    channelRef.current?.postMessage({ type: 'logo', logo: config.logo } satisfies SyncMessage)
  }, [config.logo, isDisplay])

  const demoActive = config.demoRunning && config.tableOpen && config.demoHandsPerMinute > 0

  useEffect(() => {
    if (isDisplay || !demoActive) return
    const dt = 0.12
    const id = window.setInterval(() => {
      const prev = configRef.current
      const result = tickDemo(prev, dt)
      if (result.hits.length) pushHits(result.hits)
      if (result.jackpots === prev.jackpots) return
      commit({ ...prev, jackpots: result.jackpots })
    }, dt * 1000)
    return () => window.clearInterval(id)
  }, [pushHits, commit, isDisplay, demoActive])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isDisplay) {
        if (e.key === 'Escape') setAdminOpen(false)
        if ((e.key === 's' || e.key === 'S') && !isTyping(e)) {
          setAdminOpen((v) => !v)
        }
      }
      if (e.key === 'f' && !isTyping(e)) {
        void document.documentElement.requestFullscreen?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDisplay])

  const onWager = (count: number) => {
    const prev = configRef.current
    const result = applyWager(prev.jackpots, prev.progressiveWager * count)
    commit({ ...prev, jackpots: result.jackpots })
    pushHits(result.hits)
  }

  const onHit = (id: string) => {
    const prev = configRef.current
    const found = prev.jackpots.find((j) => j.id === id)
    if (!found) return
    const { jackpot, hit } = hitJackpot(found)
    commit({
      ...prev,
      jackpots: prev.jackpots.map((j) => (j.id === id ? jackpot : j)),
    })
    pushHits([hit])
  }

  const onResetMeters = () => {
    const prev = configRef.current
    commit({
      ...prev,
      jackpots: prev.jackpots.map((j) => ({
        ...j,
        current: j.seed,
      })),
    })
  }

  return (
    <div className={`shell ${adminOpen && !isDisplay ? 'with-admin' : ''}`}>
      <DisplayBoard config={config} celebrating={celebrating} />
      {!isDisplay && (
        <>
          {adminOpen && (
            <Suspense fallback={null}>
              <AdminPanel
                open
                config={config}
                hits={hits}
                onClose={() => setAdminOpen(false)}
                onChange={commit}
                onHit={onHit}
                onWager={onWager}
                onResetMeters={onResetMeters}
              />
            </Suspense>
          )}
          <button
            type="button"
            className="settings-fab"
            onClick={() => setAdminOpen((v) => !v)}
            aria-label="Open settings"
          >
            ⚙
          </button>
        </>
      )}
    </div>
  )
}

function isTyping(e: KeyboardEvent) {
  const t = e.target
  return (
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t instanceof HTMLSelectElement
  )
}
