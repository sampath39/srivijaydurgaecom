// ── Google Maps and OpenStreetMap Autocomplete Service ─────────────────

const INDIAN_STATES = [
  'Andhra Pradesh','Telangana','Karnataka','Tamil Nadu','Maharashtra','Kerala',
  'Gujarat','Rajasthan','Punjab','Haryana','Delhi','West Bengal','Uttar Pradesh',
  'Madhya Pradesh','Bihar','Odisha','Assam','Uttarakhand','Himachal Pradesh',
  'Jharkhand','Chhattisgarh','Goa','Manipur','Meghalaya','Mizoram','Nagaland',
  'Sikkim','Tripura','Arunachal Pradesh','Other'
]

// Match state name to one of our allowed Indian states
export function matchIndianState(stateName) {
  if (!stateName) return ''
  const clean = stateName.toLowerCase().trim().replace(/\s/g, '')
  const found = INDIAN_STATES.find(s => s.toLowerCase().trim().replace(/\s/g, '') === clean)
  return found || ''
}

// Dynamically load Google Maps script
export function loadGoogleMapsScript(callback) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  if (!apiKey) {
    console.warn('Google Maps API Key (VITE_GOOGLE_MAPS_API_KEY) is missing. Using OpenStreetMap fallback.')
    if (callback) callback(false)
    return
  }

  if (window.google && window.google.maps && window.google.maps.places) {
    if (callback) callback(true)
    return
  }

  const existingScript = document.getElementById('google-maps-script')
  if (existingScript) {
    existingScript.addEventListener('load', () => callback(true))
    existingScript.addEventListener('error', () => callback(false))
    return
  }

  const script = document.createElement('script')
  script.id = 'google-maps-script'
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
  script.async = true
  script.defer = true
  script.onload = () => {
    if (callback) callback(true)
  }
  script.onerror = () => {
    console.warn('Failed to load Google Maps script. Falling back to OpenStreetMap.')
    if (callback) callback(false)
  }
  document.head.appendChild(script)
}

// Parse Google Place components into address details
export function parseGooglePlace(place) {
  if (!place || !place.address_components) return null

  let address_line1 = ''
  let address_line2 = ''
  let city = ''
  let stateName = ''
  let pincode = ''

  let streetNumber = ''
  let route = ''
  let sublocality1 = ''
  let sublocality2 = ''
  let neighborhood = ''

  for (const component of place.address_components) {
    const types = component.types
    if (types.includes('street_number')) {
      streetNumber = component.long_name
    } else if (types.includes('route')) {
      route = component.long_name
    } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
      sublocality1 = component.long_name
    } else if (types.includes('sublocality_level_2')) {
      sublocality2 = component.long_name
    } else if (types.includes('neighborhood')) {
      neighborhood = component.long_name
    } else if (types.includes('locality')) {
      city = component.long_name
    } else if (types.includes('administrative_area_level_2') && !city) {
      city = component.long_name
    } else if (types.includes('administrative_area_level_1')) {
      stateName = component.long_name
    } else if (types.includes('postal_code')) {
      pincode = component.long_name
    }
  }

  // Construct readable address lines
  address_line1 = [streetNumber, route].filter(Boolean).join(' ') || sublocality1 || ''
  address_line2 = [sublocality2 || sublocality1, neighborhood].filter(Boolean).join(', ') || ''

  return {
    address_line1: address_line1.trim() || place.name || '',
    address_line2: address_line2.trim(),
    city: city.trim(),
    state: matchIndianState(stateName),
    pincode: pincode.replace(/\D/g, '').slice(0, 6),
  }
}

// Free fallback: Fetch address search suggestions from OpenStreetMap Nominatim
export async function searchAddressOSM(query) {
  if (!query || query.length < 3) return []
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=in&limit=5`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'SVDKE-App' } }
    )
    if (!res.ok) throw new Error('OSM Request failed')
    const data = await res.json()
    return data.map(item => {
      const a = item.address || {}
      
      // Construct lines
      const house = a.house_number || ''
      const road = a.road || ''
      const sub = a.suburb || a.neighbourhood || a.village || ''
      
      const line1 = [house, road].filter(Boolean).join(', ') || sub || ''
      const line2 = [a.suburb || a.neighbourhood || '', a.sublocality || a.locality || ''].filter(Boolean).join(', ') || ''

      return {
        display_name: item.display_name,
        address_line1: line1 || item.name || '',
        address_line2: line2,
        city: a.city || a.town || a.village || a.county || '',
        state: matchIndianState(a.state || ''),
        pincode: (a.postcode || '').replace(/\D/g, '').slice(0, 6),
      }
    })
  } catch (err) {
    console.error('OSM Search Error:', err)
    return []
  }
}
