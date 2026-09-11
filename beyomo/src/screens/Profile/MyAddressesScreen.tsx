import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import WebView from 'react-native-webview';
import Geolocation from 'react-native-geolocation-service';
import LegacyGeolocation from '@react-native-community/geolocation';
import {check, request, PERMISSIONS, RESULTS, openSettings} from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';
import {isCityServiceable, haversineKm} from '../../utils/geoUtils';
import {useDispatch, useSelector} from 'react-redux';
import {fetchProfile, addAddress, updateAddress, deleteAddress} from '../../redux/reducers/user';

const {width, height} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;
const MAP_HEIGHT = height * 0.40;

const DEFAULT_LAT = 14.4494;
const DEFAULT_LNG = 79.9874; // Nellore, Andhra Pradesh — primary service area

type Fix = {lat: number; lng: number};
type PositionFix = Fix & {accuracy: number};

/**
 * Debug-only location override — set to null to use the real device location.
 *
 * The test device's fused provider reports a Wi-Fi-derived position 2.59 km from where
 * the phone actually is, and reports it *confidently*: it claims ~28 m accuracy, so
 * there is no accuracy threshold that can reject it. That makes it useless for
 * checking whether this screen centres the map correctly, because every wrong result
 * is explainable by the bad fix rather than by the code.
 *
 * Pinning a known point separates the two questions. `__DEV__` is false in release
 * builds, so production always goes through the real GPS/fused path below.
 */
// All location logging goes through one tag so it can be filtered out of the noise:
//   adb logcat -s ReactNativeJS:V | grep [LOC]
const devLog = (...args: any[]) => {
  if (__DEV__) console.log('[LOC]', ...args);
};

const DEV_LOCATION_OVERRIDE: PositionFix | null = __DEV__
  ? {lat: 16.998077, lng: 81.798264, accuracy: 15} // Rajahmundry, Andhra Pradesh
  : null;

// Street-level. The network/cell provider's 500m-3km fixes are precise enough to name
// a neighbouring village and nothing more, which is exactly how a wrong locality ends
// up in the address form.
const GOOD_ACCURACY_M = 50;
// How long to keep the receiver running before settling for the best seen so far.
const ACQUIRE_BUDGET_MS = 25000;
type LocationFailure = 'permission' | 'disabled' | 'timeout';
type LocationResult = ({ok: true} & PositionFix) | {ok: false; reason: LocationFailure};

// Last successful device fix. The map opens here immediately so the user is looking
// at their own neighbourhood while a fresh fix resolves, instead of a spinner or a
// city they may not be in. Module-level so a second open in the same session is instant.
const LAST_LOCATION_KEY = '@beyomo/lastKnownLocation';
let lastKnownLocation: Fix | null = null;

const loadCachedLocation = async (): Promise<Fix | null> => {
  if (lastKnownLocation) return lastKnownLocation;
  try {
    const raw = await AsyncStorage.getItem(LAST_LOCATION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
      lastKnownLocation = {lat: parsed.lat, lng: parsed.lng};
    }
  } catch {}
  return lastKnownLocation;
};

const cacheLocation = (loc: Fix) => {
  lastKnownLocation = loc;
  AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(loc)).catch(() => {});
};

// Photon (komoot.io) — same purpose-built autocomplete geocoder used on the website's
// address picker: fast prefix matching, no 1-req/sec limit (unlike Nominatim).
const PHOTON_BASE = 'https://photon.komoot.io';
const INDIA_BBOX = '68.0,6.0,98.3,37.6'; // lon_min,lat_min,lon_max,lat_max

/**
 * Picks the town a person would actually name.
 *
 * For an Indian address Photon puts the OSM *locality* in `city` — often a village
 * name like "Hukumpeta" — while the town it belongs to sits in `county`, as
 * "Rajahmundry Rural". Reading `city` first therefore writes a place the user doesn't
 * recognise into the form, and worse, fails the serviceable-city check, which matches
 * on the selected city's name. So when any candidate names the selected city, use the
 * selected city's own spelling; otherwise fall back to Photon's precedence.
 */
function pickCity(props: any, preferred?: string | null): string {
  const candidates: string[] = [
    props.city, props.town, props.village, props.county, props.district,
  ].filter(Boolean);
  if (preferred) {
    const needle = preferred.toLowerCase();
    if (candidates.some(c => c.toLowerCase().includes(needle))) return preferred;
  }
  return candidates[0] ?? '';
}

function photonToFields(props: any = {}, preferredCity?: string | null) {
  const city = pickCity(props, preferredCity);
  const street = [props.housenumber, props.street].filter(Boolean).join(' ');
  const line1 = street || props.name || '';
  // Everything finer-grained than the chosen city is what a courier actually needs —
  // the building/landmark name when the street took line1, then the locality. Dropping
  // it loses the most useful part of the match.
  const line2 =
    [props.name, props.district, props.suburb, props.locality, props.city]
      .filter(Boolean)
      .find(
        (v: string) =>
          v.toLowerCase() !== city.toLowerCase() &&
          v.toLowerCase() !== line1.toLowerCase(),
      ) || '';
  return {line1, line2, city, state: props.state || '', pincode: props.postcode || ''};
}

function photonLabel(props: any = {}) {
  return [props.name, props.street, props.city || props.town || props.village, props.state]
    .filter((v, i, arr) => v && arr.indexOf(v) === i)
    .join(', ');
}

// A reverse match that snapped further than this is the wrong building — fall through
// to a coarser layer rather than naming somewhere down the road.
const REVERSE_MAX_SNAP_M = 300;

type ReverseCandidate = {props: any; distance: number};

