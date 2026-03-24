import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const vitePort = Number(env.VITE_PORT) || 5173
  const allowedHosts = (env.ALLOWED_HOST || 'localhost')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)
    .flatMap((host) => [host, `.${host}`])

  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
    },
    base: '/grabdatmui/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: vitePort,
      host: '0.0.0.0',
      allowedHosts,
    },
  }
})