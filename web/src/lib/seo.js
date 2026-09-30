// Single source for the landing's search/AI-search content (SEO + GEO).
//
// The landing is a client-rendered React app, and most AI crawlers (GPTBot,
// ClaudeBot, PerplexityBot...) don't run JavaScript. So besides the meta tags,
// vite.config.js injects into index.html at build time:
//   - JSON-LD (Organization, WebSite, SoftwareApplication, FAQPage)
//   - a static, semantic copy of the page inside #root (replaced by React on
//     load; hidden for JS browsers to avoid a flash, readable by everyone else)
// The visible FAQ (Footer.jsx) reads FAQ from here too, so the FAQPage schema
// always matches what's on the page.
export const SITE = {
  url: 'https://andrho.com',
  name: 'AndRho',
  locale: 'es_GT',
  title: 'AndRho: análisis de datos con IA para pymes en Guatemala',
  description:
    'AndRho unifica los datos de tu ERP y tu marketing, los analiza con modelos estadísticos y la IA te los traduce en decisiones claras. Para pymes en Guatemala.',
  ogImage: 'https://andrho.com/images/og/andrho-og.png',
  instagram: 'https://www.instagram.com/andrho.gt/',
  github: 'https://github.com/IngeniosoHacker/andrho',
}

export const FAQ = [
  {
    q: '¿Qué es AndRho?',
    a: 'AndRho es una plataforma de análisis de datos para pymes en Guatemala. Unifica la información de las distintas áreas de tu empresa — principalmente el ERP y el marketing —, la analiza de forma constante con modelos estadísticos y matemáticos, y usa inteligencia artificial para interpretar los resultados y explicártelos en lenguaje claro.',
  },
  {
    q: '¿Tengo que cambiar mi ERP o los sistemas que ya uso?',
    a: 'No. AndRho se adapta a tu operación: se conecta a las herramientas que ya usas y unifica su información, en lugar de obligarte a migrar a un sistema nuevo.',
  },
  {
    q: '¿Para qué tipo de negocios es AndRho?',
    a: 'Para pequeñas y medianas empresas de Guatemala: comercios y retail, restaurantes, empresas de servicios, manufactura, logística y salud.',
  },
  {
    q: '¿AndRho usa agentes de inteligencia artificial?',
    a: 'No. AndRho no usa agentes autónomos: el análisis lo hacen modelos estadísticos y matemáticos sobre tus datos unificados. La inteligencia artificial se usa para interpretar esos resultados y servirte de traductor, y para hacer cambios visuales dentro del sistema.',
  },
  {
    q: '¿AndRho mide si mi negocio aparece en Google, ChatGPT y otras IA?',
    a: 'Sí. El panel incluye el tráfico de buscadores con sus palabras clave orgánicas y una sección de Visibilidad IA: cuántas veces los rastreadores de IA visitan tu sitio, cuántas visitas llegan desde asistentes como ChatGPT o Perplexity, su tendencia diaria y una meta mensual. También revisa si tu sitio está preparado para buscadores e IA (robots.txt, sitemap, llms.txt, datos estructurados y contenido legible sin JavaScript).',
  },
  {
    q: '¿Cómo empiezo a usar AndRho?',
    a: 'Únete a la lista de espera en andrho.com para asegurar tu lugar antes del lanzamiento, o crea tu cuenta y en un minuto tendrás tu código de seguimiento listo para instalar en tu sitio.',
  },
]

// Business activities cycled in the "Relájate" window ("Encárgate de …").
// The last one is the joke.
export const ACTIVITIES = ['vender', 'construir', 'cocinar', 'diseñar', 'enseñar', 'atender a tus clientes', '¿estafar?']

export function jsonLd() {
  const org = {
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/images/logo/andrho-mark.png`,
    sameAs: [SITE.instagram, SITE.github],
    areaServed: { '@type': 'Country', name: 'Guatemala' },
    description: SITE.description,
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      org,
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        inLanguage: 'es-GT',
        publisher: { '@id': org['@id'] },
      },
      {
        '@type': 'SoftwareApplication',
        name: SITE.name,
        url: SITE.url,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: 'es',
        description: SITE.description,
        featureList: [
          'Unificación de los datos del ERP y del marketing en un solo panel',
          'Análisis constante con modelos estadísticos y matemáticos',
          'Interpretación de resultados en lenguaje claro con inteligencia artificial',
          'Cambios visuales dentro del sistema asistidos por inteligencia artificial',
          'Reportes de ventas, inventarios, marketing y KPIs',
          'Tráfico de buscadores, palabras clave orgánicas y visibilidad en inteligencia artificial',
        ],
        publisher: { '@id': org['@id'] },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
    ],
  }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Plain semantic HTML mirroring the landing's copy, for crawlers without JS.
export function staticLandingHtml() {
  return `
<main class="seo-fallback">
  <h1>AndRho: análisis de datos con inteligencia artificial para pymes en Guatemala</h1>
  <p>Conecta y entiende tu negocio. AndRho es el centro de control que unifica tu ERP, tu marketing y tu equipo, lo analiza con modelos estadísticos y, con inteligencia artificial, te lo traduce en decisiones, no en más pestañas. Así que relájate: la plataforma se adapta a tu operación.</p>
  <p><a href="/signup.html">Crear cuenta</a> · <a href="/waitlist.html">Unirme a la lista de espera</a> · <a href="/login.html">Iniciar sesión</a></p>
  <section>
    <h2>Relájate</h2>
    <p>Encárgate de ${esc(ACTIVITIES.slice(0, -1).join(', '))} mientras la plataforma hace toda la parte complicada.</p>
  </section>
  <section>
    <h2>Cómo funciona AndRho</h2>
    <ol>
      <li><strong>Unifica:</strong> juntamos los datos de tu ERP y de tu marketing (ventas, inventario, sitio web, campañas) en un solo lugar.</li>
      <li><strong>Analiza:</strong> modelos estadísticos y matemáticos revisan tus datos de forma constante para encontrar tendencias, patrones y alertas.</li>
      <li><strong>Entiende:</strong> la inteligencia artificial traduce esos resultados a lenguaje claro: qué se vende, qué falta y qué conviene hacer.</li>
    </ol>
  </section>
  <section>
    <h2>Software que se adapta a tu operación</h2>
    <p>Sincronizar la vida real con el sistema a veces es imposible. Por eso AndRho se adapta a cómo ya trabaja tu negocio, en lugar de obligarte a cambiar.</p>
  </section>
  <section>
    <h2>Que no te deje la nave: lista de espera</h2>
    <p>Estamos por despegar. <a href="/waitlist.html">Únete a la lista de espera de AndRho</a> y asegura tu lugar antes del lanzamiento.</p>
  </section>
  <section>
    <h2>Preguntas frecuentes</h2>
    ${FAQ.map(({ q, a }) => `<h3>${esc(q)}</h3>\n    <p>${esc(a)}</p>`).join('\n    ')}
  </section>
</main>`
}
