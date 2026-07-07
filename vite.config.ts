import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from https://gitrixe4.github.io/singapore-mrt-tracking/
  base: '/singapore-mrt-tracking/',
})
