import type { CSSProperties } from 'react'
import type { AppConfig, Jackpot } from '../types'
import { formatMoney } from '../format'
import { PlayingCard } from './PlayingCard'

interface Props {
  config: AppConfig
  celebrating?: { label: string; amount: number } | null
}

export function DisplayBoard({ config, celebrating }: Props) {
  const { theme } = config
  const visible = config.jackpots.filter((j) => j.enabled)

  return (
    <div
      className="board"
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
            <PlayingCard card={config.leftCard} rotate={-12} className="hero-card" />
            <PlayingCard card={config.rightCard} rotate={12} className="hero-card overlap" />
          </div>
          <div className="flourish">✦</div>
          <h1 className="brand">
            <span className="brand-1">{config.titleLine1}</span>
            <span className="brand-2">{config.titleLine2}</span>
          </h1>
          <div className="flourish">✦</div>
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
  const amount =
    jackpot.kind === 'fixed' ? jackpot.seed : jackpot.current
  const label =
    jackpot.kind === 'must_hit' && jackpot.mustHitBy != null
      ? jackpot.label
      : jackpot.label

  return (
    <li className="meter">
      <p className="meter-label">{label}</p>
      <div className="plaque">
        <span className="plaque-shine" />
        <span className="amount">
          {formatMoney(amount, symbol, decimals)}
        </span>
      </div>
    </li>
  )
}
