import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import { useWaterQuality } from '../context/WaterQualityContext'
import { compareSensorToLocation, simulateLocationWaterQuality } from '../services/LocationWaterQuality'
import {
  getNearestLocation,
  getNearbyLocations,
  calculateWhoRiskLevel,
  compareWithDataset,
} from '../services/DatasetService'
import { waterQualityDataset, getDataSources, filterBySource } from '../data/waterQualityDataset'
import LocationDataCards from './LocationDataCards'
import WhoRiskCard from './WhoRiskCard'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_LOCATION = {
  lat: 28.6139,
  lon: 77.2090,
  label: 'Default Region',
}

async function reverseGeocodeCity(lat, lon, signal) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    lat,
  )}&lon=${encodeURIComponent(lon)}`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!res.ok) throw new Error(`Reverse geocoding failed (${res.status})`)
  const json = await res.json()
  const address = json?.address || {}
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.suburb ||
    address.county ||
    address.state ||
    address.country
  return city || 'Unknown Location'
}

async function forwardGeocode(query, signal) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
    query,
  )}`
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal })
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`)
  const json = await res.json()
  const hit = Array.isArray(json) ? json[0] : null
  if (!hit) return null
  return {
    lat: Number(Number(hit.lat).toFixed(6)),
    lon: Number(Number(hit.lon).toFixed(6)),
    label: hit.display_name || 'Search Result',
  }
}

function MetricCard({ title, unit, sensorValue, locationValue, diffValue, verdict, explanation }) {
  const isBetter = verdict === 'better'
  const isSimilar = verdict === 'similar'

  const icon = isSimilar ? 'compare_arrows' : isBetter ? 'check_circle' : 'warning'

  return (
    <div
      className={[
        'glass-panel rounded-xl p-5 border relative overflow-hidden',
        isSimilar
          ? 'border-outline-variant/20'
          : isBetter
            ? 'border-secondary/30'
            : 'border-error/30',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase mb-2">
            {title}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="surface-container-highest rounded-lg p-3 border border-outline-variant/10">
              <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1">
                Your Water
              </p>
              <p className="font-headline font-bold text-white">
                {sensorValue} <span className="text-slate-400 text-xs">{unit}</span>
              </p>
            </div>
            <div className="surface-container-highest rounded-lg p-3 border border-outline-variant/10">
              <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1">
                Location Water
              </p>
              <p className="font-headline font-bold text-white">
                {locationValue} <span className="text-slate-400 text-xs">{unit}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 min-w-[120px]">
          <span
            className={[
              'px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border border-outline-variant/10',
              isSimilar
                ? 'bg-surface-container-highest text-slate-300'
                : isBetter
                  ? 'bg-secondary/15 text-secondary'
                  : 'bg-error/15 text-error',
            ].join(' ')}
          >
            {isSimilar ? 'SIMILAR' : isBetter ? 'BETTER' : 'WORSE'}
          </span>
          <span
            className={`material-symbols-outlined ${
              isSimilar ? 'text-slate-500' : isBetter ? 'text-secondary' : 'text-error'
            }`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
          <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">
            Δ {diffValue} {unit}
          </p>
        </div>
      </div>

      <p className="text-slate-400 text-xs leading-relaxed mt-3">{explanation}</p>
    </div>
  )
}

function RecenterOnChange({ lat, lon }) {
  const map = useMap()
  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
    map.setView([lat, lon], map.getZoom(), { animate: true })
  }, [lat, lon, map])
  return null
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      const lat = Number(e.latlng.lat.toFixed(6))
      const lon = Number(e.latlng.lng.toFixed(6))
      onSelect({ lat, lon })
    },
  })
  return null
}

function Bars({ sensor, location }) {
  const metrics = [
    { key: 'ph', label: 'pH', s: sensor.ph, l: location.ph, max: 14 },
    { key: 'tds', label: 'TDS', s: sensor.tds, l: location.tds, max: Math.max(600, sensor.tds, location.tds) },
    { key: 'temperature', label: 'Temp', s: sensor.temp, l: location.temperature, max: 50 },
    { key: 'ec', label: 'EC', s: sensor.ec, l: location.ec, max: Math.max(2000, sensor.ec, location.ec) },
  ]

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">
          Quick Comparison
        </h4>
        <div className="flex items-center gap-3 text-[9px] font-bold tracking-widest uppercase text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-primary/80"></span> Your
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-slate-500/60"></span> Location
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {metrics.map((m) => {
          const sw = Math.round((m.s / m.max) * 100)
          const lw = Math.round((m.l / m.max) * 100)
          return (
            <div key={m.key} className="surface-container-highest rounded-lg p-3 border border-outline-variant/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                  {m.label}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {m.s} / {m.l}
                </span>
              </div>
              <div className="h-2 w-full bg-surface-container-highest/50 rounded-full overflow-hidden">
                <div className="h-full flex gap-1 px-1 items-center">
                  <div
                    className="h-1.5 rounded-full bg-primary/80"
                    style={{ width: `${clampPercent(sw)}%` }}
                    title="Your Water"
                  ></div>
                  <div
                    className="h-1.5 rounded-full bg-slate-500/60"
                    style={{ width: `${clampPercent(lw)}%` }}
                    title="Location Water"
                  ></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function clampPercent(n) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

export default function LocationBasedComparison() {
  const { metrics } = useWaterQuality()

  const [coords, setCoords] = useState({ lat: DEFAULT_LOCATION.lat, lon: DEFAULT_LOCATION.lon })
  const [locationLabel, setLocationLabel] = useState(DEFAULT_LOCATION.label)
  const [geoStatus, setGeoStatus] = useState('idle') // idle | locating | ok | denied | error
  const [geoError, setGeoError] = useState('')
  const [selectionSource, setSelectionSource] = useState('default') // default | device | click | search

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const searchAbortRef = useRef(null)

  // New state for dataset integration
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [nearbyLocations, setNearbyLocations] = useState([])
  const [sourceFilter, setSourceFilter] = useState('All')
  const [showNearby, setShowNearby] = useState(false)

  const sensor = useMemo(
    () => ({
      temp: Number(metrics?.temp ?? 0),
      ph: Number(metrics?.ph ?? 0),
      tds: Number(metrics?.tds ?? 0),
      ec: Number(metrics?.ec ?? 0),
    }),
    [metrics],
  )

  const locationWater = useMemo(
    () => simulateLocationWaterQuality(coords.lat, coords.lon),
    [coords.lat, coords.lon],
  )

  const comparison = useMemo(
    () => compareSensorToLocation(sensor, locationWater),
    [sensor, locationWater],
  )

  // WHO Risk Assessment for both sensor and location
  const sensorRiskAssessment = useMemo(
    () =>
      calculateWhoRiskLevel({
        ph: sensor.ph,
        tds: sensor.tds,
        temperature: sensor.temp,
        ec: sensor.ec,
      }),
    [sensor],
  )

  const locationRiskAssessment = useMemo(
    () => {
      if (!selectedLocation) return null
      return calculateWhoRiskLevel({
        ph: selectedLocation.ph,
        tds: selectedLocation.tds,
        temperature: selectedLocation.temperature,
        ec: selectedLocation.ec,
      })
    },
    [selectedLocation],
  )

  // Comparison with dataset location
  const datasetComparison = useMemo(
    () => {
      if (!selectedLocation) return null
      return compareWithDataset(sensor, selectedLocation)
    },
    [sensor, selectedLocation],
  )

  const requestLocation = () => {
    if (!navigator?.geolocation) {
      setGeoStatus('error')
      setGeoError('Geolocation is not supported in this environment.')
      setCoords({ lat: DEFAULT_LOCATION.lat, lon: DEFAULT_LOCATION.lon })
      setLocationLabel(DEFAULT_LOCATION.label)
      setSelectionSource('default')
      return
    }

    setGeoStatus('locating')
    setGeoError('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6))
        const lon = Number(pos.coords.longitude.toFixed(6))
        setCoords({ lat, lon })
        setGeoStatus('ok')
        setSelectionSource('device')
      },
      (err) => {
        const denied = err?.code === 1
        setGeoStatus(denied ? 'denied' : 'error')
        setGeoError(denied ? 'Location permission denied. Using default location.' : err?.message || 'Unable to fetch location.')
        setCoords({ lat: DEFAULT_LOCATION.lat, lon: DEFAULT_LOCATION.lon })
        setLocationLabel(DEFAULT_LOCATION.label)
        setSelectionSource('default')
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60_000 },
    )
  }

  const updateSelectedLocation = ({ lat, lon }, source) => {
    setCoords({ lat, lon })
    setGeoStatus('ok')
    setGeoError('')
    setSelectionSource(source)
  }

  const runSearch = async (e) => {
    e?.preventDefault?.()
    const q = searchQuery.trim()
    if (!q) return

    if (searchAbortRef.current) searchAbortRef.current.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller

    setIsSearching(true)
    setSearchError('')

    try {
      const hit = await forwardGeocode(q, controller.signal)
      if (!hit) {
        setSearchError('No results found.')
        return
      }
      updateSelectedLocation({ lat: hit.lat, lon: hit.lon }, 'search')
      setLocationLabel(hit.label)
    } catch (err) {
      if (err?.name === 'AbortError') return
      setSearchError('Search failed.')
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    requestLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    reverseGeocodeCity(coords.lat, coords.lon, controller.signal)
      .then((city) => setLocationLabel(city))
      .catch(() => {
        // Keep existing label; reverse geocoding is best-effort
      })
    return () => controller.abort()
  }, [coords.lat, coords.lon])

  // Find nearest location from dataset
  useEffect(() => {
    const filtered = sourceFilter === 'All' ? waterQualityDataset : filterBySource(sourceFilter)
    const nearest = getNearestLocation(coords.lat, coords.lng, filtered)
    setSelectedLocation(nearest)

    // Get nearby locations for optional display
    const nearby = getNearbyLocations(coords.lat, coords.lng, 50, filtered)
    setNearbyLocations(nearby.slice(0, 5))
  }, [coords.lat, coords.lng, sourceFilter])

  const position = [coords.lat, coords.lon]

  const dataSources = getDataSources()

  return (
    <section className="mb-12">
      <h2 className="text-on-surface font-headline font-bold text-xl tracking-tight mb-6 flex items-center gap-3">
        <span className="w-1.5 h-6 bg-primary rounded-full"></span>
        Location-Based Comparison
      </h2>

      {/* Source Filter */}
      <div className="mb-6 glass-panel rounded-xl p-4 border border-outline-variant/20">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Filter by Source:</p>
          <div className="flex flex-wrap gap-2">
            {['All', ...dataSources].map((source) => (
              <button
                key={source}
                onClick={() => setSourceFilter(source)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                  sourceFilter === source
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/40'
                    : 'bg-surface-container/50 text-slate-400 hover:bg-surface-container border border-outline-variant/20'
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-5 border-b border-outline-variant/10 flex items-start justify-between gap-4">
            <div>
              <p className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase mb-1">
                Your Location
              </p>
              <p className="font-headline font-bold text-white">{locationLabel}</p>
              <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-1">
                Lat {coords.lat} · Lon {coords.lng}
              </p>
              <p className="text-[9px] text-slate-600 font-bold tracking-widest uppercase mt-2">
                {selectionSource === 'click'
                  ? 'Selected on map'
                  : selectionSource === 'search'
                    ? 'Selected by search'
                    : selectionSource === 'device'
                      ? 'Using device location'
                      : 'Using default location'}
              </p>
              {selectedLocation && (
                <div className="mt-3 p-3 rounded-lg bg-secondary/10 border border-secondary/30">
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Nearest Dataset Location:</p>
                  <p className="text-xs text-white font-headline font-bold mt-1">{selectedLocation.name}</p>
                  <p className="text-[10px] text-secondary mt-1">{selectedLocation.source}</p>
                </div>
              )}
              {(geoStatus === 'denied' || geoStatus === 'error') && (
                <p className="text-[10px] text-tertiary font-bold tracking-wide mt-2">
                  {geoError}
                </p>
              )}
              {searchError && (
                <p className="text-[10px] text-tertiary font-bold tracking-wide mt-2">{searchError}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-3">
              <form onSubmit={runSearch} className="flex items-center gap-2">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search place"
                  className="surface-container-highest border border-outline-variant/10 rounded-full px-4 py-2 text-[10px] font-bold tracking-widest uppercase text-slate-300 placeholder:text-slate-600 w-[170px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="submit"
                  className="glass-panel text-primary font-headline font-bold text-[10px] py-2 px-3 rounded-full flex items-center gap-2 hover:bg-surface-bright/20 transition-all active:scale-95"
                  disabled={isSearching}
                  title="Search"
                >
                  <span className={`material-symbols-outlined text-sm ${isSearching ? 'animate-spin text-white' : ''}`}>
                    search
                  </span>
                </button>
              </form>

              <button
                onClick={requestLocation}
                className="glass-panel text-primary font-headline font-bold text-[10px] py-2.5 px-4 rounded-full flex items-center gap-2 hover:bg-surface-bright/20 transition-all active:scale-95"
                disabled={geoStatus === 'locating'}
              >
                <span className={`material-symbols-outlined text-sm ${geoStatus === 'locating' ? 'animate-spin text-white' : ''}`}>
                  my_location
                </span>
                {geoStatus === 'locating' ? 'LOCATING…' : 'USE MY LOCATION'}
              </button>
            </div>
          </div>

          <div className="h-[260px]">
            <MapContainer
              center={position}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <RecenterOnChange lat={coords.lat} lon={coords.lng} />
              <MapClickHandler
                onSelect={({ lat, lon }) => {
                  updateSelectedLocation({ lat, lon }, 'click')
                }}
              />
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={position}>
                <Popup>
                  <div className="text-xs">
                    <div className="font-bold">{locationLabel}</div>
                    <div className="text-slate-600 font-bold uppercase tracking-widest text-[9px] mt-1">
                      Selected Location
                    </div>
                    <div>
                      {coords.lat}, {coords.lng}
                    </div>
                  </div>
                </Popup>
              </Marker>
              {/* Plot dataset locations as markers */}
              {showNearby && nearbyLocations.map((loc) => (
                <Marker 
                  key={loc.id} 
                  position={[loc.lat, loc.lng]}
                  icon={L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-blue.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                  })}
                >
                  <Popup>
                    <div className="text-xs">
                      <div className="font-bold">{loc.name}</div>
                      <div className="text-slate-600 text-[9px] font-bold mt-1">{loc.source}</div>
                      <div className="text-[9px] mt-2">pH: {loc.ph}</div>
                      <div className="text-[9px]">TDS: {loc.tds} ppm</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="p-3 border-t border-outline-variant/10 flex items-center gap-2">
            <button
              onClick={() => setShowNearby(!showNearby)}
              className={`text-xs font-bold px-3 py-2 rounded-lg transition-all ${
                showNearby
                  ? 'bg-primary/20 text-primary'
                  : 'bg-surface-container/50 text-slate-400 hover:bg-surface-container'
              }`}
            >
              {showNearby ? '✓ Show' : 'Show'} Nearby Locations ({nearbyLocations.length})
            </button>
          </div>
        </div>

        <Bars sensor={sensor} location={locationWater} />
      </div>

      {/* Dataset Comparison Cards */}
      <div className="mt-8">
        <h3 className="text-lg font-headline font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">storage</span>
          Real-Time Comparison with Government Dataset
        </h3>
        <LocationDataCards
          locationData={selectedLocation}
          sensorData={{
            ...sensor,
            timestamp: new Date().toISOString(),
            deviceName: 'Water Quality Sensor',
          }}
          comparisonData={datasetComparison}
        />
      </div>

      {/* WHO Risk Assessment Cards */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-headline font-bold text-white tracking-tight mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">sensors</span>
            Your Sensor Data Risk
          </h3>
          <WhoRiskCard riskData={sensorRiskAssessment} />
        </div>
        {selectedLocation && (
          <div>
            <h3 className="text-lg font-headline font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">location_on</span>
              Dataset Location Risk ({selectedLocation.source})
            </h3>
            <WhoRiskCard riskData={locationRiskAssessment} />
          </div>
        )}
      </div>
    </section>
  )
}

