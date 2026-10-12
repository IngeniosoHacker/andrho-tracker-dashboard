import { apiPost } from './authApi.js'
import { INITIAL_ANSWERS, STEPS, buildSubmission } from './waitlist.js'

// The signup (signup.html): two ways in, one way out.
//
//   rápida        a paragraph about the business; the Analyzer reads it
//                 (POST /analyzer/describe, Claude or keyword rules)
//   personalizada the waitlist's questions; the Analyzer reads the answers
//                 (POST /analyzer)
//
// Both lead to the three packages (Despegue, En Órbita, Galáctico), the
// modules of the chosen one (any can be unchecked; none can exceed the plan's
// limit), "Cuéntanos de tu negocio" (brand essence, logo) and the account,
// then POST /auth/register, which creates the account and sets up its
// services. Everything is free during the beta.

// The waitlist's questions minus the open-text ones and the waitlist-only
// ones (plan and contact are cards of their own here).
const SKIP = ['currentSoftware', 'satisfactionReason', 'improvement', 'planInterest', 'contact']
export const QUESTION_STEPS = STEPS.filter((s) => !SKIP.includes(s.id))
export const questionSteps = (answers) => QUESTION_STEPS.filter((s) => !s.when || s.when(answers))

export { INITIAL_ANSWERS }

export const analyzeAnswers = (answers) => apiPost('/analyzer', buildSubmission(answers))

// A description too short to read gets the analysis of no answers at all:
// the essentials, Galáctico still recommended.
export async function analyzeDescription(text) {
  if (text.trim().length < 15) return { description: null, analysis: await apiPost('/analyzer', {}) }
  return apiPost('/analyzer/describe', { description: text.trim() })
}

export const register = (payload) => apiPost('/auth/register', payload)

// The modules a package starts with for this business (the API's order).
export const defaultModules = (pkg) => pkg.modules.map((m) => m.key)

// What each provisioning job is called on the last card.
export const JOB_LABELS = {
  erp: 'Tu ERP (Odoo)',
  whatsapp: 'WhatsApp',
  website: 'Tu sitio web',
  meta: 'Facebook e Instagram',
}

export const JOB_STATUS = {
  pendiente: 'En cola',
  en_proceso: 'En proceso',
  listo: 'Listo',
  esperando_vps: 'Preparando el servidor',
  esperando_meta: 'Esperando a Meta',
  error: 'Se reintentará',
}

// Reads an image file as a data URL, after checking type and size (the API
// takes PNG, JPG or WebP up to 1 MB).
export function readLogo(file) {
  return new Promise((resolve, reject) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return reject(new Error('El logo debe ser PNG, JPG o WebP.'))
    if (file.size > 1024 * 1024) return reject(new Error('El logo no puede pesar más de 1 MB.'))
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('No pudimos leer el archivo.'))
    reader.readAsDataURL(file)
  })
}

// Half-finished signups survive a reload (never the password or the logo).
const DRAFT_KEY = 'andrho_signup_draft'
export function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY))
    return d && typeof d === 'object' ? d : null
  } catch {
    return null
  }
}
export function saveDraft(value) {
  try {
    if (value) localStorage.setItem(DRAFT_KEY, JSON.stringify(value))
    else localStorage.removeItem(DRAFT_KEY)
  } catch {
    // Storage blocked: the signup just won't resume.
  }
}
