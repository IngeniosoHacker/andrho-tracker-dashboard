// The business' logo (served same-origin by the sites service at /logo), or
// its initials in the brand gradient when it has none.
export default function Logo({ site, size = 64 }) {
  const initials = (site.company || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
  if (site.has_logo) {
    return <img src="/logo" alt={`Logo de ${site.company}`} width={size} height={size} className="rounded-2xl object-contain bg-white" style={{ width: size, height: size }} />
  }
  return (
    <div aria-hidden="true" className="rounded-2xl grid place-items-center font-display font-bold text-ink"
      style={{ width: size, height: size, fontSize: size * 0.38, background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-2))' }}>
      {initials}
    </div>
  )
}
