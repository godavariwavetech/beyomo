import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  AppState,
} from 'react-native';
import {BookingsScreenSkeleton} from '../../components/Skeleton/Skeleton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {fonts} from '../../config/theme';
import {useDispatch, useSelector} from 'react-redux';
import {fetchPartnerBookings} from '../../redux/reducers/partner';
import api from '../../utils/api';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

type TabType = 'available' | 'upcoming' | 'completed';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'});
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
};

const STATUS_CONFIG: Record<string, {bg: string; text: string; dot: string}> = {
  confirmed:   {bg: '#E8F5EF', text: '#1B6B3A', dot: '#1B6B3A'},
  pending:     {bg: '#FEF9EC', text: '#B07A00', dot: '#F5A623'},
  in_progress: {bg: '#EEF0FF', text: '#3D5AF1', dot: '#3D5AF1'},
  completed:   {bg: '#F0F0F0', text: '#5C5C5C', dot: '#9CA3AF'},
  cancelled:   {bg: '#FEF0F0', text: '#CC2222', dot: '#CC2222'},
  available:   {bg: '#FFF8E7', text: '#C87B1A', dot: '#F5A623'},
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=90&fit=crop';

const JobCard = ({
  job,
  isCompleted,
  isAvailable,
  onPress,
}: {
  job: any;
  isCompleted: boolean;
  isAvailable?: boolean;
  onPress: () => void;
}) => {
  const _svcs = (() => {
    const s = job.services;
    if (Array.isArray(s)) return s;
    if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
    return [];
  })();

  const serviceCount = _svcs.length;
  const serviceName =
    _svcs[0]?.name ?? job.service?.name ??
    (typeof job.service === 'string' ? job.service : null) ??
    job.serviceName ?? 'Service';
  const serviceImg = _svcs[0]?.image ?? job.service?.image ?? null;

  const orderId  = job.bookingCode ?? `#${String(job.id ?? '').slice(-8).toUpperCase()}`;
  const customer = job.user?.name ?? job.userName ?? '';
  const address  = [job.addressLine1, job.addressCity, job.addressState].filter(Boolean).join(', ')
    || job.address?.formatted
    || job.address?.line1
    || '';
  const amount   = Number(job.partnerEarning ?? job.totalAmount ?? job.amount ?? 0);
  const rawStatus = isAvailable ? 'available' : (job.status ?? '').toLowerCase();
  const cfg      = STATUS_CONFIG[rawStatus] ?? STATUS_CONFIG.confirmed;
  const statusLabel = rawStatus === 'in_progress' ? 'In Progress'
    : rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

  const date = job.scheduledAt ? formatDate(job.scheduledAt) : '';
  const time = job.scheduledAt ? formatTime(job.scheduledAt) : '';
  const rating = job.customerRating ?? job.rating;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onPress}>

      {/* Left accent bar */}
      <View style={[styles.accentBar, {backgroundColor: cfg.dot}]} />

      <View style={styles.cardInner}>
        {/* ── Row 1: image + service info + status ── */}
        <View style={styles.topRow}>
          <Image
            source={{uri: serviceImg ?? FALLBACK_IMG}}
            style={styles.serviceThumb}
            resizeMode="cover"
          />
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName} numberOfLines={1}>{serviceName}</Text>
            {serviceCount > 1 && (
              <Text style={styles.serviceCount}>+{serviceCount - 1} more service{serviceCount > 2 ? 's' : ''}</Text>
            )}
            <Text style={styles.orderId}>{orderId}</Text>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: cfg.bg}]}>
            <View style={[styles.statusDot, {backgroundColor: cfg.dot}]} />
            <Text style={[styles.statusText, {color: cfg.text}]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Row 2: meta info ── */}
        <View style={styles.metaGrid}>
          {!!customer && (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={sw(13)} color="#5C5C5C" />
              <Text style={styles.metaText} numberOfLines={1}>{customer}</Text>
            </View>
          )}
          {!!date && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={sw(13)} color="#5C5C5C" />
              <Text style={styles.metaText}>{date}</Text>
            </View>
          )}
          {!!time && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={sw(13)} color="#5C5C5C" />
              <Text style={styles.metaText}>{time}</Text>
            </View>
          )}
          {!!address && (
            <View style={[styles.metaItem, {flex: 1, minWidth: '100%'}]}>
              <Ionicons name="location-outline" size={sw(13)} color="#5C5C5C" />
              <Text style={[styles.metaText, {flex: 1}]} numberOfLines={1}>{address}</Text>
            </View>
          )}
        </View>

        {/* ── Pending service-change request ── */}
        {!!job.serviceUpdatePending && (
          <View style={styles.pendingChip}>
            <Ionicons name="time-outline" size={sw(12)} color="#92400E" />
            <Text style={styles.pendingChipText}>Service changes awaiting customer approval</Text>
          </View>
        )}

        {/* ── Rating (completed) ── */}
        {isCompleted && rating != null && (
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Your Rating</Text>
            <View style={styles.starsRow}>
              {[1,2,3,4,5].map(s => (
                <Ionicons key={s} name={s <= rating ? 'star' : 'star-outline'}
                  size={sw(14)} color="#F5A623" />
              ))}
            </View>
          </View>
        )}

        {/* ── Footer: amount + CTA ── */}
        <View style={styles.cardFooter}>
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>Earnings</Text>
            <Text style={styles.amountValue}>₹{amount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.ctaBtn, {backgroundColor: cfg.dot}]}>
            <Text style={styles.ctaText}>
              {isAvailable ? 'View & Accept' : 'View Details'}
            </Text>
            <Ionicons name="arrow-forward" size={sw(13)} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const BookingsScreen = ({navigation}: {navigation: any}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const {bookings, loading} = useSelector((s: any) => s.Partner);
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [refreshing, setRefreshing] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [availableLoading, setAvailableLoading] = useState(false);

  // Fetch bookings on mount
  useEffect(() => {
    dispatch(fetchPartnerBookings());
    fetchAvailableOrders();
  }, [dispatch]);

  // Refresh when screen is focused, then keep polling every few seconds while it stays focused
  useFocusEffect(
    React.useCallback(() => {
      const refresh = () => { dispatch(fetchPartnerBookings()); fetchAvailableOrders(); };
      refresh();
      let interval: ReturnType<typeof setInterval> | null = setInterval(refresh, 10000);

      const sub = AppState.addEventListener('change', state => {
        if (state === 'active') {
          if (!interval) { refresh(); interval = setInterval(refresh, 10000); }
        } else if (interval) {
          clearInterval(interval);
          interval = null;
        }
      });

      return () => {
        if (interval) clearInterval(interval);
        sub.remove();
      };
    }, [dispatch]),
  );

  const fetchAvailableOrders = async () => {
    try {
      setAvailableLoading(true);
      console.log('[BOOKINGS] Fetching available orders...');
      const res = await api.get('/api/v1/partners/bookings/available');
      const orders = res.data?.data ?? [];
      console.log('[BOOKINGS] Available orders:', orders.length);
      setAvailableOrders(orders);
    } catch (e: any) {
      console.error('[BOOKINGS] Error fetching available orders:', e.message);
      setAvailableOrders([]);
    } finally {
      setAvailableLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchPartnerBookings()),
        fetchAvailableOrders(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const getDisplayItems = () => {
    if (activeTab === 'available') {
      return availableOrders;
    }
    return bookings.filter((b: any) => {
      const s = b.status?.toLowerCase();
      if (activeTab === 'upcoming') return s === 'confirmed' || s === 'pending' || s === 'in_progress';
      return s === 'completed' || s === 'cancelled';
    });
  };

  const displayItems = getDisplayItems();
  const isLoading = activeTab === 'available' ? availableLoading : (loading && bookings.length === 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      <View style={[styles.header, {paddingTop: insets.top + sw(14)}]}>
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>My Jobs</Text>
          <View style={styles.titleUnderline} />
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={sw(22)} color="#012823" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {(['available', 'upcoming', 'completed'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            activeOpacity={0.85}
            onPress={() => setActiveTab(tab)}>
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'available' ? 'Available' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {tab === 'available' && availableOrders.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{availableOrders.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>
        {activeTab === 'available' ? 'New Orders' : activeTab === 'upcoming' ? 'Upcoming Jobs' : 'Completed Jobs'}
        {'  '}
        <Text style={styles.countBadge}>{displayItems.length}</Text>
      </Text>

      {isLoading ? (
        <BookingsScreenSkeleton />
      ) : displayItems.length === 0 ? (
        <Text style={styles.emptyText}>
          No {activeTab === 'available' ? 'available orders' : activeTab === 'upcoming' ? 'upcoming jobs' : 'completed jobs'} found.
        </Text>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(24)}]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
          {displayItems.map((item: any) => (
            <JobCard
              key={item._id ?? item.id}
              job={item}
              isCompleted={activeTab === 'completed'}
              isAvailable={activeTab === 'available'}
              onPress={() => {
                if (activeTab === 'available') {
                  navigation.navigate('IncomingRequest', {booking: item});
                } else if (item.status === 'in_progress') {
                  navigation.navigate('ActiveJob', {job: item});
                } else {
                  navigation.navigate('JobDetails', {job: item});
                }
              }}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F5F5'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingBottom: sw(12),
    backgroundColor: '#F5F5F5',
  },
  titleBlock: {gap: sw(6)},
  headerTitle: {fontFamily: fonts.primary, fontSize: sw(22), fontWeight: '400', color: '#012823'},
  titleUnderline: {width: sw(36), height: 2, backgroundColor: '#C49738'},

  tabRow: {flexDirection: 'row', marginHorizontal: sw(16), gap: sw(10), marginBottom: sw(12)},
  tab: {
    flex: 1,
    height: sw(36),
    borderRadius: sw(8),
    borderWidth: 1,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  tabActive: {backgroundColor: '#012823', borderColor: '#012823'},
  tabContent: {flexDirection: 'row', alignItems: 'center', gap: sw(6)},
  tabText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#5C5C5C', fontWeight: '500'},
  tabTextActive: {color: '#FFFFFF', fontWeight: '700'},
  tabBadge: {
    backgroundColor: '#FDD77A',
    borderRadius: sw(10),
    paddingHorizontal: sw(6),
    paddingVertical: sw(2),
    minWidth: sw(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#012823', fontWeight: '700'},

  sectionLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    fontWeight: '600',
    color: '#5C5C5C',
    marginHorizontal: sw(16),
    marginBottom: sw(10),
  },
  countBadge: {color: '#012823'},

  emptyText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#A3A3A3',
    textAlign: 'center',
    marginTop: sw(60),
    paddingHorizontal: sw(16),
  },

  scroll: {paddingHorizontal: sw(16), gap: sw(12)},

  /* ── Card ── */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(16),
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  accentBar: {width: sw(4), minHeight: sw(100)},
  cardInner: {flex: 1, padding: sw(14), gap: sw(10)},

  /* Top row */
  topRow: {flexDirection: 'row', alignItems: 'flex-start', gap: sw(10)},
  serviceThumb: {
    width: sw(52), height: sw(52),
    borderRadius: sw(10),
    backgroundColor: '#E5E5E5',
    flexShrink: 0,
  },
  serviceInfo: {flex: 1, gap: sw(2)},
  serviceName: {
    fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700',
    color: '#171816', lineHeight: sw(19),
  },
  serviceCount: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#9CA3AF'},
  orderId: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#9CA3AF', marginTop: sw(2)},

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: sw(5),
    borderRadius: sw(20), paddingHorizontal: sw(8), paddingVertical: sw(4),
    alignSelf: 'flex-start',
  },
  statusDot: {width: sw(6), height: sw(6), borderRadius: sw(3)},
  statusText: {fontFamily: fonts.textFont, fontSize: sw(10), fontWeight: '700'},

  divider: {height: 1, backgroundColor: '#F5F5F5'},

  /* Meta grid */
  metaGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: sw(8)},
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: sw(5)},
  metaText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#5C5C5C'},

  /* Rating */
  ratingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF8E7', borderRadius: sw(8),
    paddingHorizontal: sw(10), paddingVertical: sw(7),
  },
  ratingLabel: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#5C5C5C'},
  starsRow: {flexDirection: 'row', gap: sw(2)},
  pendingChip: {
    flexDirection: 'row', alignItems: 'center', gap: sw(6),
    backgroundColor: '#FFFBEB', borderRadius: sw(8), borderWidth: 1, borderColor: '#FDE9BF',
    paddingHorizontal: sw(10), paddingVertical: sw(7),
  },
  pendingChipText: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#92400E', fontWeight: '600'},

  /* Footer */
  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: sw(10),
  },
  amountBlock: {gap: sw(1)},
  amountLabel: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#9CA3AF'},
  amountValue: {fontFamily: fonts.title, fontSize: sw(18), fontWeight: '800', color: '#012823'},
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: sw(5),
    borderRadius: sw(20), paddingHorizontal: sw(14), paddingVertical: sw(8),
  },
  ctaText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#FFFFFF', fontWeight: '700'},
});

export default BookingsScreen;
