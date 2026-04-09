import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { CompositionPlayer } from "@/components/composition-player"
import { Users, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const metadata = { title: "Ensemble Result" }

export default async function EnsembleResultPage({
  params,
}: {
  params: Promise<{ id: string; sid: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const { id: ensembleId, sid: sessionId } = await params

  const ensSession = await db.ensembleSession.findUnique({
    where: { id: sessionId, ensembleId },
    include: {
      tracks: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      activity: {
        include: { composition: true },
      },
    },
  })

  if (!ensSession || ensSession.status !== "COMPLETED") notFound()

  const composition = ensSession.activity?.composition
  const midiEvents = (composition?.midiEvents as {
    note: number; duration: string; time: number; velocity: number; track: "lead" | "rhythm" | "pad"
  }[]) ?? []

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-2 mb-2">
        <Users size={18} className="text-wave" />
        <h1 className="text-xl font-bold text-ink">Ensemble Composition</h1>
      </div>
      <p className="text-sm text-muted mb-6">Recorded together · {ensSession.tracks.length} walksicians</p>

      {/* Member avatars */}
      <div className="flex items-center gap-2 mb-6">
        {ensSession.tracks.map((track) => (
          <div key={track.userId} className="flex flex-col items-center gap-1">
            {track.user.image ? (
              <Image src={track.user.image} alt={track.user.name ?? ""} width={40} height={40} className="rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-wave/20 flex items-center justify-center text-sm font-bold text-wave">
                {(track.user.name ?? "?")[0].toUpperCase()}
              </div>
            )}
            <span className="text-[10px] text-muted truncate max-w-[48px] text-center">{track.user.name?.split(" ")[0]}</span>
            <span className="text-[10px] font-medium text-wave capitalize">{track.instrument}</span>
          </div>
        ))}
      </div>

      {/* Merged player */}
      {composition && midiEvents.length > 0 ? (
        <CompositionPlayer
          midiEvents={midiEvents}
          bpmAvg={composition.bpmAvg}
          genre={composition.genre}
          instrument={ensSession.tracks[0]?.instrument ?? "piano"}
          startingNote={composition.startingNote}
          scale={composition.scale}
        />
      ) : (
        <div className="bg-mist rounded-xl p-6 text-center text-muted text-sm mb-6">
          Composition is being processed…
        </div>
      )}

      {/* Track breakdown */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-ink mb-3">Tracks</h2>
        <div className="flex flex-col gap-2">
          {ensSession.tracks.map((track) => (
            <div key={track.userId} className="bg-mist rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {track.user.image ? (
                  <Image src={track.user.image} alt={track.user.name ?? ""} width={28} height={28} className="rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-wave/20 flex items-center justify-center text-xs font-bold text-wave">
                    {(track.user.name ?? "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-ink">{track.user.name}</span>
              </div>
              <div className="text-xs text-muted text-right">
                <span className="capitalize font-medium text-ink">{track.instrument}</span>
                {" · "}{track.scale.replace(/_/g, " ")} · {track.startingNote}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {ensSession.activity && (
          <Link
            href={`/activity/${ensSession.activity.id}`}
            className="flex-1 flex items-center justify-center gap-2 bg-wave text-white rounded-xl py-3 font-semibold text-sm"
          >
            <Share2 size={16} /> View in Feed
          </Link>
        )}
        <Link
          href={`/ensemble/${ensembleId}`}
          className="flex-1 flex items-center justify-center gap-2 bg-mist text-ink rounded-xl py-3 font-semibold text-sm"
        >
          Back to Ensemble
        </Link>
      </div>
    </div>
  )
}
