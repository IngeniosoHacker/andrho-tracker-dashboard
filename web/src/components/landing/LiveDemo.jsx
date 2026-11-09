// How a live sale goes with AndRho, drawn (not a screenshot): a buyer
// comments the item's name, the Page answers in Messenger with Sí/No, and
// the item is set aside. Used by the "relájate" window and /vende-en-vivo/.
// Fixed light colors: it's a phone screen, the same on the dark glass.
export default function LiveDemo({ className = '' }) {
  return (
    <div className={`mx-auto w-full max-w-sm select-none ${className}`} aria-hidden="true">
      <div className="rounded-[1.6rem] border border-black/10 bg-white p-3 text-[#0b1020] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between px-1">
          <span className="rounded-md bg-[#e11d48] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">● En vivo</span>
          <span className="font-mono text-[10px] text-[#64748b]">tu Página</span>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="rounded-xl bg-black/[0.05] px-3 py-2"><strong>Ana</strong> blusa roja 2</li>
          <li className="rounded-xl bg-black/[0.05] px-3 py-2"><strong>Luis</strong> la 2!!</li>
          <li className="rounded-xl bg-black/[0.05] px-3 py-2 opacity-70"><strong>Rosa</strong> qué bonita 😍</li>
        </ul>
        <div className="my-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#64748b]">
          <span className="h-px flex-1 bg-black/10" /> Messenger, a Ana <span className="h-px flex-1 bg-black/10" />
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-[#0866ff] px-3 py-2.5 text-sm text-white">
          ¿Confirmas la compra de <strong>blusa roja 2</strong> por <strong>Q85</strong>?
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <span className="rounded-lg bg-white py-1.5 text-center font-semibold text-[#0866ff]">Sí, lo quiero</span>
            <span className="rounded-lg bg-white/20 py-1.5 text-center font-semibold">No</span>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#0e9f84]">
          <span>✓</span> Apartado para Ana. Luis queda en fila por si no confirma.
        </p>
      </div>
    </div>
  )
}
