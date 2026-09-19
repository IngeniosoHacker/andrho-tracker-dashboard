import { logo } from '../../lib/assets.js'

// The mark + wordmark pairing used in the navbar, footer and auth pages. The
// oversized scrambling wordmark in the hero is its own thing (ScrambleLogo) —
// this is the small, static, everyday lockup.
export default function Logo({ withWordmark = true, className = '', markClassName = 'h-7 w-7' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={logo.mark}
        alt="AndRho"
        draggable="false"
        className={`${markClassName} object-contain`}
      />
      {withWordmark && <span className="font-display text-lg font-bold tracking-tight">AndRho</span>}
    </span>
  )
}
