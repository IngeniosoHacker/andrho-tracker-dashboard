import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './motion.js'

// The card deck behind the full-screen questionnaires (waitlist.html,
// signup.html): one card per screen sliding sideways, with an optional big
// message (a "verdict") shown alone between two cards.
//
// transition(dir, apply, message): slides the current card out (dir 1 =
// forward, -1 = back), shows `message` ({ tone, text }) if given, then calls
// `apply` (e.g. setStepId) and slides the next card in. `cardMotion` is the
// class for the current card; while `moving`, ignore further input.

export const OUT_MS = 420
export const MESSAGE_MS = 1700

export function useDeck() {
  // phase: 'in' (card arriving / shown) → 'out' (leaving) → 'message' → 'in'
  const [motion, setMotion] = useState({ phase: 'in', dir: 1 })
  const [verdict, setVerdict] = useState(null)
  const timers = useRef([])
  const pending = useRef(null)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function later(ms, fn) {
    timers.current.push(setTimeout(fn, ms))
  }

  function arrive() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    const next = pending.current
    pending.current = null
    if (!next) return
    setVerdict(null)
    next.apply()
    setMotion({ phase: 'in', dir: next.dir })
  }

  function transition(dir, apply, message) {
    const reduced = prefersReducedMotion()
    pending.current = { dir, apply }
    setMotion({ phase: 'out', dir })
    later(reduced ? 0 : OUT_MS, () => {
      if (!message) return arrive()
      setVerdict({ ...message, key: Date.now() })
      setMotion({ phase: 'message', dir })
      later(MESSAGE_MS, arrive)
    })
  }

  const dirName = motion.dir > 0 ? 'next' : 'prev'
  const cardMotion = motion.phase === 'out' ? `card-out-${dirName}` : motion.phase === 'in' ? `card-in-${dirName}` : ''
  return {
    motion,
    verdict,
    transition,
    arrive,
    cardMotion,
    moving: motion.phase === 'out' || motion.phase === 'message',
    showingMessage: motion.phase === 'message',
  }
}
