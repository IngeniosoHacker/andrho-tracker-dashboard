// The business survey behind the signup's custom setup (signup.html),
// built from waitinglist.md (it started as the waitlist's survey): one
// question per screen, grouped as a sales story — who you are, where you
// show up, how you run things today (and what hurts), where you want to go.
// buildSubmission() turns the answers into the keys andrho-api's Analyzer
// (POST /analyzer) and POST /auth/register read.
//
// Steps adapt to earlier answers: `when` hides a whole step, and `title`,
// `options`, `note` and `verdict` may be functions of (answers, ctx), where
// ctx = { recommendation } — see resolveStep.
//
// Every step can return a `verdict` — the big message shown between slides.
// `good` answers get reassurance, answers with room to improve get a light
// nudge of loss aversion ("lo que no se mide, se pierde").

export const SECTORS = [
  { value: 'comercio', label: 'Comercio / Retail' },
  { value: 'restaurantes', label: 'Restaurantes y cafés' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'manufactura', label: 'Manufactura' },
  { value: 'logistica', label: 'Logística y transporte' },
  { value: 'salud', label: 'Salud' },
  { value: 'otro', label: 'Otro' },
]

export const COMPANY_SIZES = [
  { value: 'solo', label: 'Solo yo' },
  { value: '1-10', label: '2 a 10 personas' },
  { value: '11-50', label: '11 a 50 personas' },
  { value: '51-200', label: '51 a 200 personas' },
  { value: '200+', label: 'Más de 200 personas' },
]

const SALES_METHODS = [
  { value: 'tienda', label: 'Tienda o local físico' },
  { value: 'en_linea', label: 'Tienda en línea' },
  { value: 'redes', label: 'Redes sociales y WhatsApp' },
  { value: 'domicilio', label: 'A domicilio' },
  { value: 'mayoreo', label: 'Mayoreo o distribuidores' },
  { value: 'pedido', label: 'Por pedido o cotización' },
  { value: 'credito', label: 'Al crédito' },
  { value: 'ruta', label: 'Vendedores en ruta o visitas' },
]

const SOCIAL_NETWORKS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'ninguna', label: 'Ninguna todavía', exclusive: true },
]

const MESSAGING_APPS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'whatsapp_business', label: 'WhatsApp Business' },
  { value: 'messenger', label: 'Messenger' },
  { value: 'instagram_dm', label: 'Mensajes de Instagram' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'correo', label: 'Correo' },
  { value: 'llamadas', label: 'Llamadas y SMS' },
  { value: 'ninguna', label: 'Ninguna', exclusive: true },
]

const MANAGEMENT = [
  { value: 'papel', label: 'Papel y cuaderno' },
  { value: 'excel', label: 'Excel u hojas de cálculo' },
  { value: 'software', label: 'Un programa', description: 'Contable, punto de venta, facturación…' },
  { value: 'erp', label: 'Un ERP', description: 'Odoo, SAP, Microsip…' },
  { value: 'varias', label: 'Varias apps sueltas' },
  { value: 'nada', label: 'Nada formal', description: 'Todo está en mi cabeza' },
]
const USES_SOFTWARE = ['software', 'erp', 'varias']
const NO_SYSTEM = ['papel', 'nada']

// Complaints about "my system" only make sense to someone who has one, and
// "I don't use any system" only to someone who doesn't.
function painPointOptions(a) {
  const hasTool = a.management !== '' && !NO_SYSTEM.includes(a.management)
  return PAIN_POINTS.filter((o) => o.software === undefined || o.software === hasTool)
}

const PAIN_POINTS = [
  { value: 'datos_dispersos', label: 'Mi información está regada en muchos lados' },
  { value: 'no_me_dice', label: 'Tengo datos, pero no sé qué hacer con ellos' },
  { value: 'reportes_tarde', label: 'Los reportes llegan tarde o nunca' },
  { value: 'dificil', label: 'Mi sistema es difícil de usar', software: true },
  { value: 'caro', label: 'Mi sistema es caro para lo que me da', software: true },
  { value: 'no_conecta', label: 'Mi sistema no se conecta con mis redes ni mi web', software: true },
  { value: 'pierdo_control', label: 'Pierdo el control del inventario o del dinero' },
  { value: 'soporte', label: 'El soporte de mi sistema es lento', software: true },
  { value: 'sin_sistema', label: 'Todavía no uso ningún sistema', software: false },
]

