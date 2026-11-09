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
    { id: 'base', capabilities: { fel: false, website: false, store: false, full_site: false }, name: 'Base', label: 'Simple', price: 120, tagline: 'Tu negocio en un panel, sin complicarte.',
      includes: ['1 sucursal', '1 usuario', '3 sugerencias de AndRho al mes', 'Soporte: autoservicio'] },
    { id: 'plataforma', capabilities: { fel: true, website: false, store: false, full_site: false }, name: 'Plataforma', label: 'Básico', price: 349, tagline: 'Tus ventas y tus redes, en el mismo lugar.',
      includes: ['1 sucursal', '2 usuarios', 'Factura electrónica FEL', 'Facebook e Instagram', '5 sugerencias de AndRho al mes', 'Soporte por chat'] },
    { id: 'despegue', capabilities: { fel: true, website: false, store: false, full_site: false }, name: 'Despegue', label: 'En crecimiento', price: 750, tagline: 'Lo esencial para dejar de decidir a ciegas.',
      includes: ['3 sucursales', '6 usuarios', 'Factura electrónica FEL', 'Facebook e Instagram', 'WhatsApp: avisos y reportes', '1 tarea de Creators al mes', '10 sugerencias de AndRho al mes', 'Soporte por chat'] },
    { id: 'en_orbita', capabilities: { fel: true, website: true, store: true, full_site: false }, name: 'En órbita', label: 'Pro', price: 1200, tagline: 'Para crecer con cada área conectada.',
      includes: ['6 sucursales', '15 usuarios', 'Factura electrónica FEL', 'Facebook e Instagram', 'WhatsApp: control total, 400 comandos al mes', 'Sitio web con tienda en línea (construcción y mantenimiento)', '2 tareas de Creators al mes', '30 sugerencias de AndRho al mes', 'Soporte por chat + 1 h en vivo'] },
    { id: 'galaxy', capabilities: { fel: true, website: true, store: true, full_site: true }, name: 'Galaxy', label: 'Ilimitado', price: 2990, tagline: 'Tu negocio completo. Nada se queda en tierra.',
      includes: ['Sucursales ilimitadas', 'Usuarios ilimitados', 'Factura electrónica FEL', 'Facebook e Instagram', 'WhatsApp: control total, 1,500 comandos al mes y número propio', 'Sitio pro: tienda, páginas por sucursal y blog (construcción y mantenimiento)', '4 tareas de Creators al mes', 'Sugerencias ilimitadas', 'Soporte por chat + 2 h en vivo'] },
  ],
  site_levels: [
    { id: 'basico', label: 'Sitio web + SEO básico', setup: 1500, monthly: 150,
      detail: 'Tu sitio en <nombre>.web.andrho.com, hecho por Creators y listo para Google.' },
    { id: 'tienda', label: 'Sitio web con tienda en línea', setup: 2500, monthly: 150,
      detail: 'Tu sitio y tu tienda: tus productos se venden en línea y aparecen en Google.' },
    { id: 'pro', label: 'Sitio pro', setup: 4000, monthly: 150,
      detail: 'Tienda, una página por sucursal y por servicio, y blog o landings de Creators.' },
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

// The three kinds of website, for people: a short name and what each one
// adds over the one before (internal/plans/catalog.go: Website, Store,
// FullSite). Prices and the long label stay in the API's site_levels.
export const SITE_KINDS = {
  basico: { name: 'Sitio', adds: ['Tu negocio en <nombre>.web.andrho.com', 'Hecho por Creators', 'SEO básico: sitemap y listo para Google'] },
  tienda: { name: 'Sitio con tienda', adds: ['Todo lo del sitio', 'Tienda en línea: tus productos se venden ahí', 'Tus productos aparecen en Google'] },
  pro: { name: 'Sitio pro', adds: ['Todo lo de la tienda', 'Una página por sucursal y por servicio', 'Blog y landings de Creators'] },
}

// The level a plan includes (0 none, 1 básico, 2 tienda, 3 pro), from its
// capabilities, like plans.IncludedSite in the API.
export function includedSiteRank(plan) {
  const c = plan.capabilities ?? {}
  return c.full_site ? 3 : c.store ? 2 : c.website ? 1 : 0
}

// What each site level costs on a plan (plans.SiteOptions): levels under
// the included one are covered, the included one is free, higher ones cost
// the difference. Returns [{ level, state: 'covered'|'included'|'buy', setup, monthly }].
export function siteOptionsFor(plan, levels) {
  const inc = includedSiteRank(plan)
  const base = inc ? levels[inc - 1] : null
  return levels.map((level, i) => {
    const rank = i + 1
    if (rank < inc) return { level, state: 'covered', setup: 0, monthly: 0 }
    if (rank === inc) return { level, state: 'included', setup: 0, monthly: 0 }
    return {
      level,
      state: 'buy',
      setup: level.setup - (base?.setup ?? 0),
      monthly: level.monthly - (base?.monthly ?? 0),
    }
  })
}
