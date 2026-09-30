import { useEffect, useRef } from 'react'
import { clamp, mixColor, prefersReducedMotion } from '../../lib/motion.js'
import { SKY } from '../../lib/landing.js'

const PX = 2 // CSS pixels per "pixel-art" pixel — stars snap to this grid

// Fixed, full-viewport pixel-art sky behind the whole landing. `mix` goes
// from 0 (hero: sparse black pixels on white) to 1 (space wallpaper: dense
// white pixels on dark blue). Stars drift with scroll at different depths so
// moving down the page feels like travelling.
export default function PixelStarfield({ mix = 0 }) {
  const canvasRef = useRef(null)
  const mixRef = useRef(mix)

  useEffect(() => {
    mixRef.current = mix
  }, [mix])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduced = prefersReducedMotion()
    let stars = []
    let W = 0
    let H = 0
    let dpr = 1
    let raf = 0

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      const count = Math.round((W * H) / 6500)
      stars = Array.from({ length: count }, () => {
        const r = Math.random()
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          depth: 0.15 + Math.random() * 0.85,
          // Low rank = shown even on the minimalist white hero; the rest
          // appear as the sky darkens.
          rank: Math.random(),
          kind: r < 0.06 ? 'sparkle' : r < 0.25 ? 'big' : 'dot',
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 1.4,
        }
      })
    }

    function frame(now) {
      const m = mixRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalAlpha = 1
      ctx.fillStyle = mixColor(SKY.light.bg, SKY.dark.bg, m)
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = mixColor(SKY.light.star, SKY.dark.star, m)

      const visibleShare = 0.28 + 0.72 * m
      const scroll = window.scrollY
      for (const s of stars) {
        const vis = clamp((visibleShare - s.rank) / 0.08)
        if (vis <= 0) continue
        const twinkle = reduced ? 1 : 0.55 + 0.45 * Math.sin((now / 1000) * s.speed + s.phase)
        // Quantized alpha keeps the twinkle "pixel-y" instead of smooth.
        const alpha = Math.round(vis * twinkle * 4) / 4
        if (alpha <= 0) continue
        ctx.globalAlpha = alpha
        const y = (((s.y - scroll * s.depth * 0.12) % H) + H) % H
        const x = Math.round(s.x / PX) * PX
        const sy = Math.round(y / PX) * PX
        if (s.kind === 'dot') {
          ctx.fillRect(x, sy, PX, PX)
        } else if (s.kind === 'big') {
          ctx.fillRect(x, sy, PX * 2, PX * 2)
        } else {
          // 4-point pixel sparkle; arms grow a pixel at the peak of the twinkle.
          const arm = twinkle > 0.85 ? 2 : 1
          ctx.fillRect(x - arm * PX, sy, (arm * 2 + 1) * PX, PX)
          ctx.fillRect(x, sy - arm * PX, PX, (arm * 2 + 1) * PX)
        }
      }
      raf = requestAnimationFrame(frame)
    }

    build()
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', build)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', build)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
}