export const MODULES = [
  { value: 'finanzas', label: 'Finanzas y contabilidad' },
  { value: 'ventas', label: 'Ventas y punto de venta' },
  { value: 'inventario', label: 'Inventario' },
  { value: 'marketing', label: 'Marketing y redes' },
  { value: 'clientes', label: 'Clientes (CRM)' },
  { value: 'compras', label: 'Compras y proveedores' },
  { value: 'produccion', label: 'Producción' },
  { value: 'logistica', label: 'Envíos y rutas' },
  { value: 'rrhh', label: 'Personal y planilla' },
  { value: 'sitio_web', label: 'Sitio web' },
]

const EXPECTATIONS = [
  { value: 'mas_clientes', label: 'Más clientes' },
  { value: 'vender_mas', label: 'Vender más' },
  { value: 'organizarse', label: 'Organizarme mejor' },
  { value: 'digitalizarse', label: 'Digitalizarme' },
  { value: 'automatizar', label: 'Automatizar' },
  { value: 'decidir_mejor', label: 'Decidir con datos, no con corazonadas' },
  { value: 'reducir_perdidas', label: 'Reducir pérdidas' },
  { value: 'mas_vistas', label: 'Más vistas en redes' },
  { value: 'mas_seguidores', label: 'Más seguidores' },
]

const PLANS = [
  { value: 'basico', label: 'Lo esencial', description: 'Un panel con los datos de mi negocio.' },
  { value: 'crecer', label: 'Crecer', description: 'Ventas, marketing y redes conectados y analizados.' },
  {
    value: 'todo',
    label: 'Todo mi negocio',
    description: 'Todas las áreas en una sola cuenta, con Creators a mi disposición.',
  },
]
const PLAN_RANK = { basico: 0, crecer: 1, todo: 2 }

const SATISFACTION = [
  { value: 1, label: 'Nada' },
  { value: 2, label: 'Poco' },
  { value: 3, label: 'Más o menos' },
  { value: 4, label: 'Bastante' },
  { value: 5, label: 'Totalmente' },
]

// Sector-specific questions, stored in `sectorAnswers` under "<sector>.<key>"
// (restaurants' expiry control keeps its own column, `restaurantExpiry`).
// `tone` per option drives the verdict message.
const SECTOR_QUESTIONS = [
  {
    sector: 'restaurantes',
    field: 'restaurantExpiry',
    art: 'scan',
    title: '¿Cómo controlas las fechas de vencimiento de tus productos?',
    options: [
      { value: 'sistema', label: 'Un sistema me avisa', tone: 'good' },
      { value: 'a_mano', label: 'Lo reviso a mano o en una lista' },
      { value: 'peps', label: 'Primero que entra, primero que sale', description: 'Sin llevar registro' },
      { value: 'no_controlo', label: 'No lo controlo' },
    ],
    good: 'Así se cuida un negocio.',
    warn: 'Cada producto vencido es dinero a la basura.',
  },
  {
    sector: 'restaurantes',
    key: 'restaurantes.pedidos',
    multi: true,
    art: 'channels',
    title: '¿Por dónde te llegan los pedidos?',
    options: [
      { value: 'mesa', label: 'En mesa' },
      { value: 'para_llevar', label: 'Para llevar' },
      { value: 'apps_delivery', label: 'Apps de delivery' },
      { value: 'whatsapp', label: 'WhatsApp o teléfono' },
      { value: 'eventos', label: 'Eventos y catering' },
    ],
    neutral: 'Cada pedido deja una huella. Nosotros la leemos.',
  },
  {
    sector: 'comercio',
    key: 'comercio.inventario',
    art: 'scan',
    title: '¿Cómo sabes cuánto inventario tienes?',
    options: [
      { value: 'sistema', label: 'Un sistema actualizado al día', tone: 'good' },
      { value: 'conteo', label: 'Conteos a mano cada cierto tiempo' },
      { value: 'a_ojo', label: 'A ojo' },
      { value: 'no_se', label: 'La verdad, no lo sé' },
    ],
    good: 'Vas un paso adelante.',
    warn: 'Lo que no ves en bodega, lo pierdes en caja.',
  },
  {
    sector: 'servicios',
    key: 'servicios.seguimiento',
    art: 'channels',
    title: '¿Cómo agendas y das seguimiento a tus clientes?',
    options: [
      { value: 'crm', label: 'Con un software o CRM', tone: 'good' },
      { value: 'calendario', label: 'Calendario del teléfono o Google' },
      { value: 'whatsapp', label: 'Por WhatsApp y de memoria' },
      { value: 'cuaderno', label: 'En un cuaderno' },
    ],
    good: 'Bien. Ahora que trabaje por ti.',
    warn: 'Un cliente olvidado es un cliente de tu competencia.',
  },
  {
    sector: 'manufactura',
    key: 'manufactura.produccion',
    art: 'scan',
    title: '¿Cómo planificas tu producción?',
    options: [
      { value: 'sistema', label: 'Según pedidos, con un sistema', tone: 'good' },
      { value: 'hojas', label: 'En hojas de cálculo' },
      { value: 'experiencia', label: 'Por experiencia' },
      { value: 'sobre_la_marcha', label: 'Sobre la marcha' },
    ],
    good: 'Así se produce sin sustos.',
    warn: 'Producir a ciegas sale caro.',
  },
  {
    sector: 'logistica',
    key: 'logistica.seguimiento',
    art: 'scan',
    title: '¿Cómo das seguimiento a tus envíos?',
    options: [
      { value: 'gps', label: 'GPS o software de rutas', tone: 'good' },
      { value: 'llamadas', label: 'Llamadas y WhatsApp' },
      { value: 'papel', label: 'Hoja de ruta en papel' },
      { value: 'ninguno', label: 'No damos seguimiento' },
    ],
    good: 'Cada kilómetro, bajo control.',
    warn: 'Un envío sin rastro es un cliente sin paciencia.',
  },
  {
    sector: 'salud',
    key: 'salud.expedientes',
    art: 'scan',
    title: '¿Dónde llevas las citas y los expedientes?',
    options: [
      { value: 'sistema', label: 'En un sistema clínico', tone: 'good' },
      { value: 'excel', label: 'En Excel' },
      { value: 'papel', label: 'En papel y archivo' },
      { value: 'mezcla', label: 'Un poco de todo' },
    ],
    good: 'Tus pacientes están en buenas manos.',
    warn: 'Un expediente perdido no se recupera.',
  },
  {
    sector: 'otro',
    key: 'otro.descripcion',
    kind: 'text',
    art: 'orbit',
    title: 'Cuéntanos en una línea a qué se dedica tu negocio.',
    placeholder: 'Ej.: Vendemos repuestos para motos en Mixco',
    neutral: 'Ningún negocio es demasiado raro para AndRho.',
  },
]

