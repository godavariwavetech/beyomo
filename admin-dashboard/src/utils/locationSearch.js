import { lookupAddress } from './addressLookup';

const CITY_ALIASES = ['rahamundry', 'rajamundry', 'rajahmundry', 'rajahmundri', 'rajamahendravaram'];

export function cityKey(value = '') {
  const key = value.trim().toLowerCase().replace(/\s+/g, ' ');
  return CITY_ALIASES.includes(key) ? 'rajamahendravaram' : key;
}

function containsCity(text, name) {
  return ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `.includes(` ${name.toLowerCase()} `);
}

export async function searchLocations(query, biasLat, biasLng, cities, signal) {
  const text = query.trim();
  const namedCity = [...CITY_ALIASES, ...cities.map(c => c.name)]
    .filter(name => containsCity(text, name)).sort((a, b) => b.length - a.length)[0];
  let expanded = text;
  if (namedCity && cityKey(namedCity) === 'rajamahendravaram') {
    expanded = expanded.replace(new RegExp(namedCity, 'i'), 'Rajamahendravaram');
  }
  expanded = expanded.replace(/\b(?:apsrtc|rtc)\s+(?:complex|stand|bus\s+stand)\b/gi, 'bus station');
  const queries = [...new Set([text, expanded])];
  const responses = await Promise.allSettled(queries.map(async q => {
    const params = new URLSearchParams({q, limit: '10', lang: 'en', bbox: '68.0,6.0,98.3,37.6'});
    // A named city takes precedence over the current map's location.
    if (!namedCity && biasLat != null && biasLng != null) {
      params.set('lat', biasLat); params.set('lon', biasLng);
    }
    return lookupAddress('api/', params, signal);
  }));
  if (signal?.aborted) throw new DOMException('Search cancelled', 'AbortError');
  const succeeded = responses.filter(r => r.status === 'fulfilled');
  if (!succeeded.length) throw new Error('Location search failed');
  const seen = new Set();
  const results = succeeded.flatMap(r => r.value).filter(feature => {
    const props = feature.properties ?? {};
    if (namedCity) {
      const names = [props.city, props.town, props.village, props.county,
        ...(['city', 'town', 'village'].includes(props.type) ? [props.name] : [])].filter(Boolean);
      if (!names.some(name => cityKey(name) === cityKey(namedCity)
        || containsCity(name, namedCity)
        || (cityKey(namedCity) === 'rajamahendravaram' && CITY_ALIASES.some(alias => containsCity(name, alias))))) return false;
    }
    const id = `${props.osm_type}:${props.osm_id ?? feature.geometry?.coordinates?.join(',')}`;
    if (seen.has(id)) return false;
    seen.add(id); return true;
  });
  if (/\b(?:rtc|apsrtc|bus)\b/i.test(text)) {
    results.sort((a, b) => Number(b.properties?.osm_value === 'bus_station') - Number(a.properties?.osm_value === 'bus_station'));
  }
  return results.slice(0, 10);
}
