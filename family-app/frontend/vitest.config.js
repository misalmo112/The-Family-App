import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/tests/setupTests.js'],
    include: ['src/tests/**/*.test.{js,jsx,ts,tsx}'],
  },
})
