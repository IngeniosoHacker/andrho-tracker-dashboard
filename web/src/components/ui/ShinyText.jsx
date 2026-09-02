// reactbits.dev "ShinyText" component
// A sleek metallic/stardust shimmer effect over typography

export default function ShinyText({
  text,
  disabled = false,
  speed = 3,
  className = '',
  shimmerColor = 'rgba(255, 255, 255, 0.9)',
}) {
  const animationDuration = `${speed}s`

  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${disabled ? '' : 'animate-shine'} ${className}`}
      style={{
        backgroundImage: `linear-gradient(120deg, rgba(245, 242, 255, 0.3) 0%, rgba(245, 242, 255, 0.5) 30%, ${shimmerColor} 50%, rgba(245, 242, 255, 0.5) 70%, rgba(245, 242, 255, 0.3) 100%)`,
        backgroundSize: '200% 100%',
        animationDuration,
        WebkitBackgroundClip: 'text',
      }}
    >
      {text}
    </span>
  )
}
