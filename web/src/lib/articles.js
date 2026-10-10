// Articles (andrho.com/articulos/): SEO content written from AndRho's point
// of view. Each article is data — blocks of text — so the React pages
// (src/articles.jsx, src/article.jsx) and the static HTML that vite.config.js
// injects for crawlers without JavaScript (articleHtml, articlesIndexHtml)
// always say the same thing.
//
// Adding an article: add it to ARTICLES, copy articulos/software-libre.html
// to articulos/<slug>.html with the new data-slug, and list it in
// public/sitemap.xml (vite.config.js picks the page up from ARTICLES).
//
// Blocks: { p }, { h2 }, { h3 }, { ul: [...] }, { ol: [...] }, { quote },
// { table: { head: [...], rows: [[...]] } }. Inline text supports **bold**
// and [links](url).
import { SITE } from './seo.js'

export const ARTICLES = [
  {
    slug: 'software-libre',
    title: 'Software libre: por qué tu empresa no debería alquilar su propio sistema',
    description:
      'El software privativo cobra por permiso, guarda tus datos en formatos que no controlas y puede cambiar las reglas cuando quiera. Por qué AndRho está construido sobre software libre y por qué eso le conviene a tu empresa.',
    date: '2026-10-10',
    author: 'Equipo AndRho',
    readingMinutes: 7,
    tags: ['Software libre', 'Pymes', 'Tecnología'],
    body: [
      {
        p: 'Cuando una empresa elige el software con el que va a administrar su negocio, no solo elige pantallas y botones. Elige quién decide sobre sus datos, cuánto le va a costar crecer y qué pasa el día que quiera irse. Con el software privativo, esas decisiones las toma otro.',
      },
      {
        p: 'AndRho está construido de punta a punta sobre **software libre**. No es una postura romántica: es la forma más sensata de construir algo que una pyme va a usar durante años. Aquí te contamos por qué, y por qué esa misma lógica le conviene a tu empresa.',
      },
      { h2: '¿Qué es el software libre?' },
      {
        p: 'Software libre no significa “gratis”. Significa que quien lo usa tiene cuatro libertades: **usarlo** para lo que quiera, **estudiar** cómo funciona, **modificarlo** para adaptarlo y **compartirlo**. Para que eso sea posible, el código fuente está disponible para cualquiera.',
      },
      {
        p: 'El software privativo es lo contrario: compras (o, cada vez más, alquilas) un permiso para usar un programa que no puedes revisar, no puedes cambiar y no puedes llevarte a otro lado. El producto es la licencia, no la solución.',
      },
      { h2: 'El costo que no aparece en la cotización' },
      {
        p: 'El precio de la licencia es lo que se ve. Lo que no se ve suele ser más caro:',
      },
      {
        ul: [
          '**Precios que no controlas.** El proveedor puede subir la licencia, cobrar por usuario o pasar de pago único a suscripción mensual. Tú solo puedes aceptar o empezar de cero.',
          '**Encierro (vendor lock-in).** Tus datos viven en formatos cerrados y exportarlos completos es difícil, limitado o se cobra aparte. Cuanto más tiempo pasa, más caro es salir.',
          '**Dependencia de un tercero.** Si el proveedor cierra, cambia de dueño o descontinúa el producto, tu operación queda en el aire, sin poder hacer nada al respecto.',
          '**Una caja negra.** No puedes verificar qué hace el programa con tu información, con quién la comparte ni qué tan bien está protegida. Te queda confiar.',
          '**Una multa por crecer.** Con licencias por usuario, cada persona que contratas cuesta más software. El éxito de tu negocio se convierte en la ganancia de tu proveedor.',
        ],
      },
      { h2: 'Lo que gana tu empresa con software libre' },
      { h3: '1. Tus datos son tuyos' },
      {
        p: 'El software libre trabaja con formatos y estándares abiertos. Los datos de AndRho viven en **PostgreSQL**, una base de datos libre que cualquier programador del mundo sabe leer. Si algún día decides irte, tu información se va contigo, completa y legible.',
      },
      { h3: '2. Creces sin pagar más por permiso' },
      {
        p: 'No hay licencias por usuario que multiplicar. Lo que pagas es el servicio —que alguien lo instale, lo mantenga, lo adapte y te dé soporte—, no el derecho a usarlo. Contratar a diez personas más no te cuesta diez licencias más.',
      },
      { h3: '3. Seguridad que se puede comprobar' },
      {
        p: 'Cuando el código es público, miles de personas pueden revisarlo, y los fallos se encuentran y se corrigen a la vista. No tienes que creerle a nadie: cualquiera puede verificar. En el software privativo, la seguridad es una promesa; en el libre, es algo que se audita.',
      },
      { h3: '4. Se adapta a tu operación, no al revés' },
      {
        p: 'Como el código se puede modificar, el sistema se puede ajustar a cómo trabaja tu negocio. Es exactamente lo que hace AndRho: **adaptarse a tu operación** en lugar de obligarte a cambiarla para que encaje en un programa pensado para otra empresa.',
      },
      { h3: '5. Nadie puede secuestrar el proyecto' },
      {
        p: 'En 2024, Redis —una de las bases de datos en memoria más usadas del mundo— cambió su licencia a una que ya no era libre. En pocas semanas, la comunidad y empresas como AWS y Google crearon **Valkey**, una copia libre que siguió adelante bajo la Linux Foundation. En 2025, Redis volvió a ofrecer una licencia libre (AGPLv3). La lección: cuando el código es libre, un cambio de rumbo de una empresa no puede dejar a sus usuarios sin salida.',
      },
      { h3: '6. Talento y comunidad' },
      {
        p: 'Las tecnologías libres son las que se enseñan en las universidades y las que usan los equipos de todo el mundo. Encontrar a alguien que entienda tu sistema es mucho más fácil cuando tu sistema está hecho con herramientas que todos conocen, documentadas en público.',
      },
      { h2: 'Las tecnologías libres sobre las que está construido AndRho' },
      {
        p: 'Cada pieza de AndRho es software libre, mantenido por comunidades enormes y usado por empresas de todos los tamaños:',
      },
      {
        table: {
          head: ['Tecnología', 'Para qué la usamos', 'Licencia'],
          rows: [
            ['Linux', 'El sistema operativo de nuestros servidores', 'GPLv2'],
            ['PostgreSQL', 'La base de datos donde viven tus datos', 'PostgreSQL (libre)'],
            ['Redis', 'Caché y límites de uso', 'AGPLv3 (desde Redis 8)'],
            ['Go y Gin', 'El backend: cuentas, recomendaciones, lista de espera', 'BSD y MIT'],
            ['React y Vite', 'La interfaz que ves en el navegador', 'MIT'],
            ['Tailwind CSS', 'El diseño visual', 'MIT'],
            ['nginx', 'El servidor web que entrega el sitio', 'BSD'],
            ['Odoo Community', 'El ERP que integramos para tu operación', 'LGPLv3'],
          ],
        },
      },
      { h2: '¿Y si algo falla? ¿Quién me da soporte?' },
      {
        p: 'Libre no significa estar solo. Igual que con un sistema privativo, alguien tiene que instalarlo, mantenerlo y responder cuando hay un problema. La diferencia es que con software libre **pagas por ese servicio, no por un permiso**, y si el servicio no te convence puedes cambiar de proveedor sin cambiar de sistema ni perder tus datos. Ese es el papel de AndRho: nosotros operamos la plataforma para que tú te dediques a tu negocio.',
      },
      { h2: 'Seamos honestos' },
      {
        p: 'No todo el software privativo es malo, y hay herramientas muy específicas que todavía no tienen una alternativa libre a la altura. Nuestra recomendación es simple: el **núcleo de tu negocio** —tus datos, tu ERP, tu operación— debería estar sobre software libre. Es lo que más te costaría perder y lo que más caro sería migrar.',
      },
      { h2: 'Cinco preguntas antes de contratar cualquier software' },
      {
        ol: [
          '¿Puedo exportar todos mis datos, completos, en un formato estándar?',
          '¿Qué le pasa a mi operación si el proveedor desaparece o cambia de dueño?',
          '¿Cuánto me va a costar cuando mi equipo sea el doble de grande?',
          '¿Puedo adaptarlo a mi forma de trabajar sin pedirle permiso a nadie?',
          '¿Puedo comprobar qué hace con mis datos?',
        ],
      },
      {
        p: 'Si las respuestas te dejan incómodo, no estás comprando software: estás alquilando tu propio sistema.',
      },
      { h2: 'Así trabajamos en AndRho' },
      {
        p: 'AndRho todavía está en desarrollo, y lo construimos a la vista: nuestro código es público en [GitHub](https://github.com/IngeniosoHacker) y puedes ver [el avance en vivo](/#progreso), commit por commit. Si quieres un sistema que se adapte a tu negocio, que te diga qué está pasando con tus datos y que nunca te encierre, [únete a la lista de espera](/waitlist.html).',
      },
    ],
  },
]

