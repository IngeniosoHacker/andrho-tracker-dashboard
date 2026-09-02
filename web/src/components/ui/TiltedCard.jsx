import { useRef, useState } from 'react'

// reactbits.dev "TiltedCard" component
// 3D perspective tilt with subtle specular glare reflection
export default function TiltedCard({
  children,
  className = '',
  maxTilt = 6,
  glare = true,
}) {
  const ref = useRef(null)
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 })

  function handleMove(e) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5

    const rotX = -py * maxTilt
    const rotY = px * maxTilt

    el.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`

    if (glare) {
      setGlarePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
        opacity: 0.15,
      })
    }
  }

  function reset() {
    const el = ref.current
    if (el) {
      el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
    }
    if (glare) {
      setGlarePos((prev) => ({ ...prev, opacity: 0 }))
    }
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={`relative will-change-transform transition-transform duration-300 ease-out ${className}`}
    >
      {children}

      {glare && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.4), transparent 60%)`,
            opacity: glarePos.opacity,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
