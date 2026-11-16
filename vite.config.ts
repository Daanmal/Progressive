import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const buildId = Date.now().toString(36)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
})
