import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useEffect, useMemo } from 'react'
import {
  MapOutbreak,
  RegionGroup,
  SEVERITY_COLOR,
  SEVERITY_DESCRIPTION,
  SEVERITY_LABEL,
  dataAttribution,
  formatEpiWeek,
  formatIsoDate,
  groupByRegion,
} from '../utils/outbreaks'

export type MapViewMode = 'markers' | 'intensity'

interface RealMapProps {
  outbreaks: MapOutbreak[]
  zoom?: number
  center?: [number, number]
  /** markers: círculos de tamanho fixo. intensity: área do círculo proporcional ao número de casos. */
  mode?: MapViewMode
}

const MIN_RADIUS = 6
const MAX_RADIUS = 34

function radiusFor(group: RegionGroup, mode: MapViewMode, maxCases: number): number {
  if (mode === 'markers') return 10
  if (maxCases <= 0) return MIN_RADIUS
  // Raiz quadrada: a ÁREA do círculo fica proporcional aos casos (somados entre as doenças).
  return MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * Math.sqrt(group.cases / maxCases)
}

// Recentraliza o mapa quando as coordenadas do usuário chegam
function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

// Créditos dos dados conforme o que está no mapa: InfoDengue só quando há dado dele,
// e o aviso de dados fictícios quando houver. O crédito do OpenStreetMap fica no TileLayer.
function DataAttribution({ text }: { text: string | null }) {
  const map = useMap()
  useEffect(() => {
    if (!text) return
    map.attributionControl.addAttribution(text)
    return () => {
      map.attributionControl.removeAttribution(text)
    }
  }, [map, text])
  return null
}

function GroupPopup({ group }: { group: RegionGroup }) {
  return (
    <div className="text-sm min-w-[200px]">
      <p className="font-semibold text-slate-800">{group.city} — {group.state}</p>
      <ul className="mt-1.5 space-y-1.5">
        {group.items.map(item => {
          const color = SEVERITY_COLOR[item.severity]
          return (
            <li key={item.id} className="border-t border-slate-100 pt-1.5 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-slate-700">{item.disease}</strong>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                  style={{ background: color + '20', color }}
                  title={SEVERITY_DESCRIPTION[item.severity]}
                >
                  {SEVERITY_LABEL[item.severity]}
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                Casos notificados: <strong>{item.cases.toLocaleString('pt-BR')}</strong>
                {item.estimatedCases !== null && <> · estimados: <strong>{item.estimatedCases.toLocaleString('pt-BR')}</strong></>}
              </p>
              {item.latestWeekStart && (
                <p className="text-[11px] text-slate-400">
                  {formatEpiWeek(item.latestEpiWeek)} · semana de {formatIsoDate(item.latestWeekStart)}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      {group.includesDemoData && <p className="text-[11px] text-amber-700 mt-1.5">Inclui dados fictícios de demonstração</p>}
    </div>
  )
}

export default function RealMap({ outbreaks, zoom = 4, center, mode = 'markers' }: RealMapProps) {
  const defaultCenter: [number, number] = [-14.235, -51.9253]
  // Um marcador por município, com a cor da doença mais grave e todas as doenças no popup.
  const groups = useMemo(() => groupByRegion(outbreaks), [outbreaks])
  const attribution = useMemo(() => dataAttribution(outbreaks), [outbreaks])
  const maxCases = groups.reduce((max, g) => Math.max(max, g.cases), 0)
  // Maiores primeiro: os círculos menores ficam por cima e continuam clicáveis.
  const ordered = mode === 'intensity' ? [...groups].sort((a, b) => b.cases - a.cases) : groups

  return (
    <MapContainer center={center ?? defaultCenter} zoom={zoom} scrollWheelZoom={true} className="w-full h-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DataAttribution text={attribution} />

      {center && <RecenterMap center={center} zoom={zoom} />}

      {ordered.map(group => {
        const color = SEVERITY_COLOR[group.severity]
        return (
          <CircleMarker
            key={`${group.regionId}:${mode}`}
            center={group.coordinates}
            radius={radiusFor(group, mode, maxCases)}
            pathOptions={{ color, fillColor: color, fillOpacity: mode === 'intensity' ? 0.45 : 0.7, weight: 2 }}
          >
            <Popup>
              <GroupPopup group={group} />
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
