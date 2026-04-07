"use client"

import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { Crosshair } from "lucide-react"

interface Props {
  points: { lat: number; lng: number }[]
  progress?: number   // 0–1, drives the animated dot
}

function CenterButton({ points }: { points: [number, number][] }) {
  const map = useMap()

  function handleCenter() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { animate: true, duration: 0.8 }),
        () => {
          // Fallback to route start
          if (points.length > 0) map.flyTo(points[0], 15, { animate: true, duration: 0.8 })
        }
      )
    } else if (points.length > 0) {
      map.flyTo(points[0], 15, { animate: true, duration: 0.8 })
    }
  }

  return (
    <button
      onClick={handleCenter}
      className="absolute bottom-3 right-3 z-[1000] bg-surface border border-border rounded-xl w-10 h-10 flex items-center justify-center shadow-md hover:border-wave/50 transition-colors"
      title="Center on my location"
    >
      <Crosshair size={18} className="text-wave" />
    </button>
  )
}

export default function ActivityMap({ points, progress }: Props) {
  const positions = points.map((p) => [p.lat, p.lng] as [number, number])
  const center: [number, number] = positions.length > 0 ? positions[0] : [51.505, -0.09]

  const dotIndex =
    progress !== undefined && progress > 0 && positions.length > 1
      ? Math.min(
          Math.floor(progress * (positions.length - 1)),
          positions.length - 1
        )
      : null
  const dotPos = dotIndex !== null ? positions[dotIndex] : null

  return (
    <div className="relative h-full w-full">
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

        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{ color: "#14B8A6", weight: 5, opacity: 1, lineCap: "round", lineJoin: "round" }}
          />
        )}

        {positions.length > 0 && (
          <CircleMarker
            center={positions[0]}
            radius={7}
            pathOptions={{ color: "#fff", fillColor: "#14B8A6", fillOpacity: 1, weight: 2.5 }}
          />
        )}

        {dotPos && (
          <CircleMarker
            center={dotPos}
            radius={10}
            pathOptions={{ color: "#fff", fillColor: "#F97316", fillOpacity: 1, weight: 3 }}
          />
        )}

        <CenterButton points={positions} />
      </MapContainer>
    </div>
  )
}
