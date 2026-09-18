# Rakshi Coco ERP - Android Build Instructions

This document outlines the requirements and steps for building the Android APK for the Rakshi Coco ERP application using Capacitor in a hosted architecture.

## 1. Prerequisites & Requirements

- **Node.js**: v18 or newer
- **Java Development Kit (JDK)**: Version 17
- **Android Studio**: Ladybug (or latest stable)
- **Android SDK**: API 34 (Android 14) minimum
- **Gradle**: Managed automatically by Capacitor/Android Studio
- **Package Manager**: pnpm

## 2. Capacitor Configuration

The application uses a **Hosted Next.js Architecture**. The APK acts as a secure shell pointing to our production (or local) server URL. 

### Package Details
- **App Name**: Rakshi Coco
- **Package ID**: `com.rakshicoco.erp`
- **Version**: 1.0.0

### Environment Variables
Set the `CAPACITOR_SERVER_URL` environment variable to control where the APK connects.
- **Local Development**: `http://10.0.2.2:3000` (Android emulator localhost alias)
- **Production**: `https://www.rakshicoco.feenixs.com`

*Note: Edit `capacitor.config.ts` or set the env variable before syncing.*

## 3. Build Steps

### Step 1: Install Dependencies
Ensure all web and capacitor dependencies are installed:
```bash
pnpm install
```

### Step 2: Build the Web Assets
Even though we use a hosted server URL, Capacitor requires a dummy web directory to successfully compile.
```bash
pnpm run build
```
*(Ensure `out` or `public` directory exists for Capacitor to reference)*

### Step 3: Sync Android Project
This copies the Capacitor config into the Android native project:
```bash
npx cap sync android
```

### Step 4: Build the Debug APK
Open the project in Android Studio to build, or use Gradle from the command line:

**Using Command Line (Windows):**
```powershell
cd android
.\gradlew assembleDebug
```
**Output Path**: `android/app/build/outputs/apk/debug/app-debug.apk`

## 4. Device Installation & ADB Commands

To install the generated debug APK on a connected device or emulator:
```powershell
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

To view logs for troubleshooting:
```powershell
adb logcat | findstr com.rakshicoco.erp
```

## 5. Release Build & Signing

*Release build instructions will be populated once the production keystore is generated.*

To generate a release build:
```powershell
cd android
.\gradlew assembleRelease
```

## 6. Troubleshooting

- **ERR_CLEARTEXT_NOT_PERMITTED**: Ensure `cleartext: true` is in `capacitor.config.ts` if testing on local `http://`.
- **Connection Refused**: If testing on an emulator, use `10.0.2.2` instead of `localhost` or `127.0.1.1`.
- **Missing Android SDK**: Ensure the `ANDROID_HOME` environment variable is set to your SDK path (e.g., `C:\Users\USER\AppData\Local\Android\Sdk`).