export const articleUrl = (a) => `/articulos/${a.slug}.html`
export const findArticle = (slug) => ARTICLES.find((a) => a.slug === slug)

export const formatDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })

// Inline markup → tokens: { text } | { bold } | { link, href }.
export function inline(text) {
  const tokens = []
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g
  let last = 0
  let m
  while ((m = re.exec(text))) {
    if (m.index > last) tokens.push({ text: text.slice(last, m.index) })
    if (m[1] !== undefined) tokens.push({ bold: m[1] })
    else tokens.push({ link: m[2], href: m[3] })
    last = re.lastIndex
  }
  if (last < text.length) tokens.push({ text: text.slice(last) })
  return tokens
}

// — Static HTML for crawlers (see vite.config.js) —————————————————————

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const inlineHtml = (text) =>
  inline(text)
    .map((t) => (t.bold ? `<strong>${esc(t.bold)}</strong>` : t.link ? `<a href="${esc(t.href)}">${esc(t.link)}</a>` : esc(t.text)))
    .join('')

function blockHtml(b) {
  if (b.p) return `<p>${inlineHtml(b.p)}</p>`
  if (b.h2) return `<h2>${esc(b.h2)}</h2>`
  if (b.h3) return `<h3>${esc(b.h3)}</h3>`
  if (b.quote) return `<blockquote>${inlineHtml(b.quote)}</blockquote>`
  if (b.ul) return `<ul>${b.ul.map((i) => `<li>${inlineHtml(i)}</li>`).join('')}</ul>`
  if (b.ol) return `<ol>${b.ol.map((i) => `<li>${inlineHtml(i)}</li>`).join('')}</ol>`
  if (b.table)
    return `<table><thead><tr>${b.table.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.table.rows
      .map((r) => `<tr>${r.map((c) => `<td>${inlineHtml(c)}</td>`).join('')}</tr>`)
      .join('')}</tbody></table>`
  return ''
}

