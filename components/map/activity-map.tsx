"use client"

import { MapContainer, TileLayer, Polyline, CircleMarker } from "react-leaflet"
import "leaflet/dist/leaflet.css"

interface Props {
  points: { lat: number; lng: number }[]
  progress?: number   // 0–1, drives the animated dot
}

export default function ActivityMap({ points, progress }: Props) {
  const positions = points.map((p) => [p.lat, p.lng] as [number, number])
  const center: [number, number] = positions.length > 0 ? positions[0] : [51.505, -0.09]

  // Interpolate dot position along the track
  const dotIndex =
    progress !== undefined && progress > 0 && positions.length > 1
      ? Math.min(
          Math.floor(progress * (positions.length - 1)),
          positions.length - 1
        )
      : null
  const dotPos = dotIndex !== null ? positions[dotIndex] : null

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={20}
      />

      {/* Route polyline — Strava-style rounded stroke */}
      {positions.length > 1 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: "#14B8A6", weight: 5, opacity: 1, lineCap: "round", lineJoin: "round" }}
        />
      )}

      {/* Start dot */}
      {positions.length > 0 && (
        <CircleMarker
          center={positions[0]}
          radius={7}
          pathOptions={{ color: "#fff", fillColor: "#14B8A6", fillOpacity: 1, weight: 2.5 }}
        />
      )}

      {/* Animated position dot — shown only when player is active */}
      {dotPos && (
        <CircleMarker
          center={dotPos}
          radius={10}
          pathOptions={{ color: "#fff", fillColor: "#F97316", fillOpacity: 1, weight: 3 }}
        />
      )}
    </MapContainer>
  )
}
