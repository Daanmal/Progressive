import type { AppConfig, HitRecord } from './types'

const CHANNEL_NAME = 'blackjack-match-sync-v1'

export type SyncMessage =
  | { type: 'state'; config: AppConfig }
  | { type: 'logo'; logo: string | undefined }
  | { type: 'hit'; hit: HitRecord }
  | { type: 'hello' }

/** State broadcasts run on every meter tick, so the (large) logo travels separately. */
export function withoutLogo(config: AppConfig): AppConfig {
  if (!config.logo) return config
  const next = { ...config }
  delete next.logo
  return next
}

export function openChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  return new BroadcastChannel(CHANNEL_NAME)
}
