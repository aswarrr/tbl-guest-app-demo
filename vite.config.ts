import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function validateProductionApiUrl(value: string | undefined) {
  const rawValue = value?.trim()

  if (!rawValue) {
    throw new Error('VITE_API_BASE_URL is required for production builds.')
  }

  let apiUrl: URL

  try {
    apiUrl = new URL(rawValue)
  } catch {
    throw new Error('VITE_API_BASE_URL must be a valid absolute URL.')
  }

  const localHosts = new Set(['localhost', '127.0.0.1', '::1'])

  if (apiUrl.protocol !== 'https:') {
    throw new Error('VITE_API_BASE_URL must use HTTPS for production builds.')
  }

  if (localHosts.has(apiUrl.hostname)) {
    throw new Error('VITE_API_BASE_URL cannot target localhost in production.')
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const buildEnv = loadEnv(mode, process.cwd(), '')
    validateProductionApiUrl(buildEnv.VITE_API_BASE_URL)
  }

  return {
    plugins: [react()],
  }
})
