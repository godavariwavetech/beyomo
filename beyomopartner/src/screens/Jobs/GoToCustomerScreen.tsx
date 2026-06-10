import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, {Marker, Polyline, UrlTile} from 'react-native-maps';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch} from 'react-redux';
import {fonts} from '../../config/theme';
import {updateBookingStatus} from '../../redux/reducers/partner';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const DEFAULT_LOCATION = {latitude: 12.9716, longitude: 77.5946};
const DEFAULT_PARTNER = {latitude: 12.9819, longitude: 77.6278};

const GoToCustomerScreen = ({navigation, route}: any) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const mapRef = useRef<MapView>(null);
  const [arriving, setArriving] = useState(false);
  const job = route?.params?.job ?? null;

  const lat = job?.addressLat ?? job?.address?.lat;
  const lng = job?.addressLng ?? job?.address?.lng;
  const customerLocation = (lat && lng)
    ? {latitude: Number(lat), longitude: Number(lng)}
    : DEFAULT_LOCATION;

  const address = job?.address?.formatted
    ?? [job?.addressLine1, job?.addressCity, job?.addressState].filter(Boolean).join(', ')
    ?? (job?.address
      ? [job.address.line1, job.address.city, job.address.state].filter(Boolean).join(', ')
      : '—');

  const customerPhone = job?.user?.phone ?? job?.userId?.phone ?? job?.userPhone ?? null;

  useEffect(() => {
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        [DEFAULT_PARTNER, customerLocation],
        {edgePadding: {top: 80, right: 60, bottom: 220, left: 60}, animated: true},
      );
    }, 600);
  }, []);

  const handleDirections = () => {
    const {latitude, longitude} = customerLocation;
    Linking.openURL(`https://maps.google.com/?daddr=${latitude},${longitude}`);
  };

  const handleCallCustomer = () => {
    if (!customerPhone) {
      Alert.alert('Not Available', 'Customer phone number is not available.');
      return;
    }
    Linking.openURL(`tel:${customerPhone}`);
  };

  const handleArrived = () => {
    Alert.alert(
      'Arrived at Location',
      'Confirm you have arrived at the customer\'s location.',
      [
        {text: 'Not Yet', style: 'cancel'},
        {
          text: 'Confirm Arrival',
          onPress: async () => {
            setArriving(true);
            await dispatch(updateBookingStatus({bookingId: job.id, status: 'in_progress'}));
            setArriving(false);
            navigation.navigate('JobChecklist', {job});
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: (DEFAULT_PARTNER.latitude + customerLocation.latitude) / 2,
          longitude: (DEFAULT_PARTNER.longitude + customerLocation.longitude) / 2,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
        showsUserLocation
        showsMyLocationButton={false}>

        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />

        {/* Route polyline */}
        <Polyline
          coordinates={[DEFAULT_PARTNER, customerLocation]}
          strokeColor="#1C46CF"
          strokeWidth={sw(4)}
        />

        {/* Customer pin */}
        <Marker coordinate={customerLocation} title="Customer Location">
          <View style={styles.pinWrap}>
            <LinearGradient colors={['#0E5843', '#022723']} style={styles.pin}>
              <Ionicons name="location" size={sw(18)} color="#FDD77A" />
            </LinearGradient>
            <View style={styles.pinTip} />
          </View>
        </Marker>

        {/* Partner pin */}
        <Marker coordinate={DEFAULT_PARTNER} title="Your Location">
          <View style={styles.partnerPinWrap}>
            <Ionicons name="navigate-circle" size={sw(32)} color="#1C46CF" />
          </View>
        </Marker>
      </MapView>

      {/* Header overlay */}
      <LinearGradient
        colors={['rgba(2,39,35,0.85)', 'transparent']}
        style={[styles.headerOverlay, {paddingTop: insets.top + sw(10)}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={sw(20)} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Go to Customer</Text>
        <View style={{width: sw(36)}} />
      </LinearGradient>

      {/* ETA card + action buttons */}
      <View style={[styles.bottomSheet, {paddingBottom: insets.bottom + sw(12)}]}>

        {/* ETA row */}
        <View style={styles.etaRow}>
          <View style={styles.etaItem}>
            <Ionicons name="map-outline" size={sw(18)} color="#105641" />
            <View style={styles.etaTextBlock}>
              <Text style={styles.etaValue}>3.2 km</Text>
              <Text style={styles.etaLabel}>Distance</Text>
            </View>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaItem}>
            <Ionicons name="time-outline" size={sw(18)} color="#105641" />
            <View style={styles.etaTextBlock}>
              <Text style={styles.etaValue}>12 min</Text>
              <Text style={styles.etaLabel}>ETA</Text>
            </View>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaItem}>
            <Ionicons name="alarm-outline" size={sw(18)} color="#105641" />
            <View style={styles.etaTextBlock}>
              <Text style={styles.etaValue}>10:05 AM</Text>
              <Text style={styles.etaLabel}>Arrival</Text>
            </View>
          </View>
        </View>

        {/* Customer address strip */}
        <View style={styles.addressStrip}>
          <Ionicons name="location-outline" size={sw(14)} color="#5C5C5C" />
          <Text style={styles.addressText} numberOfLines={1}>
            {address}
          </Text>
        </View>

        {/* Directions + Call row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.outlineBtn}
            activeOpacity={0.85}
            onPress={handleDirections}>
            <Ionicons name="navigate-outline" size={sw(18)} color="#1C46CF" />
            <Text style={[styles.outlineBtnText, {color: '#1C46CF'}]}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.outlineBtn, styles.callOutlineBtn]}
            activeOpacity={0.85}
            onPress={handleCallCustomer}>
            <Ionicons name="call-outline" size={sw(18)} color="#105641" />
            <Text style={[styles.outlineBtnText, {color: '#105641'}]}>Call Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Arrived CTA */}
        <TouchableOpacity activeOpacity={0.85} onPress={handleArrived} disabled={arriving}>
          <LinearGradient
            colors={arriving ? ['#888', '#888'] : ['#0E5843', '#022723']}
            style={styles.arrivedBtn}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            {arriving ? <ActivityIndicator color="#FFFFFF" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={sw(20)} color="#FFFFFF" />
                <Text style={styles.arrivedBtnText}>Arrived at Location</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#EEEEEE'},

  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(12),
    paddingBottom: sw(20),
  },
  backBtn: {
    width: sw(36),
    height: sw(36),
    borderRadius: sw(18),
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  pinWrap: {alignItems: 'center'},
  pin: {
    width: sw(36),
    height: sw(36),
    borderRadius: sw(18),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: sw(6),
    borderRightWidth: sw(6),
    borderTopWidth: sw(8),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#022723',
    marginTop: -1,
  },
  partnerPinWrap: {alignItems: 'center', justifyContent: 'center'},

  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: sw(20),
    borderTopRightRadius: sw(20),
    paddingHorizontal: sw(16),
    paddingTop: sw(16),
    gap: sw(12),
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,86,65,0.06)',
    borderRadius: sw(12),
    paddingVertical: sw(12),
    paddingHorizontal: sw(8),
  },
  etaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(6),
  },
  etaDivider: {
    width: 1,
    height: sw(28),
    backgroundColor: '#D8D8D8',
  },
  etaTextBlock: {gap: sw(1)},
  etaValue: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#012823',
  },
  etaLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(10),
    color: '#5C5C5C',
  },

  addressStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    backgroundColor: '#F7F7F7',
    borderRadius: sw(8),
    paddingHorizontal: sw(12),
    paddingVertical: sw(10),
  },
  addressText: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#5C5C5C',
    flex: 1,
  },

  actionRow: {
    flexDirection: 'row',
    gap: sw(12),
  },
  outlineBtn: {
    flex: 1,
    height: sw(46),
    borderRadius: sw(10),
    borderWidth: 1.5,
    borderColor: '#1C46CF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(6),
    backgroundColor: '#FFFFFF',
  },
  callOutlineBtn: {
    borderColor: '#105641',
  },
  outlineBtnText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    fontWeight: '600',
  },

  arrivedBtn: {
    borderRadius: sw(12),
    height: sw(52),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(8),
  },
  arrivedBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default GoToCustomerScreen;
