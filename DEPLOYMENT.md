# CLEMTRIX POS - Production Deployment Guide

## 1. Supabase Setup
1. Create a new Supabase project.
2. Go to the SQL Editor and run the contents of `database.sql`.
3. Go to `Authentication` > `Providers` and ensure `Email` is enabled.
4. Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `.env`.

## 2. Gemini AI Setup
1. Get an API key from [Google AI Studio](https://aistudio.google.com/).
2. Add `GEMINI_API_KEY` to your environment variables.

## 3. Paystack Integration
1. Register on [Paystack](https://paystack.com/).
2. Add your Public Key to `VITE_PAYSTACK_PUBLIC_KEY`.
3. The system uses Paystack for:
   - Subscription billing (recurring GHS 100/200/500).
   - Mobile Money POS payments (via Paystack Checkout).

## 4. Electron Build (Windows EXE)
To bundle CLEMTRIX as a desktop app:
1. Install electron dependencies: `npm install -D electron electron-builder`.
2. Configure `main.js` for Electron (points to `dist/index.html`).
3. Run `npm run build` then `npx electron-builder`.
4. The offline capabilities use `Dexie` (IndexedDB) which is persisted by the Chromium engine in Electron.

## 5. Offline Sync Logic
- All sales are saved to `syncQueue` locally if offline.
- The `useSyncEngine` hook automatically pushes queue items to Supabase when a connection is detected.
- Conflict resolution: The system uses UUIDs and "Last-write-wins" based on `updated_at` timestamps.

## 6. Target Market
Designed specifically for businesses in **Nkawkaw** (Mini marts, Boutiques, Pharmacies, etc.) with support for:
- Low-power/Slow internet environments.
- Ghana Cedi (GHS) pricing.
- Mobile Money (MTN/Vodafone/AirtelTigo) payment flows.
