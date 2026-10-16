import { describe, expect, it } from 'vitest'
import type { Alert, SummaryItem } from '../types/api'
import { outbreaksToCsv } from '../utils/csv'
import {
  countBySeverity,
  dataAttribution,
  filterOutbreaks,
  formatPlatformReports,
  groupByRegion,
  hasPlatformReports,
  formatEpiWeek,
  formatIsoDate,
  latestWeek,
  sortAlertsByRelevance,
  toOutbreak,
} from '../utils/outbreaks'
import { periodError, toSummaryPeriod } from '../utils/period'

const item = (overrides: Partial<SummaryItem> = {}): SummaryItem => ({
  regionId: 'r-ana',
  regionName: 'Anápolis',
  uf: 'GO',
  latitude: -16.32866,
  longitude: -48.95295,
  diseaseId: 'd-den',
  diseaseName: 'Dengue',
  totalCases: 63,
  estimatedCases: 70,
  latestWeekStart: '2026-10-04',
  latestEpiWeek: 202640,
  latestAlertLevel: 3,
  severity: 'HIGH',
  platformReports: { suspected: 0, confirmed: 0, deaths: 0, suppressed: false },
  sources: ['InfoDengue'],
  includesDemoData: false,
  ...overrides,
})

describe('toOutbreak', () => {
  it('maps the API contract to the map format', () => {
    expect(toOutbreak(item())).toMatchObject({
      id: 'r-ana:d-den',
      city: 'Anápolis',
      state: 'GO',
      disease: 'Dengue',
      cases: 63,
      severity: 'high',
      coordinates: [-16.32866, -48.95295],
    })
  })

  it('keeps items without severity or coordinates (shown in lists, not on the map)', () => {
    const o = toOutbreak(item({ severity: null, latitude: null, longitude: null }))
    expect(o.severity).toBe('unknown')
    expect(o.coordinates).toBeNull()
  })
})

describe('filterOutbreaks', () => {
  const list = [
    toOutbreak(item()),
    toOutbreak(item({ regionId: 'r-gyn', regionName: 'Goiânia', severity: 'CRITICAL', diseaseName: 'Zika', diseaseId: 'd-zik' })),
  ]

  it('filters by severity', () => {
    expect(filterOutbreaks(list, { severity: 'critical' }).map(o => o.city)).toEqual(['Goiânia'])
  })

  it('searches city, disease and state ignoring accents and case', () => {
    expect(filterOutbreaks(list, { search: 'anapolis' }).map(o => o.city)).toEqual(['Anápolis'])
    expect(filterOutbreaks(list, { search: 'ZIKA' }).map(o => o.city)).toEqual(['Goiânia'])
    expect(filterOutbreaks(list, { search: 'go' })).toHaveLength(2)
  })

  it('counts by severity', () => {
    expect(countBySeverity(list)).toEqual({ critical: 1, high: 1, medium: 0, low: 0, unknown: 0 })
  })
})

describe('formatting', () => {
  it('formats ISO dates without timezone shifts', () => {
    expect(formatIsoDate('2026-10-04')).toBe('04/10/2026')
    expect(formatIsoDate(null)).toBe('—')
  })

  it('formats epidemiological weeks', () => {
    expect(formatEpiWeek(202640)).toBe('SE 40/2026')
    expect(formatEpiWeek(null)).toBe('')
  })

  it('finds the most recent week', () => {
    expect(latestWeek([toOutbreak(item({ latestWeekStart: '2026-09-27' })), toOutbreak(item())])).toBe('2026-10-04')
  })
})

describe('sortAlertsByRelevance', () => {
  const alert = (id: string, level: number, lat: number, lng: number): Alert => ({
    id, regionId: id, regionName: id, uf: 'GO', latitude: lat, longitude: lng, diseaseId: 'd', diseaseName: 'Dengue',
    alertLevel: level, severity: level === 4 ? 'CRITICAL' : 'HIGH', epiWeek: 202640, weekStart: '2026-10-04',
    title: id, message: '', recommendations: [], source: 'InfoDengue', isDemo: false,
  })

  it('puts the most severe first, then the closest to the user', () => {
    const near = alert('Anápolis', 3, -16.33, -48.95)
    const far = alert('Salvador', 3, -12.97, -38.5)
    const severe = alert('Rio', 4, -22.9, -43.17)
    const sorted = sortAlertsByRelevance([far, near, severe], [-16.68, -49.25])
    expect(sorted.map(a => a.id)).toEqual(['Rio', 'Anápolis', 'Salvador'])
  })
})

