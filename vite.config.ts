import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project Pages URL: https://<owner>.github.io/<repository>/
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/Prueba-Mini-portal-tools/' : '/',
  plugins: [react()],
})