/**
 * Reverse geocodes by asking every layer at once and combining the best parts.
 *
 * Photon's unfiltered reverse snaps to the nearest *place* node, which in India is a
 * village or neighbourhood centroid, so on its own it answers a city street with a
 * village name. But blindly preferring the `house` layer is wrong the other way: at
 * one test point it returned a fountain 68 m off while an actual landmark sat 31 m
 * away. Neither layer is right on its own.
 *
 * So: query all three, then take the STREET from the nearest candidate that actually
 * has one — an address form needs something postable — and the NAME from the nearest
 * candidate of any kind, which is the landmark a person would recognise. Anything that
 * snapped further than REVERSE_MAX_SNAP_M is discarded rather than trusted.
 */
async function photonReverseGeocode(lat: number, lng: number, signal?: AbortSignal) {
  const layers = ['house', 'street', ''] as const;

  const settled = await Promise.all(
    layers.map(async (layer): Promise<ReverseCandidate | null> => {
      try {
        const url =
          `${PHOTON_BASE}/reverse?lat=${lat}&lon=${lng}&lang=en` +
          (layer ? `&layer=${layer}&radius=1` : '');
        const res = await fetch(url, {signal});
        if (!res.ok) return null;
        const data = await res.json();
        const feature = data.features?.[0];
        if (!feature) return null;
        const coords = feature.geometry?.coordinates;
        const distance =
          Array.isArray(coords) && typeof coords[1] === 'number'
            ? haversineKm(lat, lng, coords[1], coords[0]) * 1000
            : Number.POSITIVE_INFINITY;
        return {props: feature.properties || {}, distance};
      } catch (err: any) {
        // An abort must propagate — the caller has already moved on.
        if (err?.name === 'AbortError') throw err;
        return null;
      }
    }),
  );

  const usable = settled.filter(
    (r): r is ReverseCandidate => !!r && r.distance <= REVERSE_MAX_SNAP_M,
  );
  if (usable.length === 0) throw new Error('Reverse geocoding failed');

  const closest = (a: ReverseCandidate, b: ReverseCandidate) =>
    b.distance < a.distance ? b : a;

  const nearest = usable.reduce(closest);
  const withStreet = usable.filter(r => r.props.street);
  const streetSource = withStreet.length > 0 ? withStreet.reduce(closest) : nearest;

  // Street/city/postcode come from the postable match; the landmark from whatever is
  // physically closest to the pin.
  return {...streetSource.props, name: nearest.props.name ?? streetSource.props.name};
}

async function photonSearch(query: string, biasLat?: number, biasLng?: number, signal?: AbortSignal) {
  // Build the full params object up front — React Native's URLSearchParams
  // polyfill (Hermes) only implements the constructor, not .set()/.append().
  const paramsObj: Record<string, string> = {q: query, limit: '6', lang: 'en', bbox: INDIA_BBOX};
  if (biasLat != null && biasLng != null) {
    paramsObj.lat = String(biasLat);
    paramsObj.lon = String(biasLng);
  }
  const params = new URLSearchParams(paramsObj);
  const res = await fetch(`${PHOTON_BASE}/api/?${params.toString()}`, {signal});
  if (!res.ok) throw new Error('Location search failed');
  const data = await res.json();
  return data.features || [];
}

type FormState = {
  tag: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  lat: number | null;
  lng: number | null;
};

const EMPTY_FORM: FormState = {
  tag: 'Home', line1: '', line2: '', city: '', state: '', pincode: '',
  isDefault: false, lat: null, lng: null,
};

const buildMapHtml = (lat: number, lng: number) => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:#e8e0d8}#map{width:100%;height:100%}</style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${lat},${lng}],17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,subdomains:['a','b','c']}).addTo(map);
    /* Where the DEVICE reports it is, with its accuracy radius drawn around it. This is
       deliberately separate from the centre pin (which is what gets saved): when a fix
       is coarse you can SEE the dot sitting away from the pin, and the ring shows how
       much slack there is, instead of a wrong address arriving unexplained. */
    var youDot=null,youRing=null;
    function setYou(lat,lng,acc){
      if(youDot){youDot.setLatLng([lat,lng]);youRing.setLatLng([lat,lng]).setRadius(acc||0);return;}
      youRing=L.circle([lat,lng],{radius:acc||0,color:'#1a73e8',weight:1,fillColor:'#1a73e8',fillOpacity:0.12}).addTo(map);
      youDot=L.circleMarker([lat,lng],{radius:7,color:'#ffffff',weight:3,fillColor:'#1a73e8',fillOpacity:1}).addTo(map);
    }
    function sendCenter(){var c=map.getCenter();window.ReactNativeWebView.postMessage(JSON.stringify({type:'regionChange',lat:c.lat,lng:c.lng}));}
    map.whenReady(sendCenter);
    map.on('moveend',sendCenter);
    function handleMsg(d){try{var m=JSON.parse(d);
      if(m.type==='setCenter')map.setView([m.lat,m.lng],m.zoom||17,{animate:true});
      else if(m.type==='setYou')setYou(m.lat,m.lng,m.acc);
    }catch(e){}}
    document.addEventListener('message',function(e){handleMsg(e.data);});
    window.addEventListener('message',function(e){handleMsg(e.data);});
  </script>