describe('outbreaksToCsv', () => {
  it('produces an Excel-friendly CSV (BOM, semicolon, decimal comma, quoted text)', () => {
    const csv = outbreaksToCsv(
      [toOutbreak(item({ regionName: 'Cidade; com "aspas"', estimatedCases: 70, sources: ['InfoDengue', '[FICTÍCIO] Hospital'] , includesDemoData: true }))],
      { startDate: '2026-08-16', endDate: '2026-10-10' }
    )
    const [header, row] = csv.replace('\uFEFF', '').split('\r\n')
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(header.split(';')[0]).toBe('municipio')
    expect(row).toContain('"Cidade; com ""aspas"""')
    expect(row).toContain(';Alto;')
    expect(row).toContain('InfoDengue | [FICTÍCIO] Hospital')
    expect(row.endsWith(';sim')).toBe(true)
  })
})

describe('Daery case counts with small-count suppression', () => {
  it('treats a hidden count (null) as "there are cases"', () => {
    expect(hasPlatformReports({ suspected: 0, confirmed: 0, deaths: 0, suppressed: false })).toBe(false)
    expect(hasPlatformReports({ suspected: 0, confirmed: 0, deaths: null, suppressed: true })).toBe(true)
    expect(hasPlatformReports({ suspected: 7, confirmed: 0, deaths: 0, suppressed: false })).toBe(true)
  })

  it('shows a hidden count as "menos de 5", never as zero', () => {
    expect(formatPlatformReports({ suspected: 12, confirmed: 0, deaths: null, suppressed: true })).toBe(
      '12 suspeitos · 0 confirmados · menos de 5 óbitos'
    )
  })

  it('exports a hidden count as "<5" in the CSV', () => {
    const csv = outbreaksToCsv(
      [toOutbreak(item({ platformReports: { suspected: 6, confirmed: null, deaths: 0, suppressed: true } }))],
      { startDate: '2026-08-16', endDate: '2026-10-10' }
    )
    expect(csv.split('\r\n')[1]).toContain(';6;<5;0;')
  })
})

describe('groupByRegion', () => {
  const dengue = toOutbreak(item({ severity: 'MEDIUM', totalCases: 40 }))
  const zika = toOutbreak(item({ diseaseId: 'd-zik', diseaseName: 'Zika', severity: 'CRITICAL', totalCases: 5 }))
  const gyn = toOutbreak(item({ regionId: 'r-gyn', regionName: 'Goiânia', latitude: -16.68, longitude: -49.25, totalCases: 9 }))

  it('draws one marker per municipality, colored by its most severe disease', () => {
    const groups = groupByRegion([dengue, zika, gyn])
    expect(groups).toHaveLength(2)
    const ana = groups.find(g => g.regionId === 'r-ana')!
    expect(ana.severity).toBe('critical')
    expect(ana.cases).toBe(45)
    expect(ana.items.map(i => i.disease)).toEqual(['Zika', 'Dengue'])
  })

  it('leaves out municipalities without coordinates', () => {
    const noCoords = toOutbreak(item({ regionId: 'r-x', latitude: null, longitude: null }))
    expect(groupByRegion([noCoords])).toEqual([])
  })

  it('flags the group when any disease has demo data', () => {
    const demo = toOutbreak(item({ diseaseId: 'd-chi', includesDemoData: true, sources: ['[FICTÍCIO] Hospital'] }))
    expect(groupByRegion([dengue, demo])[0].includesDemoData).toBe(true)
  })
})

describe('dataAttribution', () => {
  it('credits InfoDengue only when its data is on the map', () => {
    expect(dataAttribution([toOutbreak(item())])).toBe('Dados: InfoDengue (Fiocruz/FGV)')
    expect(dataAttribution([toOutbreak(item({ sources: ['[FICTÍCIO] Hospital'], includesDemoData: true }))])).toBe(
      'Inclui dados fictícios de demonstração'
    )
    expect(dataAttribution([])).toBeNull()
  })
})

describe('period', () => {
  it('accepts empty dates (API default) and a valid range', () => {
    expect(periodError({ startDate: '', endDate: '' })).toBeNull()
    expect(periodError({ startDate: '2026-08-01', endDate: '2026-10-01' })).toBeNull()
  })

  it('rejects an inverted range, more than a year, or a future start alone', () => {
    expect(periodError({ startDate: '2026-10-09', endDate: '2026-10-01' })).toMatch(/anterior/)
    expect(periodError({ startDate: '2024-01-01', endDate: '2026-01-01' })).toMatch(/1 ano/)
    expect(periodError({ startDate: '2999-01-01', endDate: '' })).toMatch(/futuro/)
  })

  it('only sends the dates that were filled in', () => {
    expect(toSummaryPeriod({ startDate: '2026-08-01', endDate: '' })).toEqual({ startDate: '2026-08-01' })
  })
})
