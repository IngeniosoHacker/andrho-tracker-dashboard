import { useEffect, useState } from 'react'
import { apiGet } from './authApi.js'

// The landing's pricing window (components/sections/Precios.jsx).
//
// Prices only live in andrho-api (internal/plans); the landing reads them
// from GET /plans. FALLBACK is a copy for the first paint and for when the
// API can't be reached, so the section never shows empty — keep it in step
// with the catalog (internal/plans/catalog.go, site.go).
const FALLBACK = {
  currency: 'GTQ',
  plans: [
    { id: 'base', name: 'Base', label: 'Simple', price: 120, tagline: 'Tu negocio en un panel, sin complicarte.',
      includes: ['1 sucursal', '1 usuario', '3 sugerencias de AndRho al mes', 'Soporte: autoservicio'] },
    { id: 'plataforma', name: 'Plataforma', label: 'Básico', price: 349, tagline: 'Tus ventas y tus redes, en el mismo lugar.',
      includes: ['1 sucursal', '2 usuarios', 'Facebook e Instagram', '5 sugerencias de AndRho al mes', 'Soporte por chat'] },
    { id: 'despegue', name: 'Despegue', label: 'En crecimiento', price: 750, tagline: 'Lo esencial para dejar de decidir a ciegas.',
      includes: ['3 sucursales', '6 usuarios', 'Facebook e Instagram', 'WhatsApp: avisos y reportes', '1 tarea de Creators al mes', '10 sugerencias de AndRho al mes', 'Soporte por chat'] },
    { id: 'en_orbita', name: 'En órbita', label: 'Pro', price: 1200, tagline: 'Para crecer con cada área conectada.',
      includes: ['6 sucursales', '15 usuarios', 'Facebook e Instagram', 'WhatsApp: control total, 400 comandos al mes', 'Sitio web con tienda en línea (construcción y mantenimiento)', '2 tareas de Creators al mes', '30 sugerencias de AndRho al mes', 'Soporte por chat + 1 h en vivo'] },
    { id: 'galaxy', name: 'Galaxy', label: 'Ilimitado', price: 2990, tagline: 'Tu negocio completo. Nada se queda en tierra.',
      includes: ['Sucursales ilimitadas', 'Usuarios ilimitados', 'Facebook e Instagram', 'WhatsApp: control total, 1,500 comandos al mes y número propio', 'Sitio pro: tienda, páginas por sucursal y blog (construcción y mantenimiento)', '4 tareas de Creators al mes', 'Sugerencias ilimitadas', 'Soporte por chat + 2 h en vivo'] },
  ],
  site_levels: [
    { id: 'basico', label: 'Sitio web + SEO básico', setup: 1500, monthly: 150 },
    { id: 'tienda', label: 'Sitio web con tienda en línea', setup: 2500, monthly: 250 },
    { id: 'pro', label: 'Sitio pro', setup: 4000, monthly: 400 },
  ],
}

// The plan the window highlights: the middle of the catalog, where most
// small businesses land (the signup then recommends the one each business
// can actually sustain).
export const HIGHLIGHT = 'despegue'

export const money = (n) => `Q${Number(n).toLocaleString('en-US')}`

let cached = null

// { plans, site_levels } — the fallback right away, the API's once it answers.
export function usePricing() {
  const [data, setData] = useState(cached ?? FALLBACK)
  useEffect(() => {
    if (cached) return
    let alive = true
    apiGet('/plans')
      .then((d) => {
        if (!d?.plans?.length) return
        cached = { ...FALLBACK, ...d, site_levels: d.site_levels?.length ? d.site_levels : FALLBACK.site_levels }
        if (alive) setData(cached)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return data
}
