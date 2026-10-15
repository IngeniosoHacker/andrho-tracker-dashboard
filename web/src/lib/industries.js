// "Software para ___" pages (andrho.com/software-para/<slug>.html): one per
// kind of business, so AndRho shows up when people search, or ask an AI,
// for software for their own trade. Each page answers the search first
// (what software that business needs), then its typical problems, the
// AndRho modules that solve them and an FAQ (FAQPage JSON-LD). Same data
// for the React page (src/industry.jsx) and the static HTML injected for
// crawlers (vite.config.js), like the articles.
//
// Adding one: add it here and copy software-para/restaurantes.html to
// software-para/<slug>.html with the new data-slug.
import { SITE } from './seo.js'

export const INDUSTRIES = [
  {
    slug: 'restaurantes',
    name: 'restaurantes',
    title: 'Software para restaurantes en Guatemala',
    answer:
      'Un restaurante necesita un software que una el punto de venta, la cocina, el inventario de ingredientes y los pedidos en línea, y que con esos datos le diga qué preparar, qué comprar y qué platillo deja ganancia. AndRho lo hace sobre Odoo, software libre, y te lo explica en lenguaje claro.',
    pains: [
      'Ingredientes que se vencen y mermas que nadie mide.',
      'Compras a ciegas: sobra lo que no se vende y falta lo que sí.',
      'Pedidos por WhatsApp, apps de delivery y mesas en lugares distintos.',
      'No saber cuánto cuesta en realidad cada platillo.',
    ],
    modules: ['Punto de venta y pedidos en línea', 'Inventario de ingredientes con vencimientos', 'Costo por receta y mermas', 'Pronóstico de demanda por día', 'Clientes frecuentes y los que dejaron de venir'],
    faq: [
      ['¿Qué software necesita un restaurante pequeño?', 'Un punto de venta que registre cada orden y un inventario conectado a tus recetas. Con eso ya mides ventas, costo por platillo y mermas; lo demás se suma al crecer.'],
      ['¿Funciona en el celular?', 'Sí. AndRho funciona en el navegador del celular, la tablet o la computadora.'],
      ['¿Puedo seguir usando mis apps de delivery?', 'Sí. AndRho se adapta a tu operación: une tus canales de venta en lugar de obligarte a dejarlos.'],
    ],
    article: 'software-para-restaurantes',
  },
  {
    slug: 'tiendas',
    name: 'tiendas y comercios',
    title: 'Software para tiendas y comercios en Guatemala',
    answer:
      'Una tienda necesita un sistema que registre cada venta, descuente el inventario al momento, avise antes de que un producto se agote y muestre qué se vende, qué no y a quién. AndRho une punto de venta, inventario y clientes, y analiza tus números por ti.',
    pains: [
      'Productos agotados justo cuando más se venden.',
      'Mercadería que no rota y ocupa dinero en bodega.',
      'Varias sucursales que reportan en formatos distintos.',
      'Faltantes de producto o de dinero que no se pueden explicar.',
    ],
    modules: ['Punto de venta por sucursal', 'Inventario en tiempo real con alertas', 'Productos sin rotación y promociones sugeridas', 'Clientes y recompra', 'Reportes por sucursal sin esperar a fin de mes'],
    faq: [
      ['¿Cómo controlo el inventario de varias tiendas?', 'Con un sistema donde cada venta descuente existencias en el momento y cada sucursal vea lo mismo. AndRho lo une y te avisa qué reponer en cada una.'],
      ['¿Puedo migrar mis productos desde Excel?', 'Sí. Subes tu archivo, AndRho reconoce las columnas, revisa los errores y los carga a tu sistema.'],
      ['¿Necesito internet todo el tiempo?', 'Para ver tus números en línea, sí; el punto de venta de Odoo puede seguir cobrando si la conexión se cae un momento.'],
    ],
    article: 'que-software-necesita-mi-emprendimiento',
  },
  {
    slug: 'emprendedores',
    name: 'emprendedores',
    title: 'Software para emprendedores en Guatemala',
    answer:
      'Un emprendimiento necesita, desde el primer día, registrar cada venta, gasto y producto en un solo lugar. Al crecer, necesita que ese lugar sea un sistema integrado. AndRho empieza con lo esencial y suma módulos cuando tu negocio los necesita, sin pagar por lo que no usas.',
    pains: [
      'Ventas anotadas en el chat, gastos en fotos y el inventario en la cabeza.',
      'No saber si de verdad se está ganando dinero.',
      'Hacer todo a la vez: vender, cobrar, publicar y empacar.',
      'Miedo a pagar un sistema que queda grande o chico.',
    ],
    modules: ['Panel con tus números en un solo lugar', 'Ventas e inventario conectados', 'Sitio web con medición incluida', 'Análisis que te dice qué hacer', 'Módulos que se activan cuando creces'],
    faq: [
      ['¿Qué software necesito para empezar?', 'Un lugar donde registrar cada venta y gasto todos los días, tu factura electrónica (FEL) y una forma de cobrar. Lo importante es que todo quede en un solo lugar.'],
      ['¿Cuándo necesito un ERP?', 'Cuando cuadrar la información te quita tiempo, aparecen faltantes que no puedes explicar o tienes más de un canal o sucursal.'],
      ['¿AndRho es caro?', 'AndRho es modular: activas lo que necesitas. Durante la beta, todos los paquetes son gratis.'],
    ],
    article: 'que-software-necesita-mi-emprendimiento',
  },
  {
    slug: 'ventas-en-linea',
    name: 'vender en línea',
    title: 'Software para vender en línea y por redes sociales',
    answer:
      'Quien vende por lives, redes, WhatsApp y tienda en línea necesita un sistema que junte todos los pedidos, descuente el inventario al venderse y diga qué canal y qué publicación venden de verdad. AndRho une tus canales, mide cada venta y automatiza lo repetitivo.',
    pains: [
      'Pedidos de un live que se mezclan o se pierden.',
      'Vender lo que ya no hay porque el inventario no se actualizó.',
      'Clientes que preguntan y no reciben respuesta a tiempo.',
      'No saber qué publicación o campaña trae ventas.',
    ],
    modules: ['Pedidos de todos tus canales en un solo listado', 'Inventario que se descuenta con cada venta', 'Tu sitio web con medición', 'Qué canal y qué horario venden más', 'Seguimiento a quien apartó y no pagó'],
    faq: [
      ['¿Cómo evito que se mezclen los pedidos de un live?', 'Capturando cada pedido con su cliente, producto y variante en el momento, en un solo sistema, en lugar de anotarlo a mano.'],
      ['¿Se puede automatizar WhatsApp?', 'Sí, por los canales oficiales de WhatsApp Business: confirmaciones, recordatorios y respuestas frecuentes. La integración de AndRho está en camino.'],
      ['¿Conviene más vender por redes o con tienda en línea?', 'Ambas: las redes atraen y conversan; la tienda convierte a quien ya sabe qué quiere. Lo clave es que alimenten el mismo inventario.'],
    ],
    article: 'ventas-en-linea',
  },
  {
    slug: 'clinicas',
    name: 'clínicas',
    title: 'Software para clínicas y consultorios en Guatemala',
    answer:
      'Una clínica necesita agenda de citas, expediente por paciente, cobros e inventario de insumos conectados, y saber qué servicios sostienen el negocio. AndRho une esa operación y te muestra cómo va, sin cambiar tu forma de atender.',
    pains: [
      'Citas que se pierden o se empalman.',
      'Expedientes en papel o repartidos en varios archivos.',
      'Insumos que se acaban sin aviso.',
      'No saber qué servicio o médico genera más ingreso.',
    ],
    modules: ['Agenda y citas', 'Expediente por paciente', 'Cobros conectados', 'Inventario de insumos', 'Pacientes que no han vuelto a control'],
    faq: [
      ['¿AndRho reemplaza mi sistema de citas?', 'No tiene que hacerlo: se conecta a lo que ya usas. Si no tienes sistema, te da uno.'],
      ['¿Mis datos de pacientes están seguros?', 'Tus datos viven en PostgreSQL, en tu propia base de datos, y nada se comparte sin tu aprobación.'],
      ['¿Puedo verlo desde el celular?', 'Sí, desde cualquier navegador.'],
    ],
    article: 'big-data-para-empresas',
  },
  {
    slug: 'distribuidoras',
    name: 'distribuidoras',
    title: 'Software para distribuidoras y logística en Guatemala',
    answer:
      'Una distribuidora necesita inventario por bodega, pedidos de clientes, rutas de entrega y cobros conectados, y saber qué cliente, ruta y producto dejan margen. AndRho une la operación y analiza cada ruta y cada cliente.',
    pains: [
      'Rutas que se arman a ojo y vueltas de más.',
      'Pedidos por teléfono y WhatsApp que se pierden.',
      'Inventario distinto entre bodega y sistema.',
      'Créditos y cobros que nadie sigue.',
    ],
    modules: ['Inventario por bodega', 'Pedidos y rutas de entrega', 'Clientes y crédito', 'Compras sugeridas a proveedores', 'Margen por cliente, ruta y producto'],
    faq: [
      ['¿AndRho optimiza rutas?', 'AndRho mide tus entregas y te muestra qué rutas cuestan más; la planificación de rutas es uno de sus módulos.'],
      ['¿Puedo migrar mi cartera de clientes?', 'Sí, desde un archivo de Excel o CSV, con revisión antes de cargar.'],
      ['¿Funciona con varias bodegas?', 'Sí. Cada bodega tiene su inventario y lo ves todo junto.'],
    ],
    article: 'big-data-para-empresas',
  },
]