// Sectors where merchandise can go unsold (waitinglist.md: does it get lost or
// turned into another product?).
const UNSOLD_SECTORS = ['comercio', 'restaurantes', 'manufactura']

const has = (list, ...values) => values.some((v) => list.includes(v))
const pick = (options, value) => options.find((o) => o.value === value)

function sectorStep(q) {
  const field = q.field ?? null
  const get = (a) => (field ? a[field] : (a.sectorAnswers[q.key] ?? (q.multi ? [] : '')))
  return {
    id: field ?? q.key,
    group: 'Tu operación',
    art: q.art,
    title: q.title,
    kind: q.kind ?? (q.multi ? 'multi' : 'single'),
    options: q.options,
    placeholder: q.placeholder,
    when: (a) => a.sectors.includes(q.sector),
    get,
    set: (a, value) => (field ? { ...a, [field]: value } : { ...a, sectorAnswers: { ...a.sectorAnswers, [q.key]: value } }),
    valid: (a) => (q.multi ? get(a).length > 0 : String(get(a)).trim() !== ''),
    verdict: (a) => {
      if (q.neutral) return { tone: 'neutral', text: q.neutral }
      return pick(q.options, get(a))?.tone === 'good' ? { tone: 'good', text: q.good } : { tone: 'warn', text: q.warn }
    },
  }
}

// Plain field accessors for the common case.
const field = (name) => ({ get: (a) => a[name], set: (a, value) => ({ ...a, [name]: value }) })

