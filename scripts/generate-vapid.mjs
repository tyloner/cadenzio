/**
 * Generate VAPID keys for web push notifications.
 *
 * Usage:
 *   node scripts/generate-vapid.mjs
 *
 * Copy the output into your .env.local (or Vercel environment variables):
 *   VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=...
 *   VAPID_EMAIL=hello@cadenz.io   ← update to your contact email
 */

import webpush from "web-push"

const { publicKey, privateKey } = webpush.generateVAPIDKeys()

console.log("\n✅  VAPID keys generated. Add these to your .env.local:\n")
console.log(`VAPID_PUBLIC_KEY=${publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${privateKey}`)
console.log(`VAPID_EMAIL=hello@cadenz.io\n`)
console.log("Also add VAPID_PUBLIC_KEY to your Vercel environment variables")
console.log("so the client can fetch it from GET /api/push/subscribe.\n")
