import { TOKEN_KEYS, apiPost } from './authApi.js'

// The long signup's kit (andrho-api internal/brand.Kit): logo, colors and
// data, each "tengo" (uploaded now), "crear" (a Creator makes it), or
// "despues" (uploaded later from the panel); colors can also be read from
// the logo ("logo") and data can start from scratch ("cero"). Plus how many
// people work there and how many need AndRho.
//
// The logo travels with the signup (POST /auth/register, as before); the
// images of the brand and the data files go right after, with the new
// account's token (POST /account/assets), where andrho-api reads their
// colors or maps the data to the ERP. Their colors are previewed here with
// POST /analyzer/palette (the same extraction, on shrunken copies).

const API_URL = (import.meta.env.VITE_ANDRHO_API_URL || '').replace(/\/+$/, '')

export const INITIAL_KIT = { logo: '', colors: '', palette: [], data: '' }

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
export const MAX_IMAGE_MB = 5
export const MAX_DATA_MB = 15
export const MAX_BRAND_IMAGES = 6
export const MAX_DATA_FILES = 8
export const MAX_PALETTE = 8
export const DATA_ACCEPT = '.csv,.tsv,.txt,.xlsx,.xlsm,.xls,.json,.sql,.dump'

// What each data file is called while it waits to be uploaded.
export const fileSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

export function checkImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) return 'Las imágenes deben ser PNG, JPG, WebP o GIF.'
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `Cada imagen puede pesar hasta ${MAX_IMAGE_MB} MB.`
  return ''
}

export function checkData(file) {
  const ext = file.name.toLowerCase().match(/\.[a-z]+$/)?.[0] ?? ''
  if (!DATA_ACCEPT.split(',').includes(ext)) return `${file.name}: sube Excel, CSV, JSON o un respaldo SQL.`
  if (file.size > MAX_DATA_MB * 1024 * 1024) return `${file.name} pesa más de ${MAX_DATA_MB} MB.`
  return ''
}

// A small PNG copy of an image (for the palette preview: colors survive,
// the upload stays tiny). Accepts a File or a data URL.
export async function shrink(src, side = 192) {
  const url = typeof src === 'string' ? src : URL.createObjectURL(src)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('No pudimos leer la imagen.'))
      i.src = url
    })
    const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    if (typeof src !== 'string') URL.revokeObjectURL(url)
  }
}

// The merged palette of some images: ["#rrggbb", …], most present first.
export async function readPalette(sources) {
  const images = await Promise.all(sources.slice(0, MAX_BRAND_IMAGES).map((s) => shrink(s)))
  const res = await apiPost('/analyzer/palette', { images })
  return (res.palette ?? []).map((s) => s.hex).slice(0, MAX_PALETTE)
}

// Uploads one file to the new account. Resolves to the stored asset
// (with what andrho-api read from it) or throws with a plain message.
export async function uploadAsset(kind, file) {
  const body = new FormData()
  body.append('kind', kind)
  body.append('file', file, file.name)
  let res
  try {
    res = await fetch(`${API_URL}/account/assets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEYS.access)}` },
      body,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || 'No pudimos subir el archivo.')
  return data.asset
}

// One line about what AndRho understood of an uploaded data file.
export function describeData(asset) {
  const meta = asset?.meta ?? {}
  if (meta.error) return meta.error
  const tables = meta.tables ?? []
  if (!tables.length) return 'Recibido.'
  const parts = tables.map((t) => `${t.rows} ${t.rows === 1 ? 'fila' : 'filas'} de ${t.kind ? t.label.toLowerCase() : 'datos sin identificar'}`)
  const auto = tables.some((t) => t.load)
  return `${parts.join(', ')}. ${auto ? 'Lo pasamos a tu ERP en cuanto esté listo' : 'Un Creator lo pasa a tu ERP'}${auto && tables.some((t) => !t.load) ? '; lo demás lo revisa un Creator' : ''}.`
}

// Valid "#rrggbb" colors, without repeats.
export const cleanPalette = (list) => [...new Set((list ?? []).map((c) => String(c).toLowerCase()).filter((c) => /^#[0-9a-f]{6}$/.test(c)))].slice(0, MAX_PALETTE)
