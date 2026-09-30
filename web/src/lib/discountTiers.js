// Discount tiers awarded from the asteroid mini-game, keyed by how many
// asteroids the player destroyed (the only number shown to the player — see
// AsteroidGame.jsx). Valid for one year from the moment it's claimed.
export const DISCOUNT_VALID_MONTHS = 12

export const DISCOUNT_TIERS = [
  { min: 0, max: 4, percent: 0, label: 'Casi. Vuelve a intentarlo.' },
  { min: 5, max: 14, percent: 5, label: '5% de descuento por 1 año' },
  { min: 15, max: 29, percent: 10, label: '10% de descuento por 1 año' },
  { min: 30, max: 49, percent: 15, label: '15% de descuento por 1 año' },
  { min: 50, max: Infinity, percent: 20, label: '20% de descuento por 1 año' },
]

export function getDiscountTier(destroyedCount) {
  return DISCOUNT_TIERS.find((tier) => destroyedCount >= tier.min && destroyedCount <= tier.max) ?? DISCOUNT_TIERS[0]
}

// Short, human-readable code the player can quote when AndRho launches
// billing. The registration row it's tied to is the source of truth.
export function generateDiscountCode(percent) {
  const suffix = (crypto.randomUUID?.() ?? `${Date.now()}`).replace(/-/g, '').slice(0, 6).toUpperCase()
  return `ANDRHO-${percent}-${suffix}`
}
