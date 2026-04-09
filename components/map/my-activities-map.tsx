"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import Link from "next/link"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface Activity {
  id: string
  title: string
  distanceM: number | null
  gpsTrack: unknown
  composition: { genre: string } | null
}

const GENRE_COLOR: Record<string, string> = {
  blues: "#3B82F6",
  classical: "#8B5CF6",
  jazz: "#F59E0B",
  ambient: "#14B8A6",
  electronic: "#EC4899",
}

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) return
    const bounds = L.latLngBounds(positions)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [map, positions])
  return null
}

export default function MyActivitiesMap({ activities }: { activities: Activity[] }) {
  const mapped = activities
    .map((a) => {
      const track = a.gpsTrack as { lat: number; lng: number }[]
      if (!track || track.length === 0) return null
      return { ...a, start: [track[0].lat, track[0].lng] as [number, number] }
    })
    .filter(Boolean) as (Activity & { start: [number, number] })[]

  const allStarts = mapped.map((a) => a.start)
  const defaultCenter: [number, number] = allStarts[0] ?? [51.505, -0.09]

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      zoomControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        maxZoom={20}
      />
      <FitBounds positions={allStarts} />
      {mapped.map((a) => {
        const color = GENRE_COLOR[a.composition?.genre ?? ""] ?? "#14B8A6"
        return (
          <Marker key={a.id} position={a.start} icon={makeIcon(color)}>
            <Popup>
              <div style={{ fontFamily: "inherit", minWidth: 140 }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: "#0F172A", marginBottom: 2 }}>{a.title}</p>
                {a.composition && (
                  <p style={{ fontSize: 11, color: "#64748B", marginBottom: 4, textTransform: "capitalize" }}>
                    {a.composition.genre}
                  </p>
                )}
                <Link href={`/activity/${a.id}`} style={{ fontSize: 12, color: "#14B8A6", textDecoration: "none", fontWeight: 500 }}>
                  Open →
                </Link>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
