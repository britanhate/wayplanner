const ARCGIS_KEY = import.meta.env.VITE_ARCGIS_KEY

const BASE_GEOCODE = 'https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer'
const BASE_ROUTE   = 'https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World'

export async function suggestAddresses(text) {
  const url = `${BASE_GEOCODE}/suggest?text=${encodeURIComponent(text)}&maxSuggestions=6&f=json&token=${ARCGIS_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  return data.suggestions || []
}

export async function findAddress(text, magicKey = '') {
  let url = `${BASE_GEOCODE}/findAddressCandidates?SingleLine=${encodeURIComponent(text)}&maxLocations=1&outFields=Place_addr,PlaceName&f=json&token=${ARCGIS_KEY}`
  if (magicKey) url += `&magicKey=${encodeURIComponent(magicKey)}`
  const res = await fetch(url)
  const data = await res.json()
  const c = data.candidates?.[0]
  if (!c) throw new Error('Адресу не знайдено')
  return {
    lat: c.location.y,
    lng: c.location.x,
    name: c.attributes?.PlaceName || text,
    addr: c.attributes?.Place_addr || c.address || text,
  }
}

export async function buildRoute(from, to) {
  const url = `${BASE_ROUTE}/solve?stops=${from.lng},${from.lat};${to.lng},${to.lat}&returnRoutes=true&returnDirections=true&directionsLanguage=uk&f=json&token=${ARCGIS_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'API помилка')
  const route = data.routes?.features?.[0]
  if (!route) throw new Error('Маршрут не знайдено')
  const attrs = route.attributes || {}
  return {
    totalMin: Math.round(attrs.Total_TravelTime || attrs.Total_Time || 0),
    totalKm:  (attrs.Total_Kilometers || 0).toFixed(1),
    paths:    route.geometry?.paths || [],
    directions: data.directions?.[0]?.features || [],
  }
}
