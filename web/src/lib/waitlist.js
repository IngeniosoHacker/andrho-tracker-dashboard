import { apiPost } from './authApi.js'

// Options + persistence for the waitlist page (waitlist.html). Posts to
// andrho-api's public `POST /waitlist` (waitlist_submissions table), the same
// endpoint the pre-launch survey in the `andrho` repo used, with a subset of
// its fields. Throws with a user-facing `.message` on failure.
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

export async function joinWaitlist({ name, company, email, sector, companySize }) {
  await apiPost('/waitlist', { name, company, email, sectors: [sector], companySize })
}
