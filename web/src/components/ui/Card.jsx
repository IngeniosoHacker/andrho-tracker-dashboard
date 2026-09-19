// A plain, quiet surface: white, thin border, gentle lift + mint border on
// hover (see .card-surface in index.css). No cursor-tracked spotlight — the
// rebrand favors restraint over glow effects.
export default function Card({ className = '', children }) {
  return <div className={`card-surface rounded-2xl ${className}`}>{children}</div>
}
