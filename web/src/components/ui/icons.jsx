// Minimal hand-rolled line icons (no icon library in this project — see
// package.json). Used by the auth forms (login.jsx / signup.jsx) and their
// form primitives (form/inputs.jsx).
const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function MailIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

export function LockIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export function BuildingIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
    </svg>
  )
}

export function EyeIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12s3.6-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.6 6.5-9.5 6.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.7A9.9 9.9 0 0 1 12 5.5c5.9 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 4.1M6.4 6.8A16.6 16.6 0 0 0 2.5 12s3.6 6.5 9.5 6.5a9.4 9.4 0 0 0 4.1-.95" />
      <path d="M9.5 12a2.5 2.5 0 0 0 3.53 2.28M14.3 13.7A2.5 2.5 0 0 0 12 9.5" />
    </svg>
  )
}

export function AlertIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7.5v6" />
      <path d="M12 16.8h.01" />
    </svg>
  )
}

export function CheckCircleIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m8 12.3 2.5 2.5L16.5 9" />
    </svg>
  )
}

export function SpinnerIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// Service icons for the "Todo en una cuenta" window view.
export function GlobeIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  )
}

export function MegaphoneIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10v4a1 1 0 0 0 1 1h2l8 4.5V4.5L7 9H5a1 1 0 0 0-1 1Z" />
      <path d="M8 15l1.2 4.5h2.3L10.6 15M18.5 9.5a3.5 3.5 0 0 1 0 5" />
    </svg>
  )
}

export function BoxesIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 13.5h7v7h-7zM13.5 13.5h7v7h-7zM8.5 3.5h7v7h-7z" />
    </svg>
  )
}

export function ChipIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <rect x="9.5" y="9.5" width="5" height="5" />
      <path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5" />
    </svg>
  )
}
