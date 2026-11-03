// One block of the home. Until a Creator writes the real component for a
// section (e.g. src/sections/Menu.jsx for restaurantes' "menu"), this shows
// its title and what goes there.
export default function Section({ section, alt }) {
  return (
    <section id={section.key} className={alt ? 'bg-canvas-soft' : 'bg-white'}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl font-bold">{section.title}</h2>
        <p className="mt-2 text-muted">{section.hint}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      </div>
    </section>
  )
}
