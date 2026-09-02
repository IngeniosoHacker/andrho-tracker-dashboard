import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const resolvePath = (p) => fileURLToPath(new URL(p, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolvePath('./index.html'),
        login: resolvePath('./login.html'),
        signup: resolvePath('./signup.html'),
      },
    },
  },
})
