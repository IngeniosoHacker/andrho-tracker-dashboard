import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ShortLanding from './ShortLanding.jsx'
import WelcomeBack from './WelcomeBack.jsx'
import { landingState, recordVisit } from './lib/visitor.js'

// Each visitor gets the landing that fits them (lib/visitor.js): the full
// story the first time, a short closing page when they come back, and a
// welcome back once they signed up.
const VIEW = { nuevo: App, recurrente: ShortLanding, registrado: WelcomeBack }
const Landing = VIEW[landingState(recordVisit())] ?? App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Landing />
  </StrictMode>,
)
