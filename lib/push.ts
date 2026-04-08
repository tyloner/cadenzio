import webpush from "web-push"
import { db } from "@/lib/db"

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? "hello@cadenz.io"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

interface PushPayload {
  title: string
  body: string
  url?: string
}

/** Send a push notification to all subscriptions for a user. Silently drops expired/invalid subs. */
export async function sendPush(userId: string, payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY) return // push not configured

  const subs = await db.pushSubscription.findMany({ where: { userId } })
  if (subs.length === 0) return

  const data = JSON.stringify(payload)

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data,
        )
      } catch (err: unknown) {
        // 410 Gone = subscription expired; clean up
        if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
          await db.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } })
        }
      }
    })
  )
}
