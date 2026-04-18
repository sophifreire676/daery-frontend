import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'

interface Outbreak {
  id: number
  city: string
  state: string
  disease: string
  cases: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  coordinates: [number, number]
}

interface RealMapProps {
  outbreaks: Outbreak[]
  zoom?: number
  center?: [number, number]
}

const severityColor = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
}

// Componente auxiliar: recentraliza o mapa quando as coords do usuário chegarem
function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

export default function RealMap({ outbreaks, zoom = 4, center }: RealMapProps) {
  const defaultCenter: [number, number] = [-14.235, -51.9253]

  return (
    <MapContainer
      center={center ?? defaultCenter}
      zoom={zoom}
      scrollWheelZoom={true}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Recentraliza quando o usuário concede geolocalização */}
      {center && <RecenterMap center={center} zoom={zoom} />}

      {outbreaks.map(item => (
        <CircleMarker
          key={item.id}
          center={item.coordinates}
          radius={10}
          pathOptions={{
            color:       severityColor[item.severity],
            fillColor:   severityColor[item.severity],
            fillOpacity: 0.7,
            weight:      2,
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-slate-800">{item.city} — {item.state}</p>
              <p className="text-slate-500 mt-0.5">Doença: <strong>{item.disease}</strong></p>
              <p className="text-slate-500">Casos: <strong>{item.cases.toLocaleString('pt-BR')}</strong></p>
              <span
                className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: severityColor[item.severity] + '20', color: severityColor[item.severity] }}
              >
                {item.severity === 'critical' ? 'Crítico' : item.severity === 'high' ? 'Alto' : item.severity === 'medium' ? 'Médio' : 'Baixo'}
              </span>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
