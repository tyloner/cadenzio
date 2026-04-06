"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet"
import type { GpsPoint } from "@/lib/music-engine/gps-processor"
import "leaflet/dist/leaflet.css"

function AutoCenter({ points }: { points: GpsPoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 0) {
      const last = points[points.length - 1]
      map.panTo([last.lat, last.lng], { animate: true, duration: 0.5 })
    }
  }, [points, map])
  return null
}

export default function RecordMap({ points }: { points: GpsPoint[] }) {
  const positions = points.map((p) => [p.lat, p.lng] as [number, number])
  const center: [number, number] = points.length > 0
    ? [points[points.length - 1].lat, points[points.length - 1].lng]
    : [51.505, -0.09]

  return (
    <MapContainer
      center={center}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={20}
      />
      {positions.length > 1 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: "#14B8A6", weight: 5, opacity: 1, lineCap: "round", lineJoin: "round" }}
        />
      )}
      <AutoCenter points={points} />
    </MapContainer>
  )
}
