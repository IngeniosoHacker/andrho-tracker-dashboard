// Window view (group "relájate") — the target of Relájate's "Cómo funciona"
// button.
const STEPS = [
  {
    title: 'Unifica',
    body: 'Juntamos los datos de tu ERP y de tu marketing — ventas, inventario, sitio web, campañas — en un solo lugar.',
  },
  {
    title: 'Analiza',
    body: 'Modelos estadísticos y matemáticos revisan tus datos de forma constante para encontrar tendencias, patrones y alertas.',
  },
  {
    title: 'Entiende',
    body: 'La inteligencia artificial traduce esos resultados a lenguaje claro: qué se vende, qué falta y qué conviene hacer.',
  },
]

export default function ComoFunciona() {
  return (
    <div className="p-6 sm:p-10 md:p-12 lg:p-14">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">Cómo funciona AndRho</p>
      <h2
        id="como-funciona-title"
        className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-7xl"
      >
        Tú vendes. <span className="text-[var(--window-teal)]">Nosotros</span> hacemos lo demás.
      </h2>

      <ol className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-3 md:gap-6">
        {STEPS.map((step, i) => (
          <li key={step.title} className="rounded-2xl bg-white/70 p-6 lg:p-8">
            <span className="font-mono text-sm font-bold text-[var(--window-teal)]">0{i + 1}</span>
            <h3 className="mt-3 text-2xl font-extrabold tracking-tight lg:text-3xl">{step.title}</h3>
            <p className="mt-2 leading-snug text-[var(--color-ink-soft)] lg:text-lg">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex max-w-2xl flex-col gap-3 sm:mt-10 sm:flex-row">
        <a href="/signup.html" className="btn-solid sm:flex-1">
          Comenzar
        </a>
        <a href="#ia-con-criterio" className="btn-outline sm:flex-1">
          ¿Y la IA?
        </a>
      </div>
    </div>
  )
}
