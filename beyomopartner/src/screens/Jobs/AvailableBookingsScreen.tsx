import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  AppState,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {fonts} from '../../config/theme';
import api from '../../utils/api';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const parseServices = (s: any) => {
  if (Array.isArray(s)) return s;
  if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
  return [];
};

const fmt = (d: string) =>
  new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).toUpperCase();

const AvailableBookingsScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get('/api/v1/partners/bookings/available');
      setBookings(res.data?.data ?? []);
    } catch {
      // silently fail — user can pull to refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload every time screen comes into focus, then keep polling while focused and foregrounded
  useFocusEffect(useCallback(() => {
    fetchBookings();
    let interval: ReturnType<typeof setInterval> | null = setInterval(() => fetchBookings(), 10000);

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        if (!interval) {
          fetchBookings();
          interval = setInterval(() => fetchBookings(), 10000);
        }
      } else if (interval) {
        clearInterval(interval);
        interval = null;
      }
    });

    return () => {
      if (interval) clearInterval(interval);
      sub.remove();
    };
  }, []));

  const renderItem = ({item}: {item: any}) => {
    const services = parseServices(item.services);
    const hasTracking = services.length > 0 && services[0]?.serviceStatus !== undefined;
    const unassigned = hasTracking
      ? services.filter((s: any) => s.serviceStatus === 'unassigned')
      : services;
    const isMulti = services.length > 1 && hasTracking;

    const primaryName =
      services[0]?.name ?? item.service?.name ?? item.serviceName ?? 'Service';
    const serviceLabel = isMulti
      ? `${services.length} services  •  ${unassigned.length} available`
      : primaryName;

    const address = [item.addressLine1, item.addressCity]
      .filter(Boolean)
      .join(', ') || '—';

    const earning = Number(item.partnerEarning ?? item.totalAmount ?? 0);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('IncomingRequest', {booking: item})}>

        {/* Top row: badge + order id + earnings */}
        <View style={styles.cardTop}>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>AVAILABLE</Text>
          </View>
          <View style={{flex: 1}} />
          <Text style={styles.earning}>₹{earning.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.divider} />

        {/* Service */}
        <View style={styles.infoRow}>
          <View style={[styles.iconBox, {backgroundColor: '#EAF5F0'}]}>
            <Ionicons name="sparkles-outline" size={sw(16)} color="#105641" />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.infoLabel}>Service</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{serviceLabel}</Text>
          </View>
          {isMulti && (
            <View style={styles.multiChip}>
              <Text style={styles.multiChipText}>{unassigned.length} left</Text>
            </View>
          )}
        </View>

        {/* Address */}
        <View style={styles.infoRow}>
          <View style={[styles.iconBox, {backgroundColor: '#FFF3E4'}]}>
            <Ionicons name="location-outline" size={sw(16)} color="#C87B1A" />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{address}</Text>
          </View>
        </View>

        {/* Scheduled */}
        <View style={styles.infoRow}>
          <View style={[styles.iconBox, {backgroundColor: '#EEF0FF'}]}>
            <Ionicons name="calendar-outline" size={sw(16)} color="#3D5AF1" />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.infoLabel}>Scheduled</Text>
            <Text style={styles.infoValue}>
              {item.scheduledAt ? fmt(item.scheduledAt) : '—'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <LinearGradient
          colors={['#0E5843', '#022723']}
          style={styles.acceptBtn}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}>
          <Text style={styles.acceptText}>View & Accept</Text>
          <Ionicons name="arrow-forward" size={sw(15)} color="#FDD77A" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, {paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor="#022723" />

      {/* Header */}
      <LinearGradient
        colors={['#0E5843', '#022723']}
        style={[styles.header, {paddingTop: insets.top + sw(12)}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(22)} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{flex: 1, marginLeft: sw(12)}}>
          <Text style={styles.headerTitle}>Available Bookings</Text>
          {!loading && (
            <Text style={styles.headerSub}>
              {bookings.length > 0
                ? `${bookings.length} booking${bookings.length !== 1 ? 's' : ''} near you`
                : 'No bookings available right now'}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => fetchBookings(true)}
          activeOpacity={0.7}
          style={styles.refreshBtn}>
          <Ionicons name="refresh" size={sw(20)} color="#FDD77A" />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#105641" />
          <Text style={styles.loadingText}>Finding bookings near you…</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            bookings.length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchBookings(true)}
              colors={['#105641']}
              tintColor="#105641"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="calendar-outline" size={sw(40)} color="#105641" />
              </View>
              <Text style={styles.emptyTitle}>No bookings available</Text>
              <Text style={styles.emptySub}>
                There are no pending bookings in your city right now.{'\n'}
                Pull down to refresh.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F4F6F8'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sw(16),
    paddingBottom: sw(16),
  },
  headerTitle: {
    fontFamily: fonts.title,
    fontSize: sw(18),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: 'rgba(255,255,255,0.65)',
    marginTop: sw(2),
  },
  refreshBtn: {
    width: sw(38),
    height: sw(38),
    borderRadius: sw(19),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  center: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: sw(12)},
  loadingText: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: '#5C5C5C',
  },

  list: {padding: sw(16), gap: sw(14)},
  listEmpty: {flexGrow: 1},

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(16),
    padding: sw(14),
    gap: sw(10),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardTop: {flexDirection: 'row', alignItems: 'center'},
  newBadge: {
    backgroundColor: '#EAF5F0',
    borderRadius: sw(20),
    paddingHorizontal: sw(10),
    paddingVertical: sw(4),
    borderWidth: 1,
    borderColor: '#B2DFCC',
  },
  newBadgeText: {
    fontFamily: fonts.textFont,
    fontSize: sw(10),
    color: '#105641',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  earning: {
    fontFamily: fonts.title,
    fontSize: sw(20),
    fontWeight: '800',
    color: '#012823',
  },
  divider: {height: 1, backgroundColor: '#F0F0F0'},

  infoRow: {flexDirection: 'row', alignItems: 'center', gap: sw(10)},
  iconBox: {
    width: sw(34),
    height: sw(34),
    borderRadius: sw(8),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(10),
    color: '#9CA3AF',
    lineHeight: sw(14),
  },
  infoValue: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#171816',
    fontWeight: '500',
    lineHeight: sw(18),
  },
  multiChip: {
    backgroundColor: '#FDD77A',
    borderRadius: sw(20),
    paddingHorizontal: sw(8),
    paddingVertical: sw(3),
  },
  multiChipText: {
    fontFamily: fonts.textFont,
    fontSize: sw(10),
    color: '#012823',
    fontWeight: '700',
  },

  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(8),
    borderRadius: sw(10),
    paddingVertical: sw(11),
    marginTop: sw(2),
  },
  acceptText: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: sw(60),
    gap: sw(14),
  },
  emptyIconCircle: {
    width: sw(90),
    height: sw(90),
    borderRadius: sw(45),
    backgroundColor: '#EAF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.title,
    fontSize: sw(18),
    fontWeight: '700',
    color: '#171816',
  },
  emptySub: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: sw(20),
    paddingHorizontal: sw(24),
  },
});

export default AvailableBookingsScreen;