export const STEPS = [
  // — Who you are
  {
    id: 'sectors',
    group: 'Tu negocio',
    art: 'orbit',
    title: '¿De qué es tu empresa?',
    hint: 'Elige todas las que apliquen.',
    kind: 'multi',
    options: SECTORS,
    ...field('sectors'),
    valid: (a) => a.sectors.length > 0,
    verdict: () => ({ tone: 'neutral', text: 'Cada negocio es distinto. AndRho se adapta al tuyo.' }),
  },
  {
    id: 'companySize',
    group: 'Tu negocio',
    art: 'crew',
    title: '¿Cuántas personas trabajan contigo?',
    kind: 'single',
    options: COMPANY_SIZES,
    ...field('companySize'),
    valid: (a) => a.companySize !== '',
    verdict: (a) =>
      has(['solo', '1-10'], a.companySize)
        ? { tone: 'good', text: 'Los grandes también empezaron pequeños.' }
        : a.companySize === '11-50'
          ? { tone: 'good', text: 'Creciste. Ahora tu negocio necesita ver más lejos.' }
          : { tone: 'warn', text: 'A esta escala, decidir a ciegas sale caro.' },
  },
  {
    id: 'salesMethods',
    group: 'Tu negocio',
    art: 'channels',
    title: '¿Cómo vendes?',
    hint: 'Elige todas las que apliquen.',
    kind: 'multi',
    options: SALES_METHODS,
    ...field('salesMethods'),
    valid: (a) => a.salesMethods.length > 0,
    verdict: (a) =>
      has(a.salesMethods, 'en_linea', 'redes')
        ? { tone: 'good', text: 'Más canales, más datos. Más oportunidades.' }
        : { tone: 'warn', text: 'Tus clientes ya compran en línea. ¿Contigo o con otro?' },
  },

  // — Sector-specific
  ...SECTOR_QUESTIONS.map(sectorStep),
  {
    id: 'unsoldHandling',
    group: 'Tu operación',
    art: 'scan',
    title: '¿Qué pasa con lo que no se vende?',
    kind: 'single',
    options: [
      { value: 'se_pierde', label: 'Se pierde o se bota' },
      { value: 'se_transforma', label: 'Se transforma en otro producto' },
      { value: 'descuento', label: 'Se vende con descuento' },
      { value: 'se_dona', label: 'Se regala o se dona' },
      { value: 'bodega', label: 'Se queda en bodega' },
      { value: 'no_pasa', label: 'Casi no nos pasa' },
    ],
    when: (a) => has(a.sectors, ...UNSOLD_SECTORS),
    ...field('unsoldHandling'),
    valid: (a) => a.unsoldHandling !== '',
    verdict: (a) =>
      has(['se_pierde', 'bodega'], a.unsoldHandling)
        ? { tone: 'warn', text: 'Lo que no se mide, se pierde.' }
        : { tone: 'good', text: 'Nada se pierde. Todo se transforma.' },
  },

  // — Where you show up
  {
    id: 'hasWebsite',
    group: 'Tu presencia',
    art: 'beacon',
    title: '¿Tu negocio tiene página web?',
    kind: 'website',
    options: [
      { value: 'si', label: 'Sí' },
      { value: 'no', label: 'Todavía no' },
    ],
    ...field('hasWebsite'),
    valid: (a) => a.hasWebsite !== '',
    verdict: (a) =>
      a.hasWebsite === 'si'
        ? { tone: 'good', text: 'Bien. Ahora hagamos que venda.' }
        : { tone: 'warn', text: 'Si no te encuentran a ti, encuentran a otro.' },
  },
  {
    id: 'socialNetworks',
    group: 'Tu presencia',
    art: 'beacon',
    title: '¿Tienes página en Meta o TikTok?',
    hint: 'Elige todas las que tengas.',
    kind: 'multi',
    options: SOCIAL_NETWORKS,
    note: (a) =>
      a.socialNetworks.includes('ninguna')
        ? 'No pasa nada: las creamos desde AndRho.'
        : a.socialNetworks.length
          ? 'Las vinculamos a tu cuenta de AndRho para medirlas junto a tus ventas.'
          : '',
    ...field('socialNetworks'),
    valid: (a) => a.socialNetworks.length > 0,
    verdict: (a) =>
      a.socialNetworks.includes('ninguna')
        ? { tone: 'warn', text: 'Si no te ven, no existes.' }
        : { tone: 'good', text: 'Tu audiencia ya está ahí. Falta escucharla.' },
  },
  {
    id: 'messagingApps',
    group: 'Tu presencia',
    art: 'channels',
    title: '¿Qué apps de mensajería usas con tus clientes?',
    hint: 'Elige todas las que apliquen.',
    kind: 'multi',
    options: MESSAGING_APPS,
    ...field('messagingApps'),
    valid: (a) => a.messagingApps.length > 0,
    verdict: () => ({ tone: 'neutral', text: 'Cada mensaje es una venta esperando respuesta.' }),
  },

  // — How you run it today, and what hurts
  {
    id: 'management',
    group: 'Tu operación',
    art: 'paper',
    title: '¿Con qué administras tu negocio hoy?',
    kind: 'single',
    options: MANAGEMENT,
    ...field('management'),
    valid: (a) => a.management !== '',
    verdict: (a) =>
      NO_SYSTEM.includes(a.management)
        ? { tone: 'warn', text: 'Nuestra interfaz parece un juego… pero no lo es.' }
        : a.management === 'excel'
          ? { tone: 'warn', text: 'Tus datos ya existen. Falta que hablen.' }
          : { tone: 'good', text: 'Tienes la base. Nosotros le damos sentido.' },
  },
  {
    id: 'currentSoftware',
    group: 'Tu operación',
    art: 'paper',
    title: '¿Cuál o cuáles usas?',
    hint: 'Opcional, pero nos ayuda a conectarlo.',
    kind: 'text',
    placeholder: 'Ej.: Odoo, QuickBooks, un punto de venta…',
    optional: true,
    when: (a) => USES_SOFTWARE.includes(a.management),
    ...field('currentSoftware'),
    valid: () => true,
    verdict: () => ({ tone: 'neutral', text: 'No tienes que tirar nada. Lo conectamos.' }),
  },
  {
    id: 'satisfaction',
    group: 'Tu operación',
    art: 'gauge',
    // Nothing to rate without a system (paper or "all in my head").
    when: (a) => !NO_SYSTEM.includes(a.management),
    title: (a) =>
      a.management === 'excel'
        ? '¿Qué tan satisfecho estás con tus hojas de cálculo?'
        : '¿Qué tan satisfecho estás con tu software actual?',
    kind: 'rating',
    options: SATISFACTION,
    ...field('satisfaction'),
    valid: (a) => a.satisfaction > 0,
    verdict: (a) =>
      a.satisfaction <= 2
        ? { tone: 'warn', text: 'Mereces algo mejor.' }
        : a.satisfaction === 3
          ? { tone: 'warn', text: '«Más o menos» no hace crecer un negocio.' }
          : { tone: 'good', text: 'Imagina lo que viene.' },
  },
  {
    id: 'satisfactionReason',
    group: 'Tu operación',
    art: 'gauge',
    when: (a) => !NO_SYSTEM.includes(a.management),
    title: '¿Por qué?',
    hint: 'Lo bueno y lo malo. Lo leemos todo.',
    kind: 'textarea',
    placeholder: 'Ej.: Sirve para facturar, pero no me dice cómo voy…',
    ...field('satisfactionReason'),
    valid: (a) => a.satisfactionReason.trim().length > 1,
    verdict: () => ({ tone: 'neutral', text: 'Te escuchamos. De verdad.' }),
  },
  {
    id: 'painPoints',
    group: 'Tu operación',
    art: 'tangle',
    title: '¿Qué es lo que más te frena hoy?',
    hint: 'Elige todas las que apliquen.',
    kind: 'multi',
    options: painPointOptions,
    ...field('painPoints'),
    valid: (a) => a.painPoints.length > 0,
    verdict: () => ({ tone: 'good', text: 'Ese problema tiene los días contados.' }),
  },
  {
    id: 'improvement',
    group: 'Tu operación',
    art: 'tangle',
    title: 'Si pudieras mejorar una sola cosa de tu negocio, ¿cuál sería?',
    hint: 'En una frase corta.',
    kind: 'text',
    maxLength: 70,
    placeholder: 'Ej.: Saber qué me deja más ganancia',
    ...field('improvement'),
    valid: (a) => a.improvement.trim().length > 1,
    verdict: () => ({ tone: 'good', text: 'Anotado. Ya está en el plan de vuelo.' }),
  },

  // — Where you want to go
  {
    id: 'modules',
    group: 'Tu destino',
    art: 'puzzle',
    title: '¿Qué áreas quieres que AndRho cubra?',
    hint: 'AndRho cubre toda la operación. Elige todas las que quieras.',
    kind: 'multi',
    options: MODULES,
    ...field('modules'),
    valid: (a) => a.modules.length > 0,
    verdict: (a) =>
      a.modules.length >= 4
        ? { tone: 'good', text: 'Todo conectado. Así se gana.' }
        : { tone: 'warn', text: 'Un negocio es un sistema. Las piezas sueltas se rompen.' },
  },
  {
    id: 'expectations',
    group: 'Tu destino',
    art: 'target',
    title: '¿Qué esperas de AndRho?',
    hint: 'Elige hasta 3.',
    kind: 'multi',
    max: 3,
    options: EXPECTATIONS,
    ...field('expectations'),
    valid: (a) => a.expectations.length > 0,
    verdict: () => ({ tone: 'good', text: 'Destino fijado.' }),
  },
  {
    id: 'planInterest',
    group: 'Tu destino',
    art: 'fleet',
    title: '¿Hasta dónde quieres llegar con AndRho?',
    kind: 'single',
    // The badge goes on the plan the API matched to the answers so far.
    options: (a, { recommendation }) =>
      PLANS.map((p) => (p.value === recommendation?.plan ? { ...p, badge: 'Recomendado para ti' } : p)),
    note: (a, { recommendation }) =>
      recommendation?.reasons?.length ? `Por lo que nos contaste: ${recommendation.reasons.join(' ')}` : '',
    ...field('planInterest'),
    valid: (a) => a.planInterest !== '',
    // At or above the recommendation: reassurance. Below it: the dinosaur.
    verdict: (a, { recommendation }) => {
      const target = PLAN_RANK[recommendation?.plan ?? 'todo']
      const picked = PLAN_RANK[a.planInterest]
      if (picked < target) return { tone: 'warn', text: 'El dinosaurio también creyó que tenía tiempo.' }
      return a.planInterest === 'todo'
        ? { tone: 'good', text: 'Tus hijos te lo agradecerán.' }
        : { tone: 'good', text: 'Justo lo que tu negocio necesita.' }
    },
  },

  // — Boarding
  {
    id: 'contact',
    group: 'Abordaje',
    art: 'boarding',
    title: 'Último paso: tu pase de abordaje',
    hint: 'Te avisamos antes del despegue. Nada de spam.',
    kind: 'contact',
    valid: (a) => a.name.trim() !== '' && a.company.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim()),
  },
]

