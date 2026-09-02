// Waitlist survey data + local persistence.
// NOTE: there is no backend yet (Go API is still pending per AI_INSTRUCTIONS.md),
// so submissions are kept in localStorage for now. Swap `saveSubmission` for a
// fetch() to the real endpoint once it exists.

export const SECTORS = [
  { value: 'comercio', label: 'Comercio / Retail' },
  { value: 'restaurantes', label: 'Restaurantes' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'manufactura', label: 'Manufactura' },
  { value: 'logistica', label: 'Logística' },
  { value: 'salud', label: 'Salud' },
  { value: 'otro', label: 'Otro' },
]

export const COMPANY_SIZES = [
  { value: '1-10', label: '1 a 10 personas' },
  { value: '11-50', label: '11 a 50 personas' },
  { value: '51-200', label: '51 a 200 personas' },
  { value: '200+', label: 'Más de 200 personas' },
]

export const SALES_METHODS = [
  { value: 'b2b', label: 'B2B (empresa a empresa)' },
  { value: 'b2c', label: 'B2C (empresa a cliente final)' },
  { value: 'mixto', label: 'Mixto (B2B y B2C)' },
  { value: 'marketplace', label: 'Marketplace / terceros' },
]

export const MANAGEMENT_TOOLS = [
  { value: 'software', label: 'Software (ERP, hojas de cálculo, etc.)' },
  { value: 'papel', label: 'Papel / procesos manuales' },
  { value: 'mixto', label: 'Una mezcla de ambos' },
]

const STORAGE_KEY = 'andrho_waitlist_submissions'

export function saveSubmission(entry) {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  existing.push({ ...entry, submittedAt: new Date().toISOString() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}
