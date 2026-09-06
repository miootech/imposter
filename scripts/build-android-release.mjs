import { execSync } from 'node:child_process'
import { existsSync, statSync, copyFileSync } from 'node:fs'
import { resolve, join } from 'node:path'

const projectRoot = resolve('.')
const androidDir = join(projectRoot, 'android')
const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
const apkPath = join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
const publicApkPath = join(projectRoot, 'public', 'imposter.apk')

console.log('\n=============================================')
console.log('🚀 Step 1/3: Building Next.js Static Export')
console.log('=============================================\n')

execSync('node scripts/build-cap.mjs', {
  stdio: 'inherit',
  cwd: projectRoot,
  env: {
    ...process.env,
    CAPACITOR_BUILD: 'true',
  },
})

console.log('\n=============================================')
console.log('🔄 Step 2/3: Syncing Capacitor Android Assets')
console.log('=============================================\n')

execSync('npx cap sync android', {
  stdio: 'inherit',
  cwd: projectRoot,
})

console.log('\n=============================================')
console.log('📦 Step 3/3: Building Signed Android Release APK')
console.log('=============================================\n')

execSync(`${gradlewCmd} assembleRelease`, {
  stdio: 'inherit',
  cwd: androidDir,
})

if (existsSync(apkPath)) {
  copyFileSync(apkPath, publicApkPath)
  const stats = statSync(apkPath)
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2)
  console.log('\n=============================================')
  console.log('✅ Android Release APK Build Complete!')
  console.log(`📁 APK Location:   ${apkPath}`)
  console.log(`🌐 Web Download:   ${publicApkPath}`)
  console.log(`⚖️  File Size:      ${sizeMb} MB`)
  console.log('=============================================\n')
} else {
  console.error(`\n❌ Error: Release APK was not found at ${apkPath}`)
  process.exit(1)
}
