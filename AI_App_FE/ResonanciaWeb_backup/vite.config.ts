import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, //hide it if don't use devcontainer
    watch: {
      usePolling: true, //hide it if don't use devcontainer
    },
  },
})
