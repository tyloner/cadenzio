import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export default async function ProfileRedirect() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const profile = await db.profile.findUnique({
    where: { userId: session.user.id },
    select: { username: true },
  })

  // Profile may still be mid-creation via layout — fall through to settings if not found
  if (!profile) redirect("/settings")

  redirect(`/profile/${profile.username}`)
}
