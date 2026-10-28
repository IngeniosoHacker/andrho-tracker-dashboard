import { apiPost } from './authApi.js'
import { INITIAL_ANSWERS, STEPS, buildSubmission } from './survey.js'

// The signup (signup.html): two ways in, one way out.
//
//   rápida        a paragraph about the business. POST /analyzer/describe
//                 (Claude, or keyword rules) reads it into the survey's
//                 answers and the boarding pass; only the questions it
//                 didn't answer are asked.
//   personalizada every question of the survey.
//
// Then, in both, the brand (essence, logo), and only once everything is
// known, the suggestion: POST /analyzer/suggest blends the rules' ranking of
// modules with Claude's, into three packages (Despegue, En Órbita,
// Galáctico) whose modules can be unchecked (none can exceed the plan's
// limit). Last, the boarding pass (pre-filled from the paragraph) and POST
// /auth/register, which creates the account and sets up its services.
// Everything is free during the beta.

// The survey's questions minus the open-text ones and the ones the signup
// asks on cards of its own (plan and contact).
const SKIP = ['currentSoftware', 'satisfactionReason', 'improvement', 'planInterest', 'contact']
export const QUESTION_STEPS = STEPS.filter((s) => !SKIP.includes(s.id))
export const questionSteps = (answers) => QUESTION_STEPS.filter((s) => !s.when || s.when(answers))

export { INITIAL_ANSWERS }

// Shorter than this, a description isn't worth reading (the API agrees).
export const MIN_DESCRIPTION = 15

// What the paragraph says: { answers, contact, brand, details, summary, source }.
export const describeBusiness = async (text) => (await apiPost('/analyzer/describe', { description: text.trim() })).description

// The suggestion, from everything the signup knows.
export const suggestSetup = (answers, description, brand) =>
  apiPost('/analyzer/suggest', { ...buildSubmission(answers), description: description.trim(), brand: { choice: brand.choice, essence: brand.essence.trim() } })

// The description's answers in the survey's shape: every field present,
// multi-select sector answers as lists (the API sends "a,b").
function surveyShape(extracted) {
  const a = { ...INITIAL_ANSWERS, sectorAnswers: {} }
  for (const [k, v] of Object.entries(extracted ?? {})) {
    if (k === 'sectorAnswers') continue
    if (k in a && v !== null && v !== undefined) a[k] = v
  }
  for (const [k, v] of Object.entries(extracted?.sectorAnswers ?? {})) {
    const step = QUESTION_STEPS.find((s) => s.id === k)
    a.sectorAnswers[k] = step?.kind === 'multi' ? String(v).split(',').filter(Boolean) : v
  }
  return a
}

const isEmpty = (v) => v === '' || v === 0 || v === null || v === undefined || (Array.isArray(v) && v.length === 0)

// Folds a description into the signup: answers fill only what's still
// empty (what the person already answered wins), and `covered` lists the
// question steps the paragraph answered, which the quick setup skips.
export function applyDescription(answers, d) {
  const extracted = { ...surveyShape(d.answers), ...d.details }
  const merged = { ...answers, sectorAnswers: { ...answers.sectorAnswers } }
  for (const [k, v] of Object.entries(extracted)) {
    if (k === 'sectorAnswers') {
      for (const [sk, sv] of Object.entries(v)) if (isEmpty(merged.sectorAnswers[sk])) merged.sectorAnswers[sk] = sv
    } else if (k in merged && isEmpty(merged[k]) && !isEmpty(v)) merged[k] = v
  }
  const covered = QUESTION_STEPS.filter((s) => (!s.when || s.when(extracted)) && s.valid(extracted)).map((s) => s.id)
  return { answers: merged, covered }
}

// The boarding pass and the brand, filled from the description where the
// person hasn't written anything yet.
export function prefillAccount(account, contact = {}) {
  const next = { ...account }
  for (const k of ['name', 'company', 'email', 'phone']) if (!next[k]?.trim() && contact[k]) next[k] = contact[k]
  return next
}
export function prefillBrand(brand, b = {}) {
  if (brand.choice) return brand
  if (b.essence) return { choice: b.has_brand === false ? 'ayuda' : 'tengo', essence: b.essence }
  if (b.has_brand === false) return { ...brand, choice: 'ayuda' }
  return brand
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
