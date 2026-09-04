import Navbar from './components/sections/Navbar.jsx'
import Hero from './components/sections/Hero.jsx'
import Features from './components/sections/Features.jsx'
import Pricing from './components/sections/Pricing.jsx'
import Footer from './components/sections/Footer.jsx'

// AndRho — official marketing landing page.
export default function App() {
  return (
    <div className="overflow-x-hidden antialiased">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  )
}
