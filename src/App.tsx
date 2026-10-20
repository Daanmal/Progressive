import { useCallback, useEffect, useRef, useState } from 'react'
import { AdminPanel } from './components/AdminPanel'
import { DisplayBoard } from './components/DisplayBoard'
import { defaultConfig, HITS_KEY, STORAGE_KEY } from './defaultConfig'
import { applyWager, hitJackpot, tickDemo } from './engine'
import type { AppConfig, HitRecord } from './types'

function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultConfig
    return { ...defaultConfig, ...JSON.parse(raw) }
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

export default function App() {
  const [config, setConfig] = useState<AppConfig>(loadConfig)
  const [hits, setHits] = useState<HitRecord[]>(loadHits)
  const [adminOpen, setAdminOpen] = useState(false)
  const [celebrating, setCelebrating] = useState<{
    label: string
    amount: number
  } | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    }, 400)
    return () => window.clearTimeout(t)
  }, [config])

  useEffect(() => {
    localStorage.setItem(HITS_KEY, JSON.stringify(hits.slice(0, 50)))
  }, [hits])

  const configRef = useRef(config)
  configRef.current = config

  const commit = useCallback((next: AppConfig) => {
    configRef.current = next
    setConfig(next)
  }, [])

  const pushHits = useCallback((incoming: HitRecord[]) => {
    if (incoming.length === 0) return
    setHits((prev) => [...incoming, ...prev].slice(0, 50))
    const last = incoming[incoming.length - 1]
    setCelebrating({ label: last.label, amount: last.amount })
    window.setTimeout(() => setCelebrating(null), 4200)
  }, [])

  useEffect(() => {
    const dt = 0.12
    const id = window.setInterval(() => {
      const prev = configRef.current
      const result = tickDemo(prev, dt)
      if (result.hits.length) pushHits(result.hits)
      if (result.jackpots === prev.jackpots) return
      commit({ ...prev, jackpots: result.jackpots })
    }, dt * 1000)
    return () => window.clearInterval(id)
  }, [pushHits, commit])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAdminOpen(false)
      if ((e.key === 's' || e.key === 'S') && !isTyping(e)) {
        setAdminOpen((v) => !v)
      }
      if (e.key === 'f' && !isTyping(e)) {
        void document.documentElement.requestFullscreen?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
    <div className={`shell ${adminOpen ? 'with-admin' : ''}`}>
      <DisplayBoard config={config} celebrating={celebrating} />
      <AdminPanel
        open={adminOpen}
        config={config}
        hits={hits}
        onClose={() => setAdminOpen(false)}
        onChange={commit}
        onHit={onHit}
        onWager={onWager}
        onResetMeters={onResetMeters}
      />
      <button
        type="button"
        className="settings-fab"
        onClick={() => setAdminOpen((v) => !v)}
        aria-label="Open settings"
      >
        ⚙
      </button>
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
