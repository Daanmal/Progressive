import type { AppConfig, HitRecord, Jackpot, JackpotKind, Rank, Suit } from '../types'
import { RANKS, SUITS } from '../types'
import { formatMoney, uid } from '../format'
import { defaultConfig } from '../defaultConfig'

interface Props {
  config: AppConfig
  hits: HitRecord[]
  open: boolean
  onClose: () => void
  onChange: (next: AppConfig) => void
  onHit: (id: string) => void
  onWager: (count: number) => void
  onResetMeters: () => void
}

export function AdminPanel({
  config,
  hits,
  open,
  onClose,
  onChange,
  onHit,
  onWager,
  onResetMeters,
}: Props) {
  if (!open) return null

  const set = (patch: Partial<AppConfig>) => onChange({ ...config, ...patch })
  const setTheme = (key: keyof AppConfig['theme'], value: string) =>
    set({ theme: { ...config.theme, [key]: value } })

  const updateJackpot = (id: string, patch: Partial<Jackpot>) => {
    set({
      jackpots: config.jackpots.map((j) => (j.id === id ? { ...j, ...patch } : j)),
    })
  }

  const move = (index: number, dir: -1 | 1) => {
    const next = [...config.jackpots]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    set({ jackpots: next })
  }

  const remove = (id: string) => {
    set({ jackpots: config.jackpots.filter((j) => j.id !== id) })
  }

  const add = (kind: JackpotKind) => {
    const j: Jackpot = {
      id: uid(),
      label: kind === 'fixed' ? 'Pair or worse' : 'New jackpot',
      kind,
      current: kind === 'fixed' ? 50 : 100,
      seed: kind === 'must_hit' ? 25 : kind === 'fixed' ? 50 : 100,
      contributionPercent: kind === 'fixed' ? 0 : 3,
      mustHitBy: kind === 'must_hit' ? 250 : undefined,
      enabled: true,
    }
    set({ jackpots: [...config.jackpots, j] })
  }

  const uploadLogo = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      window.alert('Choose an image file for the logo.')
      return
    }
    if (file.size > 1024 * 1024) {
      window.alert('Logo images must be 1 MB or smaller.')
      return
    }
    try {
      set({ logo: await readAsDataUrl(file) })
    } catch {
      window.alert('Could not read that image.')
    }
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'blackjack-progressive.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = async (file: File | undefined) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as AppConfig
      if (!parsed.jackpots || !parsed.theme) throw new Error('Invalid file')
      onChange({ ...defaultConfig, ...parsed })
    } catch {
      window.alert('Could not import that configuration file.')
    }
  }

  return (
    <aside className="admin" aria-label="Display settings">
      <header className="admin-head">
        <div>
          <p className="admin-kicker">Controller</p>
          <h2>Jackpot settings</h2>
        </div>
        <button type="button" className="ghost" onClick={onClose}>
          Close
        </button>
      </header>

      <section>
        <h3>Table</h3>
        <div className="row">
          <label>
            Title line 1
            <input
              value={config.titleLine1}
              onChange={(e) => set({ titleLine1: e.target.value })}
            />
          </label>
          <label>
            Title line 2
            <input
              value={config.titleLine2}
              onChange={(e) => set({ titleLine2: e.target.value })}
            />
          </label>
        </div>
        <div className="row">
          <label>
            Table ID
            <input
              value={config.tableId}
              onChange={(e) => set({ tableId: e.target.value })}
            />
          </label>
          <label>
            Side wager
            <input
              type="number"
              min={0}
              step={0.5}
              value={config.progressiveWager}
              onChange={(e) => set({ progressiveWager: Number(e.target.value) })}
            />
          </label>
        </div>
        <label>
          Footer notice
          <input
            value={config.footerNotice ?? ''}
            placeholder="ARE YOU PLAYING SMOOTH?"
            onChange={(e) => set({ footerNotice: e.target.value })}
          />
        </label>
        <div className="row">
          <label>
            Currency
            <input
              value={config.currencySymbol}
              onChange={(e) => set({ currencySymbol: e.target.value })}
            />
          </label>
          <label>
            Decimals
            <input
              type="number"
              min={0}
              max={2}
              value={config.decimals}
              onChange={(e) => set({ decimals: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="row">
          <label className="check">
            <input
              type="checkbox"
              checked={config.tableOpen}
              onChange={(e) => set({ tableOpen: e.target.checked })}
            />
            Table open
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={config.showTitle}
              onChange={(e) => set({ showTitle: e.target.checked })}
            />
            Show title
          </label>
        </div>
      </section>

      <section>
        <h3>Logo</h3>
        {config.logo ? (
          <>
            <div className="logo-preview">
              <img src={config.logo} alt="Current logo" />
            </div>
            <button type="button" onClick={() => set({ logo: undefined })}>
              Remove logo
            </button>
          </>
        ) : (
          <>
            <div className="row">
              <CardPick
                label="Left"
                card={config.leftCard}
                onChange={(leftCard) => set({ leftCard })}
              />
              <CardPick
                label="Right"
                card={config.rightCard}
                onChange={(rightCard) => set({ rightCard })}
              />
            </div>
            <label className="file-btn">
              Upload logo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => {
                  void uploadLogo(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
            <p className="hint">
              Optional; replaces the two cards. PNG, JPG, WebP or SVG, max 1 MB.
            </p>
          </>
        )}
      </section>

      <section className="span-2">
        <div className="section-head">
          <h3>Meters &amp; payouts</h3>
        </div>
        <p className="hint">
          Progressives climb per side wager; must-hit meters show their cap beside the label.
        </p>
        <div className="meters-editors">
          {config.jackpots.map((j, i) => (
            <details key={j.id} className="jackpot-edit">
              <summary
                onClick={(e) => {
                  e.preventDefault()
                  toggleMeter(e.currentTarget.parentElement as HTMLDetailsElement)
                }}
              >
                <span className="jackpot-name">{j.label || 'Untitled'}</span>
                <span className={`jackpot-kind kind-${j.kind}`}>{kindLabel(j.kind)}</span>
                <span className="jackpot-value">
                  {formatMoney(
                    j.kind === 'fixed' ? j.seed : j.current,
                    config.currencySymbol,
                    config.decimals,
                  )}
                </span>
              </summary>
              <div className="editor-tools">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}>
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === config.jackpots.length - 1}
                >
                  Down
                </button>
                <button type="button" className="danger" onClick={() => remove(j.id)}>
                  Remove
                </button>
              </div>
            <label>
              Hand / label
              <input
                value={j.label}
                onChange={(e) => updateJackpot(j.id, { label: e.target.value })}
              />
            </label>
            <div className="row">
              <label>
                Type
                <select
                  value={j.kind}
                  onChange={(e) => {
                    const kind = e.target.value as JackpotKind
                    updateJackpot(j.id, {
                      kind,
                      mustHitBy: kind === 'must_hit' ? j.mustHitBy ?? 300 : undefined,
                      contributionPercent: kind === 'fixed' ? 0 : j.contributionPercent || 3,
                    })
                  }}
                >
                  <option value="progressive">Progressive</option>
                  <option value="must_hit">Must-hit progressive</option>
                  <option value="fixed">Fixed payout</option>
                </select>
              </label>
              <label className="check tight">
                <input
                  type="checkbox"
                  checked={j.enabled}
                  onChange={(e) => updateJackpot(j.id, { enabled: e.target.checked })}
                />
                Show
              </label>
            </div>
            {j.kind === 'fixed' ? (
              <label>
                Payout
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={j.seed}
                  onChange={(e) => {
                    const seed = Number(e.target.value)
                    updateJackpot(j.id, { seed, current: seed })
                  }}
                />
              </label>
            ) : (
              <>
                <div className="row">
                  <label>
                    Current
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={Number(j.current.toFixed(2))}
                      onChange={(e) =>
                        updateJackpot(j.id, { current: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Reset / seed
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={j.seed}
                      onChange={(e) => updateJackpot(j.id, { seed: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <label>
                  Feed % of each side wager
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={j.contributionPercent}
                    onChange={(e) =>
                      updateJackpot(j.id, { contributionPercent: Number(e.target.value) })
                    }
                  />
                </label>
                {j.kind === 'must_hit' && (
                  <label>
                    Must hit by
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={j.mustHitBy ?? 0}
                      onChange={(e) =>
                        updateJackpot(j.id, { mustHitBy: Number(e.target.value) })
                      }
                    />
                  </label>
                )}
              </>
            )}
              <button type="button" className="hit" onClick={() => onHit(j.id)}>
                Award / reset
              </button>
            </details>
          ))}
        </div>
        <div className="add-row">
          <button type="button" onClick={() => add('progressive')}>
            Add progressive
          </button>
          <button type="button" onClick={() => add('must_hit')}>
            Add must-hit
          </button>
          <button type="button" onClick={() => add('fixed')}>
            Add fixed payout
          </button>
        </div>
      </section>

      <section>
        <h3>Live play (demo)</h3>
        <label className="check">
          <input
            type="checkbox"
            checked={config.demoRunning}
            onChange={(e) => set({ demoRunning: e.target.checked })}
          />
          Auto-increment while table is open
        </label>
        <label>
          Hands per minute
          <input
            type="number"
            min={0}
            max={120}
            value={config.demoHandsPerMinute}
            onChange={(e) => set({ demoHandsPerMinute: Number(e.target.value) })}
          />
        </label>
        <div className="add-row">
          <button type="button" onClick={() => onWager(1)}>
            +1 wager
          </button>
          <button type="button" onClick={() => onWager(10)}>
            +10 wagers
          </button>
          <button type="button" onClick={() => onWager(100)}>
            +100 wagers
          </button>
        </div>
        <button type="button" className="danger" onClick={onResetMeters}>
          Reset all meters to seed
        </button>
      </section>

      <section>
        <h3>Sign window</h3>
        <p className="hint">
          Opens the sign in its own read-only window for a table screen or TV, mirrored
          live from here. Press F there for fullscreen.
        </p>
        <div className="add-row">
          <button type="button" onClick={openSignWindow}>
            Open sign window
          </button>
        </div>
      </section>

      <section>
        <h3>Look</h3>
        <div className="swatches">
          {(
            [
              ['background', 'Background'],
              ['plaqueTop', 'Plaque top'],
              ['plaqueMid', 'Plaque mid'],
              ['plaqueBottom', 'Plaque bottom'],
              ['plaqueEdge', 'Gold edge'],
              ['gold', 'Amount'],
              ['title', 'Title'],
              ['closed', 'Closed text'],
              ['wager', 'Wager text'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="swatch">
              {label}
              <input
                type="color"
                value={toHex(config.theme[key])}
                onChange={(e) => setTheme(key, e.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3>Backup</h3>
        <div className="add-row">
          <button type="button" onClick={exportJson}>
            Export JSON
          </button>
          <label className="file-btn">
            Import JSON
            <input
              type="file"
              accept="application/json"
              onChange={(e) => {
                void importJson(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
          <button type="button" onClick={() => onChange(defaultConfig)}>
            Restore sample
          </button>
        </div>
      </section>

      {hits.length > 0 && (
        <section className="span-2">
          <h3>Recent awards</h3>
          <ul className="hits">
            {hits.slice(0, 12).map((h) => (
              <li key={h.id}>
                <span>{h.label}</span>
                <strong>
                  {formatMoney(h.amount, config.currencySymbol, config.decimals)}
                </strong>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  )
}

function CardPick({
  label,
  card,
  onChange,
}: {
  label: string
  card: { rank: Rank; suit: Suit }
  onChange: (card: { rank: Rank; suit: Suit }) => void
}) {
  return (
    <fieldset className="card-pick">
      <legend>{label}</legend>
      <select
        value={card.rank}
        onChange={(e) => onChange({ ...card, rank: e.target.value as Rank })}
      >
        {RANKS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <select
        value={card.suit}
        onChange={(e) => onChange({ ...card, suit: e.target.value as Suit })}
      >
        {SUITS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </fieldset>
  )
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function kindLabel(kind: JackpotKind): string {
  if (kind === 'must_hit') return 'Must-hit'
  if (kind === 'fixed') return 'Fixed'
  return 'Progressive'
}

function toggleMeter(details: HTMLDetailsElement) {
  const willOpen = !details.open
  details.parentElement
    ?.querySelectorAll('details')
    .forEach((other) => {
      if (other !== details) other.open = false
    })
  details.open = willOpen
}

function openSignWindow() {
  const url = new URL(window.location.href)
  url.searchParams.set('mode', 'display')
  window.open(url.toString(), 'blackjack-sign', 'popup=yes,width=900,height=1500')
}

function toHex(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color
  return '#000000'
}
