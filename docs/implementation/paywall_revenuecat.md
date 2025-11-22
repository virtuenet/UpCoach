# Paywall and RevenueCat Integration (MVP)

This document outlines how to enable the paywall gating for premium features using RevenueCat.

## Mobile Setup

- The app uses `purchases_flutter` and initializes RevenueCat in `mobile-app/lib/main.dart` if a valid key is present in `SecureConfig`.
- Configure the key via secure storage or env → `revenuecatKey`.
- Premium screen example gated: `AIInsightsScreen` shows a paywall if entitlement is missing and calls `Purchases.presentPaywall()`.

## Backend

- Webhook receiver exists at `/webhook/revenuecat`. Implement signature verification and entitlement persistence when keys are available.

## Steps to Enable

1. Obtain the RevenueCat public SDK key for the target platform(s).
2. Store the key securely (Keychain/Keystore) under `revenuecatKey` or provide via encrypted assets for development.
3. Define products/offerings in RevenueCat dashboard matching your app bundle IDs.
4. Implement webhook verification and update user entitlements in the database.
5. Replace the temporary gating boolean in the screen with actual `CustomerInfo` entitlement checks.
