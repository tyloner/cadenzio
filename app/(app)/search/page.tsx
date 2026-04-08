"use client"

import { useState, useCallback, useRef } from "react"
import { Search, Loader2, Music2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { FollowButton } from "@/components/follow-button"

interface Result {
  username: string
  totalActivities: number
  user: { id: string; name: string | null; image: string | null }
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) { setResults([]); setSearched(false); return }
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: abortRef.current.signal })
        if (res.ok) { setResults(await res.json()); setSearched(true) }
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") setResults([])
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    doSearch(v)
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-ink mb-4">Search</h1>

      {/* Input */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={query}
          onChange={onChange}
          placeholder="Search by name or username…"
          className="w-full pl-9 pr-4 py-3 border border-border rounded-2xl text-sm text-ink bg-mist focus:outline-none focus:ring-2 focus:ring-wave/30"
        />
        {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted animate-spin" />}
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={r.username}>
              <div className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-surface hover:border-wave/30 transition-colors">
                <Link href={`/profile/${r.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                  {r.user.image ? (
                    <Image src={r.user.image} alt={r.user.name ?? ""} width={44} height={44} className="rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-wave/20 flex items-center justify-center text-wave font-bold flex-shrink-0">
                      {r.user.name?.[0] ?? "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">{r.user.name}</p>
                    <p className="text-xs text-muted">@{r.username}</p>
                    <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                      <Music2 size={10} /> {r.totalActivities} composition{r.totalActivities !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
                <FollowButton userId={r.user.id} initialFollowing={false} compact />
              </div>
            </li>
          ))}
        </ul>
      ) : searched && query.length >= 2 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted">No users found for &ldquo;{query}&rdquo;</p>
        </div>
      ) : query.length > 0 && query.length < 2 ? (
        <p className="text-xs text-muted text-center mt-8">Type at least 2 characters…</p>
      ) : (
        <div className="text-center py-16 text-muted">
          <Search size={36} className="mx-auto mb-3 text-border" />
          <p className="text-sm">Search for other composers</p>
        </div>
      )}
    </div>
  )
}
