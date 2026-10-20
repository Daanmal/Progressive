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
        <label className="check">
          <input
            type="checkbox"
            checked={config.tableOpen}
            onChange={(e) => set({ tableOpen: e.target.checked })}
          />
          Table open
        </label>
      </section>

      <section>
        <h3>Logo cards</h3>
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
      </section>

      <section>
        <div className="section-head">
          <h3>Meters &amp; payouts</h3>
        </div>
        <p className="hint">
          Progressives climb from each side wager. Must-hit meters can pop before the cap.
          Fixed payouts stay at the set amount for weaker hands.
        </p>
        {config.jackpots.map((j, i) => (
          <article key={j.id} className="jackpot-edit">
            <header>
              <strong>{j.label || 'Untitled'}</strong>
              <div className="icon-row">
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
            </header>
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
          </article>
        ))}
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
        <h3>Recent awards</h3>
        {hits.length === 0 ? (
          <p className="hint">No awards yet.</p>
        ) : (
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
        )}
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

function toHex(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color
  return '#000000'
}