</body>
</html>`;

const MyAddressesScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const {profile, loading, actionLoading} = useSelector((s: any) => s.User);
  const selectedCity = useSelector((s: any) => s.City?.selectedCity);
  const addresses: any[] = profile?.addresses ?? [];

  const isLocationAvailable = (city: string | null | undefined) =>
    isCityServiceable(city, selectedCity);

  const [showModal, setShowModal]   = useState(false);
  const [editAddr, setEditAddr]     = useState<any>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [mapHtml, setMapHtml]       = useState('');
  const [geocoding, setGeocoding]   = useState(false);
  const [locating, setLocating]     = useState(false);
  const [locateError, setLocateError] = useState<LocationFailure | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [searchQuery, setSearchQuery]           = useState('');
  const [searchResults, setSearchResults]       = useState<any[]>([]);
  const [searching, setSearching]               = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const mapRef      = useRef<WebView>(null);
  const pendingCenter = useRef<Fix | null>(null);
  const pendingYou = useRef<PositionFix | null>(null);
  const mapBuilt = useRef(false);
  const geocodeTimer = useRef<any>(null);
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const searchDebounceRef = useRef<any>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Pull the persisted fix into memory so the first search of a fresh launch is
    // biased near the user rather than at the default city.
    loadCachedLocation();
    if (!profile) dispatch(fetchProfile());
    return () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
      if (searchAbortRef.current) searchAbortRef.current.abort();
    };
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
    const controller = new AbortController();
    geocodeAbortRef.current = controller;

    setGeocoding(true);
    try {
      const props = await photonReverseGeocode(lat, lng, controller.signal);
      const fields = photonToFields(props, selectedCity?.name);
      devLog(
        'PIN', `lat=${lat}`, `lng=${lng}`, '-> address:',
        [fields.line1, fields.line2, fields.city, fields.state, fields.pincode]
          .filter(Boolean).join(', '),
      );
      setForm(prev => ({...prev, lat, lng, ...fields}));
    } catch (err: any) {
      if (err.name !== 'AbortError') setForm(prev => ({...prev, lat, lng}));
    } finally {
      if (!controller.signal.aborted) setGeocoding(false);
    }
  };

  const onMapMove = (lat: number, lng: number) => {
    setForm(prev => ({...prev, lat, lng}));
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() => reverseGeocode(lat, lng), 800);
  };

  // injectJavaScript is a silent no-op until the WebView has finished loading, and a
  // cached GPS fix can easily land before Leaflet is up. Remember the last requested
  // centre so onLoadEnd can replay it instead of leaving the map somewhere stale.
  const recenterMap = (lat: number, lng: number) => {
    pendingCenter.current = {lat, lng};
    mapRef.current?.injectJavaScript(
      `handleMsg(JSON.stringify({type:'setCenter',lat:${lat},lng:${lng},zoom:16})); true;`
    );
  };

  // The blue dot: where the DEVICE reports it is, ringed by its accuracy radius.
  // Kept distinct from the centre pin (which is what actually gets saved) so a coarse
  // fix is visible as a dot drifting away from the pin instead of silently producing
  // an address in the wrong locality.
  const markDeviceLocation = (fix: PositionFix) => {
    pendingYou.current = fix;
    const acc = Number.isFinite(fix.accuracy) ? Math.round(fix.accuracy) : 0;
    mapRef.current?.injectJavaScript(
      `handleMsg(JSON.stringify({type:'setYou',lat:${fix.lat},lng:${fix.lng},acc:${acc}})); true;`
    );
  };

  // Every fix that arrives: build the map around the first one, pan to each later
  // improvement, and move the dot each time.
  const showDeviceFix = (fix: PositionFix) => {
    devLog(
      mapBuilt.current ? 'MAP RECENTRE ->' : 'MAP OPEN AT ->',
      `lat=${fix.lat}`, `lng=${fix.lng}`,
      `| google maps: https://maps.google.com/?q=${fix.lat},${fix.lng}`,
    );
    if (mapBuilt.current) {
      recenterMap(fix.lat, fix.lng);
    } else {
      mapBuilt.current = true;
      pendingCenter.current = {lat: fix.lat, lng: fix.lng};
      setMapHtml(buildMapHtml(fix.lat, fix.lng));
    }
    markDeviceLocation(fix);
  };

  // Acquire (or re-acquire) the device position and drive the map from it.
  const locateDevice = async () => {
    setLocating(true);
    setLocateError(null);
    const result = await getDeviceLocation(showDeviceFix);
    setLocating(false);
    if (!result.ok) setLocateError(result.reason);
    return result;
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!value || value.trim().length < 2) {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      setSearchResults([]);
      setShowSearchResults(false);
      setSearching(false);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      setSearching(true);
      try {
        console.log('[MyAddresses] searching for:', value);
        // Bias to the pin, else the device's last known fix — biasing to a fixed
        // city ranks results near somewhere the user isn't.
        const biasLat = form.lat ?? lastKnownLocation?.lat ?? DEFAULT_LAT;
        const biasLng = form.lng ?? lastKnownLocation?.lng ?? DEFAULT_LNG;
        const results = await photonSearch(value, biasLat, biasLng, controller.signal);
        console.log('[MyAddresses] search results:', results.length);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (err: any) {
        console.log('[MyAddresses] search error:', err?.message ?? err);
        if (err.name !== 'AbortError') {
          setSearchResults([]);
          setShowSearchResults(true);
        }
      }
      if (!controller.signal.aborted) setSearching(false);
    }, 250);
  };

  const handleSelectSearchResult = (result: any) => {
    const [lng, lat] = result.geometry.coordinates;
    setShowSearchResults(false);
    setSearchQuery(photonLabel(result.properties));
    setForm(prev => ({...prev, lat, lng, ...photonToFields(result.properties, selectedCity?.name)}));
    recenterMap(lat, lng);
  };

  // One getCurrentPosition call, wrapped as a promise. Resolves either the coords or
  // the PositionError code (1 = permission, 2 = location services off / no provider,
  // 3 = timeout), because "it didn't work" isn't actionable — the user needs to be
  // told which switch to flip.
  const requestPosition = (
    options: any,
    provider: 'fused' | 'legacy' = 'fused',
  ): Promise<PositionFix | {error: number}> =>
    new Promise(resolve => {
      const impl: any = provider === 'legacy' ? LegacyGeolocation : Geolocation;
      try {
        impl.getCurrentPosition(
          (pos: any) => resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            // Radius of the fix in metres. A provider that can't say is treated as
            // the worst possible, so any fix that CAN say beats it.
            accuracy: typeof pos.coords.accuracy === 'number'
              ? pos.coords.accuracy
              : Number.POSITIVE_INFINITY,
          }),
          (err: any) => resolve({error: err?.code ?? 2}),
          options,
        );
      } catch {
        // Native module absent from this build (a dependency added after the last
        // native rebuild) — report it as "no provider" so the next attempt still runs.
        resolve({error: 2});
      }
    });

  const isFix = (r: PositionFix | {error: number}): r is PositionFix =>
    typeof (r as PositionFix).lat === 'number';

  const ensurePermission = async (): Promise<boolean> => {
    const permission = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    let status = await check(permission);
    // request() is a silent no-op once the OS has BLOCKED us — only Settings clears
    // that — so prompt on DENIED and treat anything else as a hard permission fail.
    if (status === RESULTS.DENIED) status = await request(permission);
    return status === RESULTS.GRANTED;
  };

  /**
   * Watches the device position until it is precise enough, reporting every
   * improvement through `onFix` so the map can follow the fix in as it tightens.
   *
   * getCurrentPosition is the wrong tool for this. It hands back the FIRST answer any
   * provider offers, and on a phone whose GPS is cold that is a cell/WiFi estimate
   * hundreds of metres out — accurate enough to name the wrong locality, never your
   * street. watchPosition keeps the receiver powered and delivers successively tighter
   * fixes as satellites are acquired, which is the only way to actually get GPS out of
   * a device that hasn't held a lock in weeks.
   */
  const watchForPreciseFix = (
    onFix: (fix: PositionFix) => void,
    seed: PositionFix | null,
  ): Promise<PositionFix | {error: number}> =>
    new Promise(resolve => {
      const best: {current: PositionFix | null} = {current: seed};
      let watchId: number | null = null;
      let timer: any = null;
      let settled = false;

      const settle = (value: PositionFix | {error: number}) => {
        if (settled) return;
        settled = true;
        if (watchId !== null) {
          try { Geolocation.clearWatch(watchId); } catch {}
        }
        if (timer) clearTimeout(timer);
        resolve(value);
      };

      // Don't hold the receiver open forever: settle for the best seen once the budget
      // is spent. A device that can't see sky never reaches GOOD_ACCURACY_M at all.
      timer = setTimeout(() => settle(best.current ?? {error: 3}), ACQUIRE_BUDGET_MS);

      try {
        watchId = Geolocation.watchPosition(
          pos => {
            const fix: PositionFix = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: typeof pos.coords.accuracy === 'number'
                ? pos.coords.accuracy
                : Number.POSITIVE_INFINITY,
            };
            if (best.current && fix.accuracy >= best.current.accuracy) return;
            best.current = fix;
            onFix(fix);
            if (fix.accuracy <= GOOD_ACCURACY_M) settle(fix);
          },
          err => { if (!best.current) settle({error: err?.code ?? 2}); },
          {
            enableHighAccuracy: true,
            distanceFilter: 0,
            interval: 1000,
            fastestInterval: 500,
            // Power the receiver up even when nothing else has asked for it, and let
            // the OS offer its "turn on location" dialog instead of failing silently.
            forceRequestLocation: true,
            showLocationDialog: true,
          },
        );
      } catch {
        // Native module missing from this build — report "no provider".
        settle({error: 2});
      }
    });

  /**
   * Resolves the device's position, reporting every improvement through `onFix`.
   * Never invents a location: when nothing can be obtained it says why instead.
   */
  const getDeviceLocation = async (
    onFix?: (fix: PositionFix) => void,
  ): Promise<LocationResult> => {
    // Debug builds only, and only while DEV_LOCATION_OVERRIDE is set. Skips the
    // permission prompt too — there's no device fix to ask for.
    if (DEV_LOCATION_OVERRIDE) {
      const fix = DEV_LOCATION_OVERRIDE;
      devLog('USING DEV OVERRIDE (not the real device):', `lat=${fix.lat}`, `lng=${fix.lng}`);
      cacheLocation({lat: fix.lat, lng: fix.lng});
      onFix?.(fix);
      return {ok: true, ...fix};
    }

    try {
      if (!(await ensurePermission())) return {ok: false, reason: 'permission'};

      const best: {current: PositionFix | null} = {current: null};
      const offer = (fix: PositionFix) => {
        if (best.current && fix.accuracy >= best.current.accuracy) {
          devLog(
            'fix REJECTED (not tighter):',
            `lat=${fix.lat}`, `lng=${fix.lng}`,
            `accuracy=${Math.round(fix.accuracy)}m`,
            `(best so far ${Math.round(best.current.accuracy)}m)`,
          );
          return;
        }
        best.current = fix;
        devLog(
          'fix ACCEPTED:',
          `lat=${fix.lat}`, `lng=${fix.lng}`,
          `accuracy=${Math.round(fix.accuracy)}m`,
        );
        cacheLocation({lat: fix.lat, lng: fix.lng});
        onFix?.(fix);
      };

      // Start the watch FIRST, and do NOT await it. Every second spent on a
      // last-known lookup before this point is a second the receiver isn't running.
      // It feeds `offer` continuously as fixes tighten.
      const precise = watchForPreciseFix(offer, null);

      // In parallel, ask each provider for what it already holds so there is something
      // on screen within a frame or two. High accuracy with a short maximumAge so this
      // is a genuinely recent fused fix (GPS + WiFi + cell), not a stale last-known.
      // offer() only accepts a strictly better fix, so this can never override
      // something the watch has already produced.
      void (async () => {
        for (const provider of ['fused', 'legacy'] as const) {
          if (provider === 'legacy') {
            // 'android' pins it to LocationManager; 'auto' would just hand us back the
            // fused provider that already answered. Permission is settled by now, so
            // don't let it raise a second prompt.
            try {
              LegacyGeolocation.setRNConfiguration({
                skipPermissionRequests: true,
                locationProvider: 'android',
              });
            } catch {}
          }
          const r = await requestPosition(
            {enableHighAccuracy: true, timeout: 8000, maximumAge: 30000},
            provider,
          );
          devLog(
            `cached[${provider}] ->`,
            isFix(r)
              ? `lat=${r.lat} lng=${r.lng} accuracy=${Math.round(r.accuracy)}m`
              : `error code ${r.error}`,
          );
          if (isFix(r)) { offer(r); return; }
        }
      })();

      const settled = await precise;
      devLog(
        'GPS watch settled ->',
        isFix(settled)
          ? `lat=${settled.lat} lng=${settled.lng} accuracy=${Math.round(settled.accuracy)}m`
          : `error code ${settled.error}`,
      );
      if (isFix(settled)) offer(settled);

      const found = best.current;
      if (found) return {ok: true, ...found};

      const code = isFix(settled) ? 3 : settled.error;
      return {
        ok: false,
        reason: code === 1 ? 'permission' : code === 2 ? 'disabled' : 'timeout',
      };
    } catch {
      return {ok: false, reason: 'timeout'};
    }
  };


  // Says which switch to flip, and takes them to it.
  const explainLocationFailure = (reason: LocationFailure) => {
    if (reason === 'timeout') {
      Alert.alert(
        'Couldn’t find your location',
        'We couldn’t get a location fix just now. Drag the map to your address, or tap the locate button to retry.',
      );
      return;
    }
    const needsPermission = reason === 'permission';
    Alert.alert(
      needsPermission ? 'Location permission needed' : 'Location is switched off',
      needsPermission
        ? 'Allow location access so the map can open on your current address.'
        : 'Turn on location (GPS) so the map can open on your current address.',
      [
        {text: 'Not now', style: 'cancel'},
        {
          text: needsPermission ? 'Open Settings' : 'Turn On',
          onPress: () => {
            if (!needsPermission && Platform.OS === 'android') {
              Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => {});
            } else {
              openSettings().catch(() => {});
            }
          },
        },
      ],
    );
  };

  // recenterMap fires the map's moveend, which reverse-geocodes into the form, so
  // there's nothing to fill in here beyond driving the map.
  const locateMe = async () => {
    const result = await locateDevice();
    if (!result.ok) explainLocationFailure(result.reason);
  };

  const resetSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setSearching(false);
  };

  const openAdd = async () => {
    setEditAddr(null);
    setForm(EMPTY_FORM);
    setShowErrors(false);
    resetSearch();
    pendingCenter.current = null;
    pendingYou.current = null;
    mapBuilt.current = false;
    setMapHtml('');
    setLocateError(null);
    setLocating(true);
    setShowModal(true);

    // Nothing is drawn until the device says where it is — there is no default city to
    // fall back on, because a map silently centred on somewhere else is precisely the
    // bug this screen kept producing. If no fix can be had, the overlay says why and
    // offers a retry; the search box above still works in the meantime.
    const result = await locateDevice();
    if (!result.ok) explainLocationFailure(result.reason);
  };

  const openEdit = (addr: any) => {
    setEditAddr(addr);
    resetSearch();
    setForm({
      tag:       addr.label ?? addr.tag ?? 'Home',
      line1:     addr.line1 ?? addr.address ?? '',
      line2:     addr.line2 ?? '',
      city:      addr.city ?? '',
      state:     addr.state ?? '',
      pincode:   addr.pincode ?? '',
      isDefault: addr.isDefault ?? false,
      lat:       addr.lat ?? null,
      lng:       addr.lng ?? null,
    });
    setShowErrors(false);
    pendingCenter.current = null;
    pendingYou.current = null;
    mapBuilt.current = true;
    setLocateError(null);
    setMapHtml(buildMapHtml(addr.lat ?? DEFAULT_LAT, addr.lng ?? DEFAULT_LNG));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.line1.trim()) {
      setShowErrors(true);
      Alert.alert('Required', 'Street address is required. Pan the map — it auto-fills.');
      return;
    }
    if (!isLocationAvailable(form.city)) {
      setShowErrors(true);
      Alert.alert(
        'Outside serviceable area',
        `We currently don't provide services in ${form.city || 'this location'}. Please pin or search a location in ${selectedCity.name}.`,
      );
      return;
    }
    const payload: any = {
      tag:       form.tag,
      line1:     form.line1.trim(),
      line2:     form.line2.trim() || undefined,
      city:      form.city.trim(),
      state:     form.state.trim(),
      isDefault: form.isDefault,
    };
    if (form.lat != null) { payload.lat = form.lat; payload.lng = form.lng; }
    const result = editAddr
      ? await dispatch(updateAddress({addressId: editAddr._id ?? editAddr.id, ...payload}))
      : await dispatch(addAddress(payload));

    const rejected = editAddr ? updateAddress.rejected.match(result) : addAddress.rejected.match(result);
    if (rejected) {
      Alert.alert('Error', (result.payload as string) ?? 'Failed to save address.');
      return;
    }
    setShowModal(false);
    dispatch(fetchProfile());
  };

  const handleDelete = (id: string) =>
    Alert.alert('Delete Address', 'Remove this address?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await dispatch(deleteAddress(id));
          if (deleteAddress.rejected.match(result)) {
            Alert.alert('Error', (result.payload as string) ?? 'Failed to delete address.');
          } else {
            dispatch(fetchProfile());
          }
        },
      },
    ]);

  const handleSetDefault = (addr: any) =>
    dispatch(updateAddress({addressId: addr._id ?? addr.id, isDefault: true}));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEDED" />

      <View style={[styles.header, {paddingTop: insets.top + sw(14)}]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(24)} color="#000000" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>My Addresses</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={{width: sw(24)}} />
      </View>

      {loading && addresses.length === 0 ? (
        <ActivityIndicator size="large" color="#105641" style={{marginTop: sw(40)}} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(100)}]}>
          {addresses.length === 0 && (
            <Text style={styles.emptyText}>No saved addresses. Add one below.</Text>
          )}
          {addresses.map((addr: any) => (
            <View key={addr._id ?? addr.id} style={styles.addressCard}>
              <View style={styles.cardTop}>
                <View style={styles.tagRow}>
                  <View style={[styles.tagPill, addr.isDefault && styles.tagPillDefault]}>
                    <Ionicons
                      name={addr.tag === 'Work' ? 'briefcase-outline' : 'home-outline'}
                      size={sw(12)}
                      color={addr.isDefault ? '#FFFFFF' : '#105641'}
                    />
                    <Text style={[styles.tagText, addr.isDefault && styles.tagTextDefault]}>
                      {addr.tag ?? 'Home'}
                    </Text>
                  </View>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <View style={styles.addressTextWrap}>
                  <Text style={styles.addressLine1}>{addr.line1 ?? addr.address}</Text>
                  {addr.line2 ? <Text style={styles.addressLine2}>{addr.line2}</Text> : null}
                  {addr.lat != null && addr.lng != null && (
                    <View style={styles.coordRow}>
                      <Ionicons name="location-outline" size={sw(11)} color="#105641" />
                      <Text style={styles.coordText}>
                        {Number(addr.lat).toFixed(5)}, {Number(addr.lng).toFixed(5)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.cardActions}>
                {!addr.isDefault && (
                  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => handleSetDefault(addr)}>
                    <Ionicons name="checkmark-circle-outline" size={sw(15)} color="#105641" />
                    <Text style={styles.actionTextGreen}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => handleDelete(addr._id ?? addr.id)}>
                  <Ionicons name="trash-outline" size={sw(15)} color="#FB1616" />
                  <Text style={styles.actionTextRed}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={[styles.addBtnWrap, {paddingBottom: insets.bottom + sw(16)}]}>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={openAdd}>
          <Ionicons name="add" size={sw(20)} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>
      </View>

      {/* ── Add / Edit Address ── full-screen with inline map ── */}
      <Modal visible={showModal} animationType="slide" statusBarTranslucent>
        <View style={styles.formRoot}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

          {/* Map */}
          <View style={{height: MAP_HEIGHT, width}}>
            {!mapHtml && (
              <View style={[StyleSheet.absoluteFillObject, styles.mapLoading]}>
                {locating ? (
                  <>
                    <ActivityIndicator size="large" color="#105641" />
                    <Text style={styles.mapLoadingText}>Finding your location…</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="location-outline" size={sw(32)} color="#8A8A8A" />
                    <Text style={styles.mapLoadingText}>
                      {locateError === 'permission'
                        ? 'Location permission is needed to place your address.'
                        : locateError === 'disabled'
                        ? 'Turn on location (GPS) to place your address.'
                        : 'Couldn’t get a location fix.'}
                    </Text>
                    <TouchableOpacity
                      style={styles.mapRetryBtn}
                      activeOpacity={0.85}
                      onPress={locateMe}>
                      <Text style={styles.mapRetryText}>Retry</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
            {!!mapHtml && (
              <WebView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                source={{html: mapHtml}}
                originWhitelist={['*']}
                javaScriptEnabled
                scrollEnabled={false}
                onLoadEnd={() => {
                  // injectJavaScript is a no-op before load, so replay whatever was
                  // requested while the WebView was still booting.
                  const target = pendingCenter.current;
                  if (target) recenterMap(target.lat, target.lng);
                  const you = pendingYou.current;
                  if (you) markDeviceLocation(you);
                }}
                onMessage={e => {
                  try {
                    const msg = JSON.parse(e.nativeEvent.data);
                    if (msg.type === 'regionChange') onMapMove(msg.lat, msg.lng);
                  } catch {}
                }}
              />
            )}

            {/* Close */}
            <TouchableOpacity
              style={[styles.mapBackBtn, {top: insets.top + sw(12)}]}
              onPress={() => setShowModal(false)}
              activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={sw(20)} color="#000000" />
            </TouchableOpacity>

            {/* Fixed center pin */}
            <View style={styles.pinContainer} pointerEvents="none">
              <Ionicons name="location" size={sw(44)} color="#105641" />
              <View style={styles.pinShadow} />
            </View>

            {/* Locate me */}
            <TouchableOpacity
              style={styles.locateBtn}
              activeOpacity={0.8}
              onPress={locateMe}
              disabled={locating}>
              {locating
                ? <ActivityIndicator size="small" color="#105641" />
                : <Ionicons name="locate" size={sw(20)} color="#105641" />}
            </TouchableOpacity>

            {/* Geocoding badge */}
            {geocoding && (
              <View style={styles.geocodingBadge}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.geocodingText}>Detecting address…</Text>
              </View>
            )}

            {/* Drag hint. In debug builds it doubles as a readout of the pin's exact
                coordinates, so what the map is actually centred on can be checked on
                the device without digging through the Metro console. */}
            <View style={styles.dragHint} pointerEvents="none">
              <Text style={styles.dragHintText}>
                {__DEV__ && form.lat != null && form.lng != null
                  ? `${form.lat.toFixed(6)}, ${form.lng.toFixed(6)}`
                  : 'Drag map · pin stays at centre'}
              </Text>
            </View>
          </View>

          {/* Search — deliberately a sibling of the map View (not nested inside it),
              so it never ends up under the WebView's own native compositing layer,
              which on Android can render above sibling RN views regardless of zIndex. */}
          <View style={[styles.mapSearchWrap, {top: insets.top + sw(12)}]}>
            <View style={styles.mapSearchBox}>
              <Ionicons name="search-outline" size={sw(16)} color="#888" />
              <TextInput
                style={styles.mapSearchInput}
                placeholder="Search for a location…"
                placeholderTextColor="#AAA"
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              />
              {searching && <ActivityIndicator size="small" color="#105641" />}
            </View>
            {showSearchResults && !searching && (
              <View style={styles.mapSearchResults}>
                {searchResults.length === 0 ? (
                  <Text style={styles.mapSearchResultEmpty}>No results found</Text>
                ) : (
                  <ScrollView keyboardShouldPersistTaps="handled" style={{maxHeight: sw(200)}}>
                    {searchResults.map((result: any, idx: number) => (
                      <TouchableOpacity
                        key={`${result.properties.osm_type}-${result.properties.osm_id}-${idx}`}
                        style={styles.mapSearchResultItem}
                        activeOpacity={0.7}
                        onPress={() => handleSelectSearchResult(result)}>
                        <Text style={styles.mapSearchResultText} numberOfLines={2}>
                          {photonLabel(result.properties)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* Form */}
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={[styles.formContent, {paddingBottom: insets.bottom + sw(24)}]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">

            <View style={styles.formTitleRow}>
              <Text style={styles.formTitle}>
                {editAddr ? 'Edit Address' : 'New Address'}
              </Text>
              {form.lat != null && !isLocationAvailable(form.city) ? (
                <View style={styles.pinOutsideBadge}>
                  <Ionicons name="warning-outline" size={sw(13)} color="#FB1616" />
                  <Text style={styles.pinOutsideText}>Outside {selectedCity.name}</Text>
                </View>
              ) : form.lat != null ? (
                <View style={styles.pinOkBadge}>
                  <Ionicons name="checkmark-circle" size={sw(13)} color="#22C55E" />
                  <Text style={styles.pinOkText}>Location set</Text>
                </View>
              ) : (
                <View style={styles.pinPendingBadge}>
                  <Ionicons name="location-outline" size={sw(13)} color="#FF9500" />
                  <Text style={styles.pinPendingText}>Pan map to pin</Text>
                </View>
              )}
            </View>

            {/* Tag */}
            <View style={styles.tagSelector}>
              {['Home', 'Work', 'Other'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagOption, form.tag === t && styles.tagOptionActive]}
                  activeOpacity={0.7}
                  onPress={() => setForm(f => ({...f, tag: t}))}>
                  <Text style={[styles.tagOptionText, form.tag === t && styles.tagOptionTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, showErrors && !form.line1.trim() && styles.inputError]}
              placeholder="Street / House / Building *"
              placeholderTextColor="#BBBBBB"
              value={form.line1}
              onChangeText={v => setForm(f => ({...f, line1: v}))}
            />
            <TextInput
              style={styles.input}
              placeholder="Area / Locality"
              placeholderTextColor="#BBBBBB"
              value={form.line2}
              onChangeText={v => setForm(f => ({...f, line2: v}))}
            />
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="City"
                placeholderTextColor="#BBBBBB"
                value={form.city}
                onChangeText={v => setForm(f => ({...f, city: v}))}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Pincode"
                placeholderTextColor="#BBBBBB"
                value={form.pincode}
                onChangeText={v => setForm(f => ({...f, pincode: v}))}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="State"
              placeholderTextColor="#BBBBBB"
              value={form.state}
              onChangeText={v => setForm(f => ({...f, state: v}))}
            />

            <TouchableOpacity
              style={styles.defaultRow}
              onPress={() => setForm(f => ({...f, isDefault: !f.isDefault}))}
              activeOpacity={0.7}>
              <Text style={styles.defaultLabel}>Set as default address</Text>
              <Ionicons
                name={form.isDefault ? 'checkbox' : 'square-outline'}
                size={sw(22)}
                color="#105641"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, actionLoading && {opacity: 0.6}]}
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={actionLoading}>
              {actionLoading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.saveBtnText}>{editAddr ? 'Update Address' : 'Save Address'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#EEEDED'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingBottom: sw(12),
    backgroundColor: '#EEEDED',
  },
  titleBlock: {alignItems: 'center', gap: sw(6)},
  headerTitle: {fontFamily: fonts.title, fontSize: sw(18), fontWeight: '700', color: '#012823'},
  titleUnderline: {width: sw(28), height: 3, backgroundColor: '#105641', borderRadius: 2},

  emptyText: {textAlign: 'center', color: '#A3A3A3', marginTop: sw(40), fontFamily: fonts.textFont, fontSize: sw(13)},
  scroll: {paddingHorizontal: sw(16), paddingTop: sw(8), gap: sw(12)},

  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardTop: {padding: sw(14), gap: sw(10)},
  tagRow: {flexDirection: 'row', alignItems: 'center', gap: sw(8)},
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    paddingHorizontal: sw(10),
    paddingVertical: sw(4),
    borderRadius: sw(20),
    borderWidth: 1,
    borderColor: '#105641',
  },
  tagPillDefault: {backgroundColor: '#105641', borderColor: '#105641'},
  tagText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#105641', fontWeight: '600'},
  tagTextDefault: {color: '#FFFFFF'},
  defaultBadge: {backgroundColor: '#EAF5F0', borderRadius: sw(4), paddingHorizontal: sw(8), paddingVertical: sw(2)},
  defaultBadgeText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#105641'},
  addressTextWrap: {gap: sw(3)},
  addressLine1: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '500'},
  addressLine2: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#656565'},
  coordRow: {flexDirection: 'row', alignItems: 'center', gap: sw(3), marginTop: sw(2)},
  coordText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#105641'},
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: sw(14),
    paddingVertical: sw(10),
    gap: sw(16),
  },
  actionBtn: {flexDirection: 'row', alignItems: 'center', gap: sw(4)},
  actionTextGreen: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#105641', fontWeight: '500'},
  actionTextGray: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#5C5C5C'},
  actionTextRed: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#FB1616'},

  addBtnWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: sw(16),
    paddingTop: sw(12),
    backgroundColor: '#EEEDED',
  },
  addBtn: {
    backgroundColor: '#105641',
    borderRadius: sw(10),
    height: sw(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(8),
  },
  addBtnText: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#FFFFFF'},

  /* ── Full-screen form modal ── */
  formRoot: {flex: 1, backgroundColor: '#F5F5F5'},

  mapLoading: {
    backgroundColor: '#e8e0d8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(10),
  },
  mapLoadingText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#5C5C5C',
    textAlign: 'center',
    paddingHorizontal: sw(32),
  },
  mapRetryBtn: {
    marginTop: sw(4),
    paddingHorizontal: sw(20),
    paddingVertical: sw(9),
    borderRadius: sw(20),
    backgroundColor: '#105641',
  },
  mapRetryText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#FFFFFF'},

  /* Map overlay elements */
  mapBackBtn: {
    position: 'absolute',
    left: sw(16),
    width: sw(38),
    height: sw(38),
    borderRadius: sw(19),
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 4,
  },
  mapSearchWrap: {
    position: 'absolute',
    left: sw(62),
    right: sw(16),
    zIndex: 10,
    elevation: 10,
  },
  mapSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    height: sw(38),
    borderRadius: sw(19),
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: sw(14),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  mapSearchInput: {
    flex: 1,
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#171816',
    padding: 0,
  },
  mapSearchResults: {
    marginTop: sw(6),
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  mapSearchResultItem: {
    paddingHorizontal: sw(14),
    paddingVertical: sw(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mapSearchResultText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#333333'},
  mapSearchResultEmpty: {
    paddingHorizontal: sw(14),
    paddingVertical: sw(14),
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#A3A3A3',
    textAlign: 'center',
  },
  pinContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinShadow: {
    width: sw(12),
    height: sw(4),
    borderRadius: sw(6),
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: -sw(4),
  },
  locateBtn: {
    position: 'absolute',
    right: sw(14),
    bottom: sw(14),
    width: sw(42),
    height: sw(42),
    borderRadius: sw(21),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  geocodingBadge: {
    position: 'absolute',
    bottom: sw(14),
    left: sw(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    backgroundColor: 'rgba(16,86,65,0.9)',
    paddingVertical: sw(6),
    paddingHorizontal: sw(10),
    borderRadius: sw(20),
  },
  geocodingText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#FFFFFF'},
  dragHint: {
    position: 'absolute',
    bottom: sw(62),
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: sw(5),
    paddingHorizontal: sw(12),
    borderRadius: sw(20),
  },
  dragHintText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#FFFFFF'},

  /* Form */
  formScroll: {flex: 1, backgroundColor: '#F5F5F5'},
  formContent: {paddingHorizontal: sw(16), paddingTop: sw(14), gap: sw(10)},
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sw(4),
  },
  formTitle: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '700', color: '#171816'},
  pinOkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    backgroundColor: '#EDFBF0',
    paddingVertical: sw(4),
    paddingHorizontal: sw(8),
    borderRadius: sw(12),
  },
  pinOkText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#22C55E', fontWeight: '600'},
  pinPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    backgroundColor: '#FFF3E0',
    paddingVertical: sw(4),
    paddingHorizontal: sw(8),
    borderRadius: sw(12),
  },
  pinPendingText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#FF9500', fontWeight: '600'},
  pinOutsideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    backgroundColor: '#FEE2E2',
    paddingVertical: sw(4),
    paddingHorizontal: sw(8),
    borderRadius: sw(12),
  },
  pinOutsideText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#FB1616', fontWeight: '600'},

  tagSelector: {flexDirection: 'row', gap: sw(8)},
  tagOption: {
    flex: 1,
    height: sw(36),
    borderRadius: sw(8),
    borderWidth: 1,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  tagOptionActive: {backgroundColor: '#105641', borderColor: '#105641'},
  tagOptionText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#5C5C5C', fontWeight: '600'},
  tagOptionTextActive: {color: '#FFFFFF'},

  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(10),
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: sw(14),
    height: sw(46),
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#171816',
  },
  inputError: {borderColor: '#FF2F2F', backgroundColor: '#FFF5F5'},
  rowInputs: {flexDirection: 'row', gap: sw(8)},
  halfInput: {flex: 1},

  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: sw(4),
  },
  defaultLabel: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#444'},

  saveBtn: {
    backgroundColor: '#105641',
    borderRadius: sw(10),
    height: sw(50),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sw(4),
  },
  saveBtnText: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#FFFFFF'},
});

export default MyAddressesScreen;
