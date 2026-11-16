import { useEffect, useState, type CSSProperties } from 'react'
import type { AppConfig, Jackpot } from '../types'
import { formatMoney } from '../format'
import { PlayingCard } from './PlayingCard'

/** Milliseconds of no pointer/keyboard activity before the cursor hides. */
const IDLE_MS = 2500

interface Props {
  config: AppConfig
  celebrating?: { label: string; amount: number } | null
}

export function DisplayBoard({ config, celebrating }: Props) {
  const { theme } = config
  const visible = config.jackpots.filter((j) => j.enabled)
  const [cursorIdle, setCursorIdle] = useState(false)

  useEffect(() => {
    let timer = window.setTimeout(() => setCursorIdle(true), IDLE_MS)
    const onActivity = () => {
      setCursorIdle(false)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setCursorIdle(true), IDLE_MS)
    }
    window.addEventListener('pointermove', onActivity)
    window.addEventListener('pointerdown', onActivity)
    window.addEventListener('keydown', onActivity)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointermove', onActivity)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
    }
  }, [])

  return (
    <div
      className={`board${cursorIdle ? ' idle' : ''}`}
      style={
        {
          '--bg': theme.background,
          '--plaque-top': theme.plaqueTop,
          '--plaque-mid': theme.plaqueMid,
          '--plaque-bottom': theme.plaqueBottom,
          '--plaque-edge': theme.plaqueEdge,
          '--gold': theme.gold,
          '--title': theme.title,
          '--closed': theme.closed,
          '--wager': theme.wager,
        } as CSSProperties
      }
    >
      <div className="sign">
        <div className="logo-block">
          <div className="cards-row">
            {config.logo ? (
              <img
                className="brand-logo"
                src={config.logo}
                alt={`${config.titleLine1} ${config.titleLine2}`.trim() || 'Table logo'}
              />
            ) : (
              <>
                <PlayingCard card={config.leftCard} rotate={-12} className="hero-card" />
                <PlayingCard card={config.rightCard} rotate={12} className="hero-card overlap" />
              </>
            )}
          </div>
          {config.showTitle ? (
            <>
              <div className="flourish">✦</div>
              <h1 className="brand">
                <span className="brand-1">{config.titleLine1}</span>
                <span className="brand-2">{config.titleLine2}</span>
              </h1>
              <div className="flourish">✦</div>
            </>
          ) : null}
        </div>

        <ol className="meters">
          {visible.map((j) => (
            <JackpotRow
              key={j.id}
              jackpot={j}
              symbol={config.currencySymbol}
              decimals={config.decimals}
            />
          ))}
        </ol>

        <div className="status-slot">
          {config.tableOpen ? (
            <p className="table-open">Table Open</p>
          ) : (
            <p className="table-closed">Table Closed</p>
          )}
        </div>

        <footer className="board-foot">
          {config.footerNotice?.trim() ? (
            <span className="footer-notice">{config.footerNotice}</span>
          ) : null}
          <span className="wager-line">
            PROGRESSIVE WAGER: {config.currencySymbol}
            {config.progressiveWager}
          </span>
          <span className="table-id">{config.tableId}</span>
        </footer>
      </div>

      {celebrating && (
        <div className="celebrate" role="status">
          <p className="celebrate-kicker">JACKPOT</p>
          <p className="celebrate-label">{celebrating.label}</p>
          <p className="celebrate-amount">
            {formatMoney(celebrating.amount, config.currencySymbol, config.decimals)}
          </p>
        </div>
      )}
    </div>
  )
}

function JackpotRow({
  jackpot,
  symbol,
  decimals,
}: {
  jackpot: Jackpot
  symbol: string
  decimals: number
}) {
  const amount = jackpot.kind === 'fixed' ? jackpot.seed : jackpot.current
  const name = jackpot.label.trim()
  const cap =
    jackpot.kind === 'must_hit' && jackpot.mustHitBy != null
      ? `Must hit by ${formatMoney(jackpot.mustHitBy, symbol, Math.max(decimals, 2))}`
      : null

  return (
    <li className="meter">
      {(name || cap) && (
        <p className="meter-label">
          {name}
          {name && cap && ' · '}
          {cap && <span className="meter-cap">{cap}</span>}
        </p>
      )}
      <div className="plaque">
        <span className="plaque-shine" />
        <span className="amount">
          {formatMoney(amount, symbol, decimals)}
        </span>
      </div>
    </li>
  )
}
