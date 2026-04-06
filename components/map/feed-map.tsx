"use client"

import { MapContainer, TileLayer, Polyline, Popup } from "react-leaflet"
import Link from "next/link"
import "leaflet/dist/leaflet.css"

interface Activity {
  id: string
  title: string
  gpsTrack: unknown
  user: { name: string | null }
  composition: { genre: string } | null
}

const GENRE_STROKE: Record<string, string> = {
  blues: "#3B82F6",
  classical: "#8B5CF6",
  jazz: "#F59E0B",
  ambient: "#14B8A6",
  electronic: "#EC4899",
}

export default function FeedMap({ activities }: { activities: Activity[] }) {
  const center: [number, number] = [51.505, -0.09]

  const mapped = activities
    .map((a) => {
      const track = a.gpsTrack as { lat: number; lng: number }[]
      if (!track || track.length < 2) return null
      return { ...a, positions: track.map((p) => [p.lat, p.lng] as [number, number]) }
    })
    .filter(Boolean) as (Activity & { positions: [number, number][] })[]

  const firstCenter = mapped[0]?.positions[0] ?? center

  return (
    <MapContainer
      center={firstCenter}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={20}
      />
      {mapped.map((a) => (
        <Polyline
          key={a.id}
          positions={a.positions}
          pathOptions={{
            color: GENRE_STROKE[a.composition?.genre ?? ""] ?? "#14B8A6",
            weight: 5,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }}
        >
          <Popup>
            <div style={{ fontFamily: "inherit" }}>
              <p style={{ fontWeight: 600, fontSize: 13, color: "#0F172A", marginBottom: 2 }}>{a.title}</p>
              <p style={{ fontSize: 11, color: "#64748B", marginBottom: 6 }}>{a.user.name}</p>
              <Link href={`/activity/${a.id}`} style={{ fontSize: 12, color: "#14B8A6", textDecoration: "none", fontWeight: 500 }}>
                View composition →
              </Link>
            </div>
          </Popup>
        </Polyline>
      ))}
    </MapContainer>
  )
}
