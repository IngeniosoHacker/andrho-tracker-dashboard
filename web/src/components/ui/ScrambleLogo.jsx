import { useEffect, useRef, useState } from 'react'

function randomCase(str) {
  return str
    .split('')
    .map((ch) => (Math.random() > 0.5 ? ch.toUpperCase() : ch.toLowerCase()))
    .join('')
}

// The original AndRho glitch: each word-segment independently flickers
// between its letters (randomized case) and a single symbol.
export default function ScrambleLogo({
  segments = [
    { letters: 'And', symbol: '&' },
    { letters: 'Rho', symbol: 'ρ' },
  ],
  interval = 450,
  toggleChance = 0.12,
  className = '',
}) {
  const isSymbolRef = useRef(segments.map(() => false))
  const [display, setDisplay] = useState(() => segments.map((s) => randomCase(s.letters)))

  useEffect(() => {
    const id = setInterval(() => {
      const next = segments.map((s, i) => {
        if (Math.random() < toggleChance) isSymbolRef.current[i] = !isSymbolRef.current[i]
        return isSymbolRef.current[i] ? s.symbol : randomCase(s.letters)
      })
      setDisplay(next)
    }, interval)
    return () => clearInterval(id)
  }, [segments, interval, toggleChance])

  return (
    <span className={className}>
      {display.map((text, i) => (
        <span key={i}>{text}</span>
      ))}
    </span>
  )
}
