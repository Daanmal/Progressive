import type { AppConfig, HitRecord, Jackpot } from './types'
import { uid } from './format'

function random(): number {
  return Math.random()
}

export function applyWager(
  jackpots: Jackpot[],
  wager: number,
): { jackpots: Jackpot[]; hits: HitRecord[] } {
  const hits: HitRecord[] = []
  const next = jackpots.map((j) => {
    if (!j.enabled || j.kind === 'fixed') return j

    const add = wager * (j.contributionPercent / 100)
    if (add <= 0) return j

    if (j.kind === 'must_hit' && j.mustHitBy != null) {
      const remaining = Math.max(0, j.mustHitBy - j.current)
      if (remaining <= 0) {
        hits.push(recordHit(j, j.mustHitBy))
        return { ...j, current: j.seed }
      }
      const increment = Math.min(add, remaining)
      const pHit = increment / remaining
      if (random() < pHit) {
        const amount = j.current + increment * random()
        hits.push(recordHit(j, amount))
        return { ...j, current: j.seed }
      }
      return { ...j, current: j.current + increment }
    }

    return { ...j, current: j.current + add }
  })

  return { jackpots: next, hits }
}

export function hitJackpot(j: Jackpot): { jackpot: Jackpot; hit: HitRecord } {
  const amount = j.kind === 'fixed' ? j.seed : j.current
  return {
    jackpot: { ...j, current: j.seed },
    hit: recordHit(j, amount),
  }
}

function recordHit(j: Jackpot, amount: number): HitRecord {
  return {
    id: uid(),
    jackpotId: j.id,
    label: j.label,
    amount,
    at: new Date().toISOString(),
  }
}

export function tickDemo(config: AppConfig, dtSeconds: number): {
  jackpots: Jackpot[]
  hits: HitRecord[]
} {
  if (!config.demoRunning || !config.tableOpen || config.demoHandsPerMinute <= 0) {
    return { jackpots: config.jackpots, hits: [] }
  }
  const hands = (config.demoHandsPerMinute / 60) * dtSeconds
  const wagerVolume = hands * config.progressiveWager
  return applyWager(config.jackpots, wagerVolume)
}
