import { NAV_LINKS } from '../../lib/landing.js'
import { easeOutBack, mixColor, seg } from '../../lib/motion.js'
import { logo } from '../../lib/assets.js'

// The landing's "taskbar". At morph=0 only the login button exists (top-right of
// the white hero); as the hero folds up (`morph` 0 → 1) the bar's glass
// fades in around it, the hero title lands as the wordmark, the logo pops in
// and the bold hero words land as links (the flying copies live in
// Stage.jsx — this component only owns their final resting place, measured
// through `refs`). Once formed it stays for the rest of the site.
//
// `base` prefixes the section links, so pages other than the landing (e.g.
// waitlist.html, rendered with morph = Infinity) link back into it.
export default function SiteHeader({ morph = Infinity, sky = 1, activeId = null, refs, base = '' }) {
  const formed = morph >= 1
  const bar = seg(morph, 0.62, 1)
  const logoPop = formed ? 1 : Math.max(0, easeOutBack(seg(morph, 0.78, 0.92)))
  const ink = mixColor('#0b1020', '#ffffff', sky)

  return (
    <header className="fixed inset-x-3 top-3 z-50 sm:inset-x-4">
      <nav
        aria-label="Principal"
        className="mx-auto max-w-6xl rounded-2xl border"
        style={{
          color: ink,
          backgroundColor: `rgba(8, 14, 36, ${0.74 * bar})`,
          borderColor: `rgba(255, 255, 255, ${0.12 * bar})`,
          backdropFilter: bar > 0.01 ? `blur(${14 * bar}px)` : 'none',
          WebkitBackdropFilter: bar > 0.01 ? `blur(${14 * bar}px)` : 'none',
          boxShadow: `0 18px 50px -24px rgba(0, 0, 0, ${0.6 * bar})`,
        }}
      >
        <div className="flex flex-wrap items-center gap-x-6 px-4 sm:px-5">
          <a
            href={`${base}#top`}
            aria-label="AndRho — inicio"
            inert={!formed}
            className="order-1 flex h-14 items-center gap-2"
          >
            <span ref={refs?.logo} className="block h-7 w-7">
              <img
                src={logo.mark}
                alt=""
                draggable="false"
                className="h-7 w-7 object-contain"
                style={{ transform: `scale(${logoPop})`, opacity: logoPop > 0.01 ? 1 : 0 }}
              />
            </span>
            <span
              ref={refs?.wordmark}
              className="font-display text-lg font-bold tracking-tight whitespace-nowrap"
              style={{ opacity: formed ? 1 : 0 }}
            >
              AndRho
            </span>
          </a>

          <ul
            inert={morph < 0.9}
            className="order-3 flex h-10 w-full items-center justify-center gap-5 border-t md:order-2 md:h-14 md:w-auto md:flex-1 md:gap-9 md:border-t-0"
            style={{ borderColor: `rgba(255, 255, 255, ${0.08 * bar})` }}
          >
            {NAV_LINKS.map((link) => {
              const active = link.id === activeId
              const opacity = formed ? 1 : link.fromHero ? 0 : seg(morph, 0.84, 1)
              return (
                <li key={link.id} className="relative">
                  <a
                    ref={refs?.links?.[link.id]}
                    href={`${base}#${link.id}`}
                    aria-current={active ? 'true' : undefined}
                    className="block whitespace-nowrap text-sm font-semibold transition-colors hover:text-white"
                    style={{
                      opacity,
                      transform: link.fromHero || formed ? undefined : `translateY(${(1 - opacity) * 6}px)`,
                      color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    {link.label}
                  </a>
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 bg-[var(--mint)] transition-opacity duration-300"
                    style={{ opacity: active ? 1 : 0 }}
                  />
                </li>
              )
            })}
          </ul>

          <a
            href="/login.html"
            className="order-2 ml-auto rounded-full border px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors md:order-3 md:ml-0"
            style={{
              color: ink,
              borderColor: mixColor('#0b1020', '#5b6b8f', sky),
              backgroundColor: `rgba(255, 255, 255, ${0.06 * bar})`,
            }}
          >
            Iniciar sesión
          </a>
        </div>
      </nav>
    </header>
  )
}
