'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Business {
  id: number
  name: string
  address: string
  lat: number
  lon: number
  phone?: string
  distance: number
}

// ─── Business type → OSM tag mapping ─────────────────────────────────────────

const BUSINESS_TYPES = [
  { label: 'Restaurant',               osmTag: 'amenity=restaurant' },
  { label: 'Cafe / Coffee Shop',        osmTag: 'amenity=cafe' },
  { label: 'Fast Food',                osmTag: 'amenity=fast_food' },
  { label: 'Grocery / Supermarket',    osmTag: 'shop=supermarket' },
  { label: 'Convenience Store',        osmTag: 'shop=convenience' },
  { label: 'Retail / Clothing',        osmTag: 'shop=clothes' },
  { label: 'Hair Salon / Barber',      osmTag: 'shop=hairdresser' },
  { label: 'Hardware / Home Improvement', osmTag: 'shop=hardware' },
  { label: 'Bakery',                   osmTag: 'shop=bakery' },
  { label: 'Pet Shop / Vet',           osmTag: 'shop=pet' },
  { label: 'Gas Station',              osmTag: 'amenity=fuel' },
  { label: 'Gym / Fitness',            osmTag: 'leisure=fitness_centre' },
  { label: 'Ice Cream / Dessert',      osmTag: 'amenity=ice_cream' },
  { label: 'Pharmacy',                 osmTag: 'amenity=pharmacy' },
]

// ─── Utilities ────────────────────────────────────────────────────────────────

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function geocodeZip(zip: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=us&format=json&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'WorkTeen/1.0 (admin outreach tool)' },
  })
  const data: { lat: string; lon: string }[] = await res.json()
  if (!data?.[0]) return null
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
}

async function searchOverpass(
  osmTag: string,
  lat: number,
  lon: number,
  radiusMeters: number,
): Promise<Business[]> {
  const [key, value] = osmTag.split('=')
  const q = `
[out:json][timeout:25];
(
  node["${key}"="${value}"](around:${radiusMeters},${lat},${lon});
  way["${key}"="${value}"](around:${radiusMeters},${lat},${lon});
);
out center tags;
`.trim()

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(q)}`,
  })

  const data: {
    elements: {
      id: number
      lat?: number
      lon?: number
      center?: { lat: number; lon: number }
      tags?: Record<string, string>
    }[]
  } = await res.json()

  return (data.elements ?? [])
    .filter(el => el.tags?.name)
    .map(el => {
      const elLat = el.lat ?? el.center?.lat ?? 0
      const elLon = el.lon ?? el.center?.lon ?? 0
      const tags = el.tags ?? {}
      const houseNum = tags['addr:housenumber'] ? `${tags['addr:housenumber']} ` : ''
      const street   = tags['addr:street'] ?? ''
      const city     = tags['addr:city'] ?? ''
      const address  = [houseNum + street, city].filter(Boolean).join(', ') || 'Address unknown'
      const phone    = tags['phone'] ?? tags['contact:phone'] ?? undefined

      return {
        id: el.id,
        name: tags.name!,
        address,
        lat: elLat,
        lon: elLon,
        phone,
        distance: haversineDistance(lat, lon, elLat, elLon),
      }
    })
    .sort((a, b) => a.distance - b.distance)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadsSearch() {
  const [zip, setZip]             = useState('')
  const [radiusMiles, setRadius]  = useState('2')
  const [osmTag, setOsmTag]       = useState(BUSINESS_TYPES[0].osmTag)
  const [results, setResults]     = useState<Business[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResults([])

    try {
      const coords = await geocodeZip(zip.trim())
      if (!coords) {
        setError('Could not find that zip code. Try another.')
        return
      }
      const radiusMeters = parseFloat(radiusMiles) * 1609.34
      const businesses = await searchOverpass(osmTag, coords.lat, coords.lon, radiusMeters)
      setResults(businesses)
      if (businesses.length === 0) {
        setError('No businesses found. Try a larger radius or different type.')
      }
    } catch {
      setError('Search failed. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedType = BUSINESS_TYPES.find(b => b.osmTag === osmTag)

  return (
    <main className="min-h-screen bg-void pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-3xl text-ink mb-1">Outreach Leads</h1>
          <p className="font-body text-sm text-muted">
            Find local businesses to pitch WorkTeen. Data from OpenStreetMap, no API key or billing needed.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="card mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-xs text-muted mb-1.5" htmlFor="leads-zip">
                Zip Code
              </label>
              <input
                id="leads-zip"
                className="input-field w-full"
                value={zip}
                onChange={e => setZip(e.target.value)}
                placeholder="e.g. 94102"
                required
                pattern="\d{5}"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5" htmlFor="leads-radius">
                Radius
              </label>
              <select
                id="leads-radius"
                className="select-field w-full"
                value={radiusMiles}
                onChange={e => setRadius(e.target.value)}
              >
                <option value="0.5">0.5 mi</option>
                <option value="1">1 mi</option>
                <option value="2">2 mi</option>
                <option value="5">5 mi</option>
                <option value="10">10 mi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5" htmlFor="leads-type">
                Business Type
              </label>
              <select
                id="leads-type"
                className="select-field w-full"
                value={osmTag}
                onChange={e => setOsmTag(e.target.value)}
              >
                {BUSINESS_TYPES.map(b => (
                  <option key={b.osmTag} value={b.osmTag}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-40">
            {loading ? 'Searching…' : 'Find Businesses →'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <p className="font-body text-coral text-sm mb-6">{error}</p>
        )}

        {/* Results */}
        {results.length > 0 && (
          <>
            <p className="font-body text-xs text-muted mb-4">
              {results.length} {selectedType?.label.toLowerCase() ?? 'business'}
              {results.length !== 1 ? 'es' : ''} within {radiusMiles} mi of {zip}
            </p>
            <div className="space-y-3">
              {results.map(b => (
                <div
                  key={b.id}
                  className="card hover:-translate-y-0.5 transition-transform duration-150"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-body font-semibold text-ink truncate">{b.name}</h3>
                      <p className="font-body text-xs text-muted mt-0.5 truncate">{b.address}</p>
                      {b.phone && (
                        <a
                          href={`tel:${b.phone}`}
                          className="font-body text-xs text-gold hover:underline mt-1 block"
                        >
                          {b.phone}
                        </a>
                      )}
                    </div>
                    <span className="flex-shrink-0 font-mono text-xs text-muted bg-edge/50 px-2 py-1 rounded">
                      {b.distance.toFixed(1)} mi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
