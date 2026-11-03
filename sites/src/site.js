// The business this site is for. The sites service injects it as
// window.__SITE__ (from andrho-api's GET /public/site). In `npm run dev`
// there's no server, so a sample stands in; ?tipo=servicios|restaurantes|ventas
// switches it and ?vista=inicio previews the full template.
const SAMPLE = {
  servicios: {
    company: 'Plomería Rápida', type_name: 'Servicios', essence: 'Reparaciones el mismo día en toda la ciudad.',
    site: {
      headline: 'Tu servicio, en tu zona, cuando lo necesitas', cta: 'Pide tu cotización',
      sections: [
        { key: 'servicios', title: 'Lo que hacemos', hint: 'Cada servicio con una frase y su precio desde' },
        { key: 'zona', title: 'Dónde trabajamos', hint: 'Colonias, zonas o municipios que cubres' },
        { key: 'proceso', title: 'Cómo trabajamos', hint: 'De la llamada al trabajo terminado, en 3 pasos' },
        { key: 'contacto', title: 'Cotiza por WhatsApp', hint: 'Botón directo y horario de atención' }
      ]
    }
  },
  restaurantes: {
    company: 'Comedor Doña Ana', type_name: 'Restaurantes', essence: 'Comida casera, como en casa.',
    site: {
      headline: 'Ven a probarlo o pídelo a domicilio', cta: 'Haz tu pedido',
      sections: [
        { key: 'menu', title: 'Menú', hint: 'Platillos con foto, descripción corta y precio' },
        { key: 'horario', title: 'Horario y ubicación', hint: 'Mapa, horario por día y parqueo' },
        { key: 'pedidos', title: 'Pedidos a domicilio', hint: 'WhatsApp o plataformas de entrega' }
      ]
    }
  },
  ventas: {
    company: 'Ferretería El Clavo', type_name: 'Ventas', essence: '',
    site: {
      headline: 'Lo que buscas, con entrega a tu puerta', cta: 'Ver catálogo',
      sections: [
        { key: 'catalogo', title: 'Productos destacados', hint: 'Los más vendidos, con foto y precio' },
        { key: 'envios', title: 'Envíos', hint: 'Zonas, tiempos y costo de entrega' },
        { key: 'pagos', title: 'Formas de pago', hint: 'Efectivo, tarjeta, transferencia' }
      ]
    }
  }
}

const params = new URLSearchParams(window.location.search)

export const site = window.__SITE__ || Object.assign(
  { site_id: 'demo', status: 'construyendo', has_logo: false },
  SAMPLE[params.get('tipo')] || SAMPLE.servicios
)

// The whole template (for Creators) vs. the "en construcción" page.
export const view = params.get('vista') === 'inicio' ? 'inicio' : (site.status === 'construyendo' ? 'construyendo' : 'inicio')

// The general structure when the business has no type yet.
export const sections = (site.site && site.site.sections && site.site.sections.length) ? site.site.sections : [
  { key: 'nosotros', title: 'Quiénes somos', hint: 'Lo que hace el negocio y para quién' },
  { key: 'oferta', title: 'Lo que ofrecemos', hint: 'Productos o servicios principales' },
  { key: 'contacto', title: 'Contacto', hint: 'WhatsApp, ubicación y horario' }
]
