import { useEffect, useRef, useState } from 'react'

// reactbits.dev "Carousel" component
// Auto-playing, draggable slide carousel with dot pagination + arrow controls.
export default function Carousel({ items, autoPlay = 5500, className = '' }) {
  const [index, setIndex] = useState(0)
  const count = items.length
  const timerRef = useRef(null)
  const dragRef = useRef({ startX: 0, dragging: false })

  function goTo(next) {
    setIndex(((next % count) + count) % count)
  }

  useEffect(() => {
    if (!autoPlay || count <= 1) return
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % count), autoPlay)
    return () => clearInterval(timerRef.current)
  }, [autoPlay, count, index])

  function pause() {
    clearInterval(timerRef.current)
  }

  function onPointerDown(e) {
    dragRef.current = { startX: e.clientX, dragging: true }
    pause()
  }

  function onPointerUp(e) {
    if (!dragRef.current.dragging) return
    const delta = e.clientX - dragRef.current.startX
    if (delta > 40) goTo(index - 1)
    else if (delta < -40) goTo(index + 1)
    dragRef.current.dragging = false
  }

  return (
    <div className={className} onMouseEnter={pause}>
      <div
        className="cursor-grab touch-pan-y overflow-hidden rounded-3xl active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((item, i) => (
            <div key={i} className="w-full shrink-0 px-1">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--c-line)] text-[var(--c-mist)] transition-colors hover:border-[var(--c-comet)]/50 hover:text-[var(--c-comet)]"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir a la diapositiva ${i + 1}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-6 bg-[var(--c-solar)]' : 'w-1.5 bg-[var(--c-line)]'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Siguiente"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--c-line)] text-[var(--c-mist)] transition-colors hover:border-[var(--c-comet)]/50 hover:text-[var(--c-comet)]"
        >
          ›
        </button>
      </div>
    </div>
  )
}
