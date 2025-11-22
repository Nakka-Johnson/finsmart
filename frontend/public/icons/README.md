# PWA Icons

This directory contains icons for the Progressive Web App (PWA) manifest.

## Required Icons

- **icon-192x192.png** - App icon for mobile devices (required)
- **icon-512x512.png** - App icon for desktop/splash screen (required)

## How to Generate Icons

1. Create a high-resolution source icon (at least 1024x1024px) with your app logo
2. Use an icon generator tool like:
   - [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
   - [Favicon.io](https://favicon.io/)

3. Replace the placeholder files with generated icons

## Current Status

⚠️ **Placeholder icons** - Replace these with actual app icons before production deployment.

The current files are placeholders and should be replaced with proper PNG icons.

## Icon Specifications

- **Format**: PNG
- **Sizes**: 
  - 192x192px (minimum for Android)
  - 512x512px (for splash screens and high-res displays)
- **Purpose**: `any maskable` (safe zone for adaptive icons)
- **Background**: Transparent or app theme color (#3b82f6)

## Service Worker

The service worker will cache these icons for offline use. Ensure icons are properly sized and optimized before deployment.
