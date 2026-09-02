import { useEffect, useRef, useState } from 'react'

// reactbits.dev-style "TextType": cycles through a list of strings with a
// type/delete effect. Pass `loop={false}` to stop after the last string.
export default function TextType({
  text = [],
  typingSpeed = 55,
  deletingSpeed = 28,
  pauseDuration = 1400,
  loop = true,
  className = '',
  cursorClassName = 'text-[var(--c-comet)]',
}) {
  const [display, setDisplay] = useState('')
  const indexRef = useRef(0)
  const charRef = useRef(0)
  const deletingRef = useRef(false)

  useEffect(() => {
    if (!text.length) return
    let timeoutId

    function tick() {
      const current = text[indexRef.current]
      if (!deletingRef.current) {
        charRef.current++
        setDisplay(current.slice(0, charRef.current))
        if (charRef.current === current.length) {
          const isLast = indexRef.current === text.length - 1
          if (isLast && !loop) return
          deletingRef.current = true
          timeoutId = setTimeout(tick, pauseDuration)
          return
        }
      } else {
        charRef.current--
        setDisplay(current.slice(0, charRef.current))
        if (charRef.current === 0) {
          deletingRef.current = false
          indexRef.current = (indexRef.current + 1) % text.length
        }
      }
      timeoutId = setTimeout(tick, deletingRef.current ? deletingSpeed : typingSpeed)
    }

    timeoutId = setTimeout(tick, typingSpeed)
    return () => clearTimeout(timeoutId)
  }, [text, typingSpeed, deletingSpeed, pauseDuration, loop])

  return (
    <span className={className}>
      {display}
      <span className={`cursor-blink ${cursorClassName}`}>▍</span>
    </span>
  )
}
