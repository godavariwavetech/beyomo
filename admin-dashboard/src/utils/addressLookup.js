const LOOKUP_HOSTS = ['https://photon.komoot.io', 'https://photon.komoot.de'];
let fallbackQueue = Promise.resolve();
let lastFallbackAt = 0;

function nominatimFeature(place) {
  const address = place.address || {};
  return {
    type: 'Feature', geometry: {type: 'Point', coordinates: [Number(place.lon), Number(place.lat)]},
    properties: {
      osm_id: place.osm_id, osm_type: place.osm_type, osm_key: place.category || place.class,
      osm_value: place.type, type: place.addresstype,
      name: place.name || address.road || place.display_name?.split(',')[0] || '',
      street: address.road, housenumber: address.house_number,
      city: address.city || address.town || address.village || address.municipality,
      suburb: address.suburb || address.neighbourhood, county: address.county,
      state: address.state, postcode: address.postcode,
    },
  };
}

async function fallbackLookup(path, params, signal) {
  // Keep the public fallback below one request per second, including expanded searches.
  const request = fallbackQueue.catch(() => {}).then(async () => {
    if (signal?.aborted) throw new DOMException('Lookup cancelled', 'AbortError');
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 1100 - (Date.now() - lastFallbackAt))));
    if (signal?.aborted) throw new DOMException('Lookup cancelled', 'AbortError');
    lastFallbackAt = Date.now();
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel, {once: true});
    const timeout = setTimeout(cancel, 8000);
    try {
      const query = new URLSearchParams({format: 'jsonv2', addressdetails: '1', 'accept-language': 'en'});
      if (path === 'reverse') {
        query.set('lat', params.get('lat')); query.set('lon', params.get('lon'));
      } else {
        query.set('q', params.get('q')); query.set('countrycodes', 'in'); query.set('limit', '10');
      }
      const response = await fetch(`https://nominatim.openstreetmap.org/${path === 'reverse' ? 'reverse' : 'search'}?${query}`,
        {signal: controller.signal});
      if (!response.ok) throw new Error('Address lookup is unavailable');
      const result = await response.json();
      if (result.error) throw new Error('Address not found');
      return (Array.isArray(result) ? result : [result]).map(nominatimFeature);
    } finally {
      clearTimeout(timeout); signal?.removeEventListener('abort', cancel);
    }
  });
  fallbackQueue = request;
  return request;
}

// A stalled provider must not leave address entry waiting indefinitely.
export async function lookupAddress(path, params, signal) {
  for (const host of LOOKUP_HOSTS) {
    if (signal?.aborted) throw new DOMException('Lookup cancelled', 'AbortError');
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel, {once: true});
    const timeout = setTimeout(cancel, 6000);
    try {
      const response = await fetch(`${host}/${path}?${params}`, {signal: controller.signal});
      if (!response.ok) throw new Error('Address lookup failed');
      const data = await response.json();
      if (!Array.isArray(data.features)) throw new Error('Invalid address lookup response');
      return data.features;
    } catch {
      if (signal?.aborted) throw new DOMException('Lookup cancelled', 'AbortError');
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', cancel);
    }
  }
  try {
    return await fallbackLookup(path, params, signal);
  } catch {
    if (signal?.aborted) throw new DOMException('Lookup cancelled', 'AbortError');
    throw new Error('Address lookup is unavailable');
  }
}

export function addressFields(props = {}) {
  const placeType = props.type || props.osm_value;
  return {
    line1: (props.osm_key === 'amenity' ? props.name : '') || [props.housenumber, props.street].filter(Boolean).join(' ') || props.name || '',
    line2: props.district || props.suburb || props.locality || '',
    city: props.city || props.town || props.village ||
      (['city', 'town', 'village'].includes(placeType) ? props.name : '') || props.county || '',
    state: props.state || '',
    pincode: props.postcode || '',
  };
}
