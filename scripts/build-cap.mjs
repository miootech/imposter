import { execSync } from 'node:child_process'

console.log('Building static export for Capacitor Android...')
execSync('npx next build', {
  stdio: 'inherit',
  env: {
    ...process.env,
    CAPACITOR_BUILD: 'true',
  },
})

