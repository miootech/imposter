import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor Configuration
 * -----------------------
 * Wraps the static Next.js export (out/) into a native Android app.
 *
 * Build flow:
 *   1. bun run build           → produces static files in /out
 *   2. npx cap sync android     → copies /out into android/app/src/main/assets/public
 *   3. npx cap open android     → opens Android Studio for APK build
 *
 * The app is 100% offline — no backend, all data stored locally via IndexedDB
 * (Dexie) and Capacitor Preferences (which maps to Android SharedPreferences).
 */
const config: CapacitorConfig = {
  appId: 'com.imposter.partygame',
  appName: 'Imposter',
  webDir: 'out',
  android: {
    allowMixedContent: false,
    // Use native WebView hardware acceleration
    captureInput: true,
    // Always reload from local files — never fetch from network
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0D0D0D',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      android: {
        gravity: 'center',
        backgroundColor: '#0D0D0D',
      },
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0D0D0D',
    },
    Haptics: {
      // No special config needed — plugin handles native vibration
    },
  },
}

export default config
