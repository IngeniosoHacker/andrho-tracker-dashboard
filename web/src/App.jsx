import Navbar from './components/sections/Navbar.jsx'
import Hero from './components/sections/Hero.jsx'
import Features from './components/sections/Features.jsx'
import Waitlist from './components/sections/Waitlist.jsx'
import MissionForm from './components/sections/MissionForm.jsx'
import MissionGame from './components/sections/MissionGame.jsx'
import Footer from './components/sections/Footer.jsx'

// AndRho — official marketing landing page.
export default function App() {
  return (
    <div className="overflow-x-hidden antialiased">
      <Navbar />
      <Hero />
      <Features />
      <Waitlist />
      <MissionForm />
      <MissionGame />
      <Footer />
    </div>
  )
}