export const INITIAL_ANSWERS = {
  sectors: [],
  companySize: '',
  salesMethods: [],
  sectorAnswers: {},
  restaurantExpiry: '',
  unsoldHandling: '',
  hasWebsite: '',
  websiteUrl: '',
  socialNetworks: [],
  messagingApps: [],
  management: '',
  currentSoftware: '',
  satisfaction: 0,
  satisfactionReason: '',
  painPoints: [],
  improvement: '',
  modules: [],
  expectations: [],
  planInterest: '',
  name: '',
  company: '',
  email: '',
  phone: '',
}

// The steps that apply to these answers (sector questions etc. come and go).
export const activeSteps = (answers) => STEPS.filter((s) => !s.when || s.when(answers))

// A step with its answer-dependent parts (title, options, note) worked out.
export function resolveStep(step, answers, ctx) {
  const at = (v) => (typeof v === 'function' ? v(answers, ctx) : v)
  return { ...step, title: at(step.title), options: at(step.options), note: at(step.note) ?? '' }
}

// Toggle `value` in a multi-select list: exclusive options ("ninguna") clear
// the rest, picking anything else clears them; `max` caps the selection.
export function toggleOption(list, option, options, max) {
  if (list.includes(option.value)) return list.filter((v) => v !== option.value)
  if (option.exclusive) return [option.value]
  const exclusive = options.filter((o) => o.exclusive).map((o) => o.value)
  const next = list.filter((v) => !exclusive.includes(v))
  if (max && next.length >= max) return next
  return [...next, option.value]
}

// Answers to questions that no longer apply (a sector picked, answered, then
// unpicked) are dropped. Multi-select sector answers are sent as
// comma-separated strings (sectorAnswers is a flat string map on the API side).
export function buildSubmission(a) {
  const sectorAnswers = Object.fromEntries(
    Object.entries(a.sectorAnswers)
      .filter(([k]) => a.sectors.includes(k.split('.')[0]))
      .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : String(v)]),
  )
  const clean = {
    ...a,
    sectorAnswers,
    restaurantExpiry: a.sectors.includes('restaurantes') ? a.restaurantExpiry : '',
    unsoldHandling: has(a.sectors, ...UNSOLD_SECTORS) ? a.unsoldHandling : '',
    websiteUrl: a.hasWebsite === 'si' ? a.websiteUrl : '',
    currentSoftware: USES_SOFTWARE.includes(a.management) ? a.currentSoftware : '',
    satisfaction: NO_SYSTEM.includes(a.management) ? 0 : a.satisfaction,
    satisfactionReason: NO_SYSTEM.includes(a.management) ? '' : a.satisfactionReason,
    painPoints: a.painPoints.filter((v) => painPointOptions(a).some((o) => o.value === v)),
  }
  return clean
}
