# Netlify Games

Netlify Games is a game discovery and collection app with Windows desktop and Android builds.

## Android build

Every push to `main` runs the **Android APK** workflow. When it succeeds:

1. Open the repository's **Actions** tab.
2. Open the latest **Android APK** run.
3. Under **Artifacts**, download `Netlify-Games-Android-APK`.
4. Extract the ZIP and install `app-debug.apk` on your Android device. You may need to allow installation from that file manager.

The Android build currently provides the mobile store, game details, search, and local library UI. The desktop-only game installer download manager and PC game launching are not available on Android. Store entries are demo listings until real licensed game packages and backend services are configured.

## Local Android development

```bash
npm install
npm run build:web
npx cap add android
npx cap sync android
npx cap open android
```

## Windows desktop

```bash
npm install
npm run dist
```