export const findIndustry = (slug) => INDUSTRIES.find((i) => i.slug === slug)
export const industryUrl = (i) => `/software-para/${i.slug}.html`

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function industryHead(i) {
  const url = `${SITE.url}${industryUrl(i)}`
  const title = `${i.title} | AndRho`
  const description = i.answer.length > 160 ? i.answer.slice(0, i.answer.lastIndexOf(' ', 157)) + '…' : i.answer
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: `AndRho para ${i.name}`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url,
        description: i.answer,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'GTQ', description: 'Gratis durante la beta' },
        publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
      },
      {
        '@type': 'FAQPage',
        mainEntity: i.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE.url}/` },
          { '@type': 'ListItem', position: 2, name: i.title, item: url },
        ],
      },
    ],
  }
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta property="og:locale" content="${SITE.locale}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${SITE.ogImage}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n')
}

export function industryHtml(i) {
  return `
<main class="seo-fallback">
  <p><a href="/">AndRho</a></p>
  <h1>${esc(i.title)}</h1>
  <p>${esc(i.answer)}</p>
  <h2>Lo que frena a ${esc(i.name)}</h2>
  <ul>${i.pains.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
  <h2>Lo que AndRho hace por ${esc(i.name)}</h2>
  <ul>${i.modules.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
  <h2>Preguntas frecuentes</h2>
  ${i.faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('\n  ')}
  <p><a href="/signup.html">Continuar</a> · <a href="/articulos/${i.article}.html">Lee más</a></p>
  <p>Otros giros: ${INDUSTRIES.filter((x) => x.slug !== i.slug).map((x) => `<a href="${industryUrl(x)}">${esc(x.title)}</a>`).join(' · ')}</p>
</main>`
}
