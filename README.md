# Camera IQ Analyzer - App Store Deployment Guide

This guide outlines the steps to move from development to the Apple App Store.

## 1. Local Setup
Ensure you have your Gemini API key in your `.env` file:
```env
GEMINI_API_KEY="your_actual_key_here"
```

## 2. Build & Sync
Run these commands in your terminal:
```bash
npm run build
npx cap copy ios
npx cap open ios
```

## 3. App Store Assets
Generate your icons and splash screens:
1. Place `icon.png` (1024x1024) and `splash.png` (2732x2732) in an `assets` folder.
2. Run:
```bash
npx capacitor-assets generate --ios
```

## 4. Xcode Configuration
1. **Signing**: In Xcode, go to **Signing & Capabilities** and select your Developer Team.
2. **Privacy**: Ensure `Info.plist` has the `NSCameraUsageDescription` key.
3. **Archive**: Select **Product > Archive** to create the final build for upload.

## 5. App Store Connect
1. Create your app record at [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. Upload your build from Xcode.
3. Submit for review!

---
*Note: Vulnerability warnings during `npm install` for `@capacitor/cli` are typically related to build tools and do not affect the security of your final iOS app.*
