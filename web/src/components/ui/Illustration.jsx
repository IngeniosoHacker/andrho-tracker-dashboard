import { useState } from 'react'

// Renders a standardized illustration asset (see lib/assets.js). If the file
// hasn't been uploaded to public/images/illustrations/ yet, this quietly
// renders nothing instead of a broken-image icon — sections are laid out to
// look intentional either way.
export default function Illustration({ src, alt = '', className = '', ...props }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) return null

  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt === '' ? 'true' : undefined}
      loading="lazy"
      draggable="false"
      onError={() => setFailed(true)}
      className={className}
      {...props}
    />
  )
}
