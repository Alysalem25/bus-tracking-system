'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L, { LatLngExpression, LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons for Leaflet when bundled
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

interface StationLeafletMapProps {
  selectedLocation: { lat: number; lng: number } | null
  onLocationSelect: (coords: { lat: number; lng: number }) => void
}

interface SearchResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

const ClickHandler: React.FC<{
  onClick: (coords: { lat: number; lng: number }) => void
}> = ({ onClick }) => {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
  })
  return null
}

const StationLeafletMap: React.FC<StationLeafletMapProps> = ({
  selectedLocation,
  onLocationSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const center = useMemo<LatLngExpression>(
    () =>
      selectedLocation
        ? [selectedLocation.lat, selectedLocation.lng]
        : [24.7136, 46.6753], // default center (Riyadh) – adjust to your region if needed
    [selectedLocation]
  )

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearchLoading(true)
    setSearchError(null)

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}`
      )
      const data: SearchResult[] = await res.json()
      setSearchResults(data.slice(0, 5))
      if (data.length === 0) {
        setSearchError('No results found')
      }
    } catch (err) {
      console.error(err)
      setSearchError('Error searching location')
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleChooseResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    onLocationSelect({ lat, lng })
    setSearchResults([])
    setSearchQuery(result.display_name)
  }

  // Close results on outside click (basic)
  useEffect(() => {
    const handleClick = () => {
      setSearchResults([])
    }

    if (searchResults.length > 0) {
      window.addEventListener('click', handleClick)
    }

    return () => {
      window.removeEventListener('click', handleClick)
    }
  }, [searchResults])

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center relative z-[1000]" onClick={e => e.stopPropagation()}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSearch()
            }
          }}
          placeholder="Search for a station or place"
          className="flex-1 border p-2 rounded bg-gray-700 text-white text-sm"
        />
        <button
          type="button"
          className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          disabled={searchLoading}
          onClick={handleSearch}
        >
          {searchLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searchError && (
        <p className="text-xs text-red-400" onClick={e => e.stopPropagation()}>
          {searchError}
        </p>
      )}

      {searchResults.length > 0 && (
        <ul
          className="max-h-40 overflow-auto text-sm bg-gray-900 border border-gray-700 rounded p-2 space-y-1 z-[1000] relative"
          onClick={e => e.stopPropagation()}
        >
          {searchResults.map(result => (
            <li
              key={result.place_id}
              className="cursor-pointer hover:bg-gray-800 p-1 rounded text-gray-200"
              onClick={() => handleChooseResult(result)}
            >
              {result.display_name}
            </li>
          ))}
        </ul>
      )}

      <div className="w-full h-64 rounded overflow-hidden border border-gray-700">
        <MapContainer
          center={center}
          zoom={13}
          className="w-full h-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ClickHandler onClick={onLocationSelect} />
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-400">
        Click on the map to choose station location, or search and select a place.
      </p>
    </div>
  )
}

export default StationLeafletMap


