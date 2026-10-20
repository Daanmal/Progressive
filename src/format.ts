export function formatMoney(
  value: number,
  symbol: string,
  decimals: number,
): string {
  const abs = Math.max(0, value)
  const fixed = abs.toFixed(decimals)
  const [intPart, frac] = fixed.split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return frac !== undefined ? `${symbol}${withCommas}.${frac}` : `${symbol}${withCommas}`
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
