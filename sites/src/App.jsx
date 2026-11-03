import { site, view } from './site.js'
import Construyendo from './Construyendo.jsx'
import Inicio from './Inicio.jsx'

// While the Creator builds the business' site, every visitor sees
// Construyendo. Inicio is the template's full home, structured by the
// business' type (src/site.js → sections): Creators start from it.
export default function App() {
  return view === 'construyendo' ? <Construyendo site={site} /> : <Inicio site={site} />
}
