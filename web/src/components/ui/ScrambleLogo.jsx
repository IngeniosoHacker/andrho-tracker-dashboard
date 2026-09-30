import { useEffect, useRef, useState } from 'react'

function randomCase(str) {
  return str
    .split('')
    .map((ch) => (Math.random() > 0.5 ? ch.toUpperCase() : ch.toLowerCase()))
    .join('')
}

const DEFAULT_SEGMENTS = [
  { letters: 'And', symbol: '&' },
  { letters: 'Rho', symbol: 'ρ' },
]

// The original AndRho glitch: each word-segment independently flickers
// between its letters (randomized case) and a single symbol. `paused` settles
// it on the plain wordmark (used while the hero title flies into the navbar).
export default function ScrambleLogo({
  segments = DEFAULT_SEGMENTS,
  interval = 450,
  toggleChance = 0.12,
  paused = false,
  className = '',
}) {
  const isSymbolRef = useRef(segments.map(() => false))
  const [display, setDisplay] = useState(() => segments.map((s) => randomCase(s.letters)))

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      const next = segments.map((s, i) => {
        if (Math.random() < toggleChance) isSymbolRef.current[i] = !isSymbolRef.current[i]
        return isSymbolRef.current[i] ? s.symbol : randomCase(s.letters)
      })
      setDisplay(next)
    }, interval)
    return () => clearInterval(id)
  }, [segments, interval, toggleChance, paused])

  return (
    <span className={className}>
      {(paused ? segments.map((s) => s.letters) : display).map((text, i) => (
        <span key={i}>{text}</span>
      ))}
    </span>
  )
}
