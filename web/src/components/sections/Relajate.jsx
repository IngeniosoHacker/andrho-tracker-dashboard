import LiveDemo from '../landing/LiveDemo.jsx'

// Window view, opens the "relájate" group. Since 2026-11-09 it leads with
// live sales (founder/marketing.md): most of December's buyers sell through
// Facebook and Instagram lives. The rest of the site stays for the pymes.
export default function Relajate() {
  return (
    <div className="grid items-center gap-6 p-6 sm:p-10 md:grid-cols-[1fr_1fr] md:gap-12 md:p-14 lg:p-16">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">
          Venta en vivo por Facebook e Instagram
        </p>
        <h2 id="relajate-title" className="mt-3 text-6xl font-extrabold tracking-[-0.045em] text-[var(--window-teal)] sm:text-7xl lg:text-8xl">
          Relájate
        </h2>
        <p className="mt-5 max-w-md text-xl leading-snug sm:text-2xl lg:text-3xl">
          Tú haces el live. AndRho <strong>aparta</strong> con el primer comentario, <strong>confirma</strong> por Messenger y{' '}
          <strong>arma tus envíos</strong>.
        </p>
        <div className="mt-8 flex max-w-sm flex-col gap-3 sm:mt-10">
          <a href="/vende-en-vivo/" className="btn-solid">
            Vende en vivo con AndRho
          </a>
          <a href="#como-funciona" className="btn-outline">
            Cómo funciona
          </a>
        </div>
      </div>
      <LiveDemo className="hidden md:block" />
    </div>
  )
}
