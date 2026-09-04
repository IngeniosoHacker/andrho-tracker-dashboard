import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const resolvePath = (p) => fileURLToPath(new URL(p, import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_ANDRHO_API_URL gets inlined into login.jsx/signup.jsx at build time
  // (see web/.env.example, src/lib/authApi.js) -- the browser calls it
  // directly. A Railway *private*-network hostname (*.railway.internal)
  // parses as a perfectly valid URL but only resolves inside Railway's
  // network, never from a user's browser: it would build successfully and
  // then fail every login/signup with a generic "No se pudo conectar con el
  // servidor" that's very hard to trace back to this. Fail the build instead.
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiUrl = env.VITE_ANDRHO_API_URL
  if (apiUrl && apiUrl.includes('.railway.internal')) {
    throw new Error(
      `VITE_ANDRHO_API_URL ("${apiUrl}") is a Railway *private*-network hostname (*.railway.internal). ` +
        'It will build fine but browsers cannot resolve it, so login.html/signup.html will fail every ' +
        "request with a network error. Use andrho-api's PUBLIC domain instead (Settings -> Networking -> " +
        'Generate Domain on that service).',
    )
  }

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          main: resolvePath('./index.html'),
          login: resolvePath('./login.html'),
          signup: resolvePath('./signup.html'),
          acceptInvite: resolvePath('./accept-invite.html'),
        },
      },
    },
  }
})
