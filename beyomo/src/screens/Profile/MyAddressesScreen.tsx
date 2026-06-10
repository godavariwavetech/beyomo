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
} from 'react-native';
import WebView from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';
import {useDispatch, useSelector} from 'react-redux';
import {fetchProfile, addAddress, updateAddress, deleteAddress} from '../../redux/reducers/user';

const {width, height} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;
const MAP_HEIGHT = height * 0.40;

const DEFAULT_LAT = 17.385;
const DEFAULT_LNG = 78.4867;

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
    var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${lat},${lng}],15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,subdomains:['a','b','c']}).addTo(map);
    function sendCenter(){var c=map.getCenter();window.ReactNativeWebView.postMessage(JSON.stringify({type:'regionChange',lat:c.lat,lng:c.lng}));}
    map.whenReady(sendCenter);
    map.on('moveend',sendCenter);
    function handleMsg(d){try{var m=JSON.parse(d);if(m.type==='setCenter')map.setView([m.lat,m.lng],m.zoom||16,{animate:true});}catch(e){}}
    document.addEventListener('message',function(e){handleMsg(e.data);});
    window.addEventListener('message',function(e){handleMsg(e.data);});
  </script>
</body>
</html>`;

const MyAddressesScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const {profile, loading, actionLoading} = useSelector((s: any) => s.User);
  const addresses: any[] = profile?.addresses ?? [];

  const [showModal, setShowModal]   = useState(false);
  const [editAddr, setEditAddr]     = useState<any>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [mapHtml, setMapHtml]       = useState('');
  const [geocoding, setGeocoding]   = useState(false);
  const [locating, setLocating]     = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const mapRef      = useRef<WebView>(null);
  const geocodeTimer = useRef<any>(null);

  useEffect(() => {
    if (!profile) dispatch(fetchProfile());
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {headers: {'User-Agent': 'BeyomoApp/1.0'}},
      );
      const data = await resp.json();
      const a = data.address || {};
      const newLine1 = [a.road, a.suburb, a.neighbourhood].filter(Boolean).join(', ');
      const newLine2 = a.city_district || a.county || '';
      setForm(prev => ({
        ...prev,
        lat,
        lng,
        line1: newLine1 || prev.line1,
        line2: newLine2 || prev.line2,
        city:  a.city || a.town || a.village || a.county || prev.city,
        state: a.state || prev.state,
        pincode: a.postcode || prev.pincode,
      }));
    } catch {
      setForm(prev => ({...prev, lat, lng}));
    } finally {
      setGeocoding(false);
    }
  };

  const onMapMove = (lat: number, lng: number) => {
    setForm(prev => ({...prev, lat, lng}));
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() => reverseGeocode(lat, lng), 800);
  };

  const locateMe = async () => {
    try {
      setLocating(true);
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      let status = await check(permission);
      if (status !== RESULTS.GRANTED) status = await request(permission);
      if (status !== RESULTS.GRANTED) { setLocating(false); return; }
      Geolocation.getCurrentPosition(
        pos => {
          const {latitude, longitude} = pos.coords;
          mapRef.current?.injectJavaScript(
            `handleMsg(JSON.stringify({type:'setCenter',lat:${latitude},lng:${longitude},zoom:16})); true;`
          );
          setLocating(false);
        },
        () => setLocating(false),
        {enableHighAccuracy: true, timeout: 8000, maximumAge: 60000},
      );
    } catch {
      setLocating(false);
    }
  };

  const openAdd = () => {
    setEditAddr(null);
    setForm(EMPTY_FORM);
    setShowErrors(false);
    setMapHtml(buildMapHtml(DEFAULT_LAT, DEFAULT_LNG));
    setShowModal(true);
  };

  const openEdit = (addr: any) => {
    setEditAddr(addr);
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
    setMapHtml(buildMapHtml(addr.lat ?? DEFAULT_LAT, addr.lng ?? DEFAULT_LNG));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.line1.trim()) {
      setShowErrors(true);
      Alert.alert('Required', 'Street address is required. Pan the map — it auto-fills.');
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
    if (editAddr) {
      await dispatch(updateAddress({addressId: editAddr._id ?? editAddr.id, ...payload}));
    } else {
      await dispatch(addAddress(payload));
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
            {!!mapHtml && (
              <WebView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                source={{html: mapHtml}}
                originWhitelist={['*']}
                javaScriptEnabled
                scrollEnabled={false}
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

            {/* Drag hint */}
            <View style={styles.dragHint} pointerEvents="none">
              <Text style={styles.dragHintText}>Drag map · pin stays at centre</Text>
            </View>
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
              {form.lat != null ? (
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
  tagText: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#105641', fontWeight: '600'},
  tagTextDefault: {color: '#FFFFFF'},
  defaultBadge: {backgroundColor: '#EAF5F0', borderRadius: sw(4), paddingHorizontal: sw(8), paddingVertical: sw(2)},
  defaultBadgeText: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#105641'},
  addressTextWrap: {gap: sw(3)},
  addressLine1: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '500'},
  addressLine2: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#656565'},
  coordRow: {flexDirection: 'row', alignItems: 'center', gap: sw(3), marginTop: sw(2)},
  coordText: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#105641'},
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
  geocodingText: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#FFFFFF'},
  dragHint: {
    position: 'absolute',
    bottom: sw(62),
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: sw(5),
    paddingHorizontal: sw(12),
    borderRadius: sw(20),
  },
  dragHintText: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#FFFFFF'},

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
  pinOkText: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#22C55E', fontWeight: '600'},
  pinPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    backgroundColor: '#FFF3E0',
    paddingVertical: sw(4),
    paddingHorizontal: sw(8),
    borderRadius: sw(12),
  },
  pinPendingText: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#FF9500', fontWeight: '600'},

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