function headTags({ title, description, url, type, jsonLd }) {
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta property="og:locale" content="${SITE.locale}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${SITE.ogImage}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${SITE.ogImage}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n')
}

const INDEX_TITLE = 'Artículos de AndRho | Tecnología, datos y software libre para pymes'
const INDEX_DESCRIPTION =
  'Guías y opinión del equipo de AndRho sobre tecnología para pymes en Guatemala: datos, software libre, ERP y marketing.'

export function articleHead(a) {
  const url = `${SITE.url}${articleUrl(a)}`
  return headTags({
    title: `${a.title} | AndRho`,
    description: a.description,
    url,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BlogPosting',
          headline: a.title,
          description: a.description,
          datePublished: a.date,
          inLanguage: 'es-GT',
          keywords: a.tags.join(', '),
          mainEntityOfPage: url,
          image: SITE.ogImage,
          author: { '@type': 'Organization', name: a.author, url: SITE.url },
          publisher: { '@type': 'Organization', name: SITE.name, logo: { '@type': 'ImageObject', url: `${SITE.url}/images/logo/andrho-mark.png` } },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE.url}/` },
            { '@type': 'ListItem', position: 2, name: 'Artículos', item: `${SITE.url}/articulos/` },
            { '@type': 'ListItem', position: 3, name: a.title, item: url },
          ],
        },
      ],
    },
  })
}

export function articleHtml(a) {
  return `
<article class="seo-fallback">
  <p><a href="/">AndRho</a> › <a href="/articulos/">Artículos</a></p>
  <h1>${esc(a.title)}</h1>
  <p>${esc(a.author)} · <time datetime="${a.date}">${formatDate(a.date)}</time> · ${a.readingMinutes} min de lectura</p>
  ${a.body.map(blockHtml).join('\n  ')}
</article>`
}

export function articlesIndexHead() {
  return headTags({
    title: INDEX_TITLE,
    description: INDEX_DESCRIPTION,
    url: `${SITE.url}/articulos/`,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Artículos de AndRho',
      url: `${SITE.url}/articulos/`,
      inLanguage: 'es-GT',
      blogPost: ARTICLES.map((a) => ({ '@type': 'BlogPosting', headline: a.title, url: `${SITE.url}${articleUrl(a)}`, datePublished: a.date })),
    },
  })
}

export function articlesIndexHtml() {
  return `
<main class="seo-fallback">
  <h1>Artículos</h1>
  <p>${esc(INDEX_DESCRIPTION)}</p>
  <ul>
    ${ARTICLES.map((a) => `<li><a href="${articleUrl(a)}">${esc(a.title)}</a> — ${esc(a.description)}</li>`).join('\n    ')}
  </ul>
</main>`
}
