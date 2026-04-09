import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Users, Plus, ChevronRight } from "lucide-react"
import { EnsembleCreateForm } from "@/components/ensemble/create-form"

export const metadata = { title: "Ensemble" }

export default async function EnsemblePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const [ensembles, profile, sub] = await Promise.all([
    db.ensemble.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.profile.findUnique({ where: { userId }, select: { ensembleTrialUsed: true } }),
    db.subscription.findUnique({ where: { userId }, select: { tier: true } }),
  ])

  const isPro = sub?.tier === "PRO"
  const hasFreeTrial = !profile?.ensembleTrialUsed

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <Users size={20} className="text-wave" /> Ensemble
          </h1>
          <p className="text-xs text-muted mt-0.5">Compose together, walk together</p>
        </div>
        <EnsembleCreateForm />
      </div>

      {/* Premium badge */}
      {!isPro && (
        <div className="rounded-xl bg-wave/10 border border-wave/20 px-4 py-3 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-wave">Pro feature</p>
            <p className="text-xs text-muted mt-0.5">
              {hasFreeTrial ? "You have 1 free trial session remaining" : "Upgrade to Pro for unlimited sessions"}
            </p>
          </div>
          {!isPro && (
            <Link href="/settings/upgrade" className="text-xs font-semibold text-white bg-wave rounded-lg px-3 py-1.5">
              Upgrade
            </Link>
          )}
        </div>
      )}

      {ensembles.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className="text-muted mx-auto mb-3" />
          <p className="font-semibold text-ink">No ensembles yet</p>
          <p className="text-sm text-muted mt-1">Create one and invite up to 3 friends</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ensembles.map((e) => (
            <Link
              key={e.id}
              href={`/ensemble/${e.id}`}
              className="bg-mist rounded-xl p-4 flex items-center gap-3 hover:bg-border/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-wave/20 flex items-center justify-center flex-shrink-0">
                <Users size={18} className="text-wave" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink truncate">{e.name}</p>
                <p className="text-xs text-muted mt-0.5">
                  {e.members.length} member{e.members.length !== 1 ? "s" : ""} · {e._count.sessions} session{e._count.sessions !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {e.members.slice(0, 3).map((m) => (
                  m.user.image ? (
                    <img key={m.userId} src={m.user.image} alt={m.user.name ?? ""} className="w-6 h-6 rounded-full border border-white" />
                  ) : (
                    <div key={m.userId} className="w-6 h-6 rounded-full bg-wave/30 flex items-center justify-center text-[10px] font-bold text-wave border border-white">
                      {(m.user.name ?? "?")[0].toUpperCase()}
                    </div>
                  )
                ))}
                <ChevronRight size={16} className="text-muted ml-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
