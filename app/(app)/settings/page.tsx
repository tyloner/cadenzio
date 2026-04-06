import { auth, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { SettingsForm } from "@/components/settings-form"
import { CheckCircle2 } from "lucide-react"

export const metadata = { title: "Settings" }

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const session = await auth()
  const userId = session!.user!.id!

  const [profile, subscription, { upgraded }] = await Promise.all([
    db.profile.findUnique({ where: { userId }, select: { username: true, bio: true, country: true, musicalInterests: true, isPublic: true, units: true } }),
    db.subscription.findUnique({ where: { userId } }),
    searchParams,
  ])

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-ink mb-6">Settings</h1>

      {upgraded === "1" && (
        <div className="flex items-start gap-3 bg-wave/10 border border-wave/30 rounded-2xl px-4 py-4 mb-6">
          <CheckCircle2 size={20} className="text-wave flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-wave">Welcome to Cadenz Pro!</p>
            <p className="text-xs text-wave/80 mt-0.5">
              Your subscription is active. All features are now unlocked.
            </p>
          </div>
        </div>
      )}

      <SettingsForm
        profile={profile}
        tier={subscription?.tier ?? "FREE"}
        userId={userId}
        userEmail={session?.user?.email ?? ""}
        userName={session?.user?.name ?? ""}
      />

      {/* Sign out */}
      <div className="mt-8 pt-6 border-t border-border">
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}
        >
          <button
            type="submit"
            className="w-full border border-red-200 text-red-500 rounded-xl py-3 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="mt-4">
        <p className="text-xs text-muted text-center">
          Want to delete your account?{" "}
          <a href="mailto:privacy@cadenz.io" className="text-wave hover:underline">
            Contact us
          </a>
        </p>
      </div>
    </div>
  )
}
