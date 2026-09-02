import { useEffect, useRef } from 'react'

// reactbits.dev "Particles" component
// Lightweight interactive stardust background
export default function ParticleField({
  density = 60,
  color = '245, 242, 255',
  className = '',
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let width, height, particles, rafId
    let mouse = { x: -1000, y: -1000, radius: 100 }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function resize() {
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio
    }

    function makeParticles() {
      particles = Array.from({ length: density }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        originX: 0,
        originY: 0,
        r: (Math.random() * 1.2 + 0.3) * window.devicePixelRatio,
        vy: (Math.random() * 0.15 + 0.05) * window.devicePixelRatio,
        vx: (Math.random() * 0.06 - 0.03) * window.devicePixelRatio,
        alpha: Math.random() * 0.45 + 0.15,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
      }))
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        // Twinkle
        p.alpha += Math.sin(Date.now() * p.twinkleSpeed) * 0.005
        const clampedAlpha = Math.max(0.08, Math.min(0.6, p.alpha))

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color}, ${clampedAlpha})`
        ctx.fill()

        if (!prefersReducedMotion) {
          p.y -= p.vy
          p.x += p.vx

          // Gentle mouse reaction
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouse.radius * window.devicePixelRatio) {
            const force = (1 - dist / (mouse.radius * window.devicePixelRatio)) * 0.5
            p.x += (dx / dist) * force
            p.y += (dy / dist) * force
          }

          if (p.y < -5) {
            p.y = height + 5
            p.x = Math.random() * width
          }
          if (p.x < -5) p.x = width + 5
          if (p.x > width + 5) p.x = -5
        }
      }

      rafId = requestAnimationFrame(draw)
    }

    resize()
    makeParticles()
    draw()

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = (e.clientX - rect.left) * window.devicePixelRatio
      mouse.y = (e.clientY - rect.top) * window.devicePixelRatio
    }

    const handleMouseLeave = () => {
      mouse.x = -1000
      mouse.y = -1000
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(rafId)
    }
  }, [density, color])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full opacity-70 ${className}`}
    />
  )
}
