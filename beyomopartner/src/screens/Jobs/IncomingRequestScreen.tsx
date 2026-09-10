import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';
import api from '../../utils/api';
import {resolveImageUrl, formatAmount} from '../../utils/utils';
import SwipeToConfirm from '../../components/SwipeToConfirm/SwipeToConfirm';
import {useAppAlert} from '../../hooks/useAppAlert';
import AppAlertModal from '../../components/AppAlertModal/AppAlertModal';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=90&fit=crop';

const parseServices = (s: any): any[] => {
  if (Array.isArray(s)) return s;
  if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
  return [];
};

const IncomingRequestScreen = ({navigation, route}: any) => {
  const insets = useSafeAreaInsets();
  const [booking, setBooking] = useState<any>(
    route?.params?.booking ? {
      ...route.params.booking,
      services: parseServices(route.params.booking.services),
    } : null
  );
  const [loading, setLoading] = useState(!booking);
  const [accepting, setAccepting] = useState(false);
  const {alertConfig, showAlert, hideAlert} = useAppAlert();

  React.useEffect(() => {
    const bookingId = route?.params?.bookingId;
    if (!bookingId || booking) { setLoading(false); return; }
    setLoading(true);

    api.get('/api/v1/partners/bookings/available')
      .then(res => {
        const found = (res.data?.data ?? []).find((b: any) => String(b.id) === String(bookingId));
        if (found) {
          setBooking({...found, services: parseServices(found.services)});
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────
  const services: any[] = parseServices(booking?.services);
  const isMultiService = services.length > 1 && services[0]?.serviceStatus !== undefined;
  const unassignedServices = services.filter(
    (s: any) => !s.serviceStatus || s.serviceStatus === 'unassigned',
  );

  // Group items that were part of a package/combo into a single card instead of
  // listing each of their services as its own line — matching the customer app/website.
  const packageItems = services.filter((s: any) => s.addedByPackage);
  const otherServices = services.filter((s: any) => !s.addedByPackage);
  const otherServicesTotal = otherServices.reduce((sum: number, s: any) => sum + (s.price ?? 0) * (s.qty || 1), 0);
  const multiPackages: any[] = parseServices(booking?.packages);
  const packageGroups = multiPackages.length > 0
    ? multiPackages.map((pkg: any) => ({
        key: pkg.packageId,
        title: pkg.title,
        price: Number(pkg.price || 0) * (pkg.qty || 1),
        items: packageItems.filter((s: any) => s.packageId === pkg.packageId),
      }))
    : packageItems.length > 0
      ? [{
          key: booking?.packageId,
          title: booking?.package?.title ?? 'Package Deal',
          price: Math.max(0, (booking?.baseAmount ?? booking?.totalAmount ?? 0) - otherServicesTotal),
          items: packageItems,
        }]
      : [];

  // Accepting always claims every unassigned service, so earnings reflect that full set.
  // Services' listed `price` is the raw undiscounted per-item price — bookings with
  // packages/combos earn less than the sum of those prices, so scale the booking's real
  // (already-discounted) partnerEarning by the unassigned share of the raw total instead
  // of summing raw prices directly (that overstated the earnings for combo bookings).
  const selectedEarnings = useMemo(() => {
    const bookingEarning = Number(booking?.partnerEarning ?? booking?.totalAmount ?? 0);
    if (!isMultiService) return bookingEarning;
    const rawTotal = services.reduce((sum: number, svc: any) => sum + svc.price * (svc.qty || 1), 0);
    const rawUnassigned = unassignedServices.reduce((sum: number, svc: any) => sum + svc.price * (svc.qty || 1), 0);
    return rawTotal > 0 ? bookingEarning * (rawUnassigned / rawTotal) : bookingEarning;
  }, [services, unassignedServices, isMultiService, booking]);

  const orderId = booking?.bookingCode
    ?? (booking?.id ? String(booking.id).slice(-8).toUpperCase() : '—');

  const fullAddress = [
    booking?.addressLine1,
    booking?.addressCity,
    booking?.addressState,
    booking?.addressPincode,
  ].filter(Boolean).join(', ') || booking?.address?.formatted || '—';

  const customerName = booking?.user?.name ?? booking?.userName ?? '—';

  const scheduledAt = booking?.scheduledAt
    ? new Date(booking.scheduledAt).toLocaleString('en-IN', {
        weekday: 'short', day: '2-digit', month: 'long',
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
    : '—';

  const lat = booking?.addressLat ?? booking?.address?.lat;
  const lng = booking?.addressLng ?? booking?.address?.lng;
  const hasCoords = !!(lat && lng);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleDirections = () => {
    const url = hasCoords
      ? `https://maps.google.com/?daddr=${lat},${lng}`
      : `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;
    Linking.openURL(url);
  };

  // Accepting always claims every unassigned service on the booking — there's no
  // partial-selection step; the partner takes the whole job (or the whole remainder
  // of it, for a multi-partner booking where some services were already claimed).
  const handleAccept = async () => {
    if (!booking?.id) { navigation.replace('JobDetails', {job: booking}); return; }
    setAccepting(true);
    try {
      const res = await api.post(`/api/v1/partners/bookings/${booking.id}/accept`);
      navigation.replace('JobDetails', {job: res.data.data ?? booking});
    } catch (e: any) {
      setAccepting(false);
      const isGone = e.response?.status === 409;
      showAlert(
        isGone ? 'Already Taken' : 'Error',
        isGone
          ? 'This booking is no longer available.'
          : (e.response?.data?.message ?? 'Could not accept booking.'),
        [{text: 'OK', onPress: () => (isGone ? navigation.goBack() : null)}],
      );
    }
  };

  const handleReject = () => {
    showAlert('Reject Request', 'Are you sure you want to reject this booking?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Reject', style: 'destructive', onPress: () => navigation.goBack()},
    ]);
  };

  // ── Loading / not found ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.root, {justifyContent: 'center', alignItems: 'center'}]}>
        <StatusBar barStyle="light-content" backgroundColor="#022723" />
        <ActivityIndicator size="large" color="#105641" />
        <Text style={styles.loadingText}>Loading booking details…</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.root, {justifyContent: 'center', alignItems: 'center', padding: sw(32)}]}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <Ionicons name="calendar-outline" size={sw(48)} color="#CCCCCC" />
        <Text style={styles.notFoundTitle}>Booking not found</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, {paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Header ── */}
      <LinearGradient
        colors={['#0E5843', '#022723']}
        style={[styles.header, {paddingTop: insets.top + sw(12)}]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={sw(20)} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{flex: 1, marginLeft: sw(10)}}>
          <Text style={styles.headerTitle}>New Job Request</Text>
          <Text style={styles.headerSub}>#{orderId}</Text>
        </View>
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      </LinearGradient>

      {/* ── Scrollable details ── */}
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={{padding: sw(16), gap: sw(12), paddingBottom: sw(100)}}
        showsVerticalScrollIndicator={false}>

        {/* ── Customer info ── */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, {backgroundColor: '#EEF0FF'}]}>
              <Ionicons name="person" size={sw(18)} color="#3D5AF1" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.cardLabel}>Customer</Text>
              <Text style={styles.cardValue}>{customerName}</Text>
            </View>
            <View style={styles.callBtnLocked}>
              <Ionicons name="lock-closed" size={sw(14)} color="#9CA3AF" />
            </View>
          </View>
          <Text style={styles.contactLockedNote}>
            Contact number unlocks once you accept this job
          </Text>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, {backgroundColor: '#FFF3E4'}]}>
              <Ionicons name="location" size={sw(18)} color="#C87B1A" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.cardLabel}>Address</Text>
              <Text style={styles.cardValue}>{fullAddress}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.mapBtn} onPress={handleDirections} activeOpacity={0.85}>
            <Ionicons name="navigate-outline" size={sw(16)} color="#3D5AF1" />
            <Text style={styles.mapBtnText}>View Location on Map</Text>
            <Ionicons name="arrow-forward" size={sw(14)} color="#3D5AF1" style={{marginLeft: 'auto' as any}} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, {backgroundColor: '#EAF5F0'}]}>
              <Ionicons name="calendar" size={sw(18)} color="#105641" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.cardLabel}>Scheduled</Text>
              <Text style={styles.cardValue}>{scheduledAt}</Text>
            </View>
          </View>
        </View>

        {/* ── Services ── */}
        <View style={styles.card}>
          <View style={styles.svcHeaderRow}>
            <Text style={styles.sectionTitle}>
              {isMultiService ? `Services (${services.length})` : 'Service'}
            </Text>
          </View>

          {packageGroups.map((group) => (
            <View
              key={group.key ?? group.title}
              style={[styles.svcRow, {alignItems: 'flex-start'}]}>
              <View style={{flex: 1}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: sw(6), flexWrap: 'wrap'}}>
                  <Text style={styles.svcName}>{group.title}</Text>
                  <View style={styles.packageBadge}>
                    <Text style={styles.packageBadgeText}>Package</Text>
                  </View>
                </View>
                <View style={{marginTop: sw(4)}}>
                  {group.items.map((s: any, i: number) => (
                    <Text key={s._id ?? s.id ?? i} style={styles.metaChipText}>{i + 1}. {s.name}</Text>
                  ))}
                </View>
              </View>
              <Text style={styles.svcPrice}>₹{formatAmount(group.price)}</Text>
            </View>
          ))}

          {otherServices.map((svc: any, idx: number) => {
            const isTaken = svc.serviceStatus && svc.serviceStatus !== 'unassigned';
            const imgUri = resolveImageUrl(svc.image ?? booking?.service?.image) ?? FALLBACK_IMAGE;

            return (
              <View
                key={idx}
                style={[styles.svcRow, isTaken && styles.svcRowTaken]}>

                {/* Service image */}
                <Image
                  source={{uri: imgUri}}
                  style={[styles.svcImage, isTaken && {opacity: 0.5}]}
                  resizeMode="cover"
                />

                {/* Service info */}
                <View style={{flex: 1}}>
                  <Text style={[styles.svcName, isTaken && styles.svcNameTaken]}
                    numberOfLines={1}>{svc.name}</Text>
                  <View style={styles.svcMetaRow}>
                    {svc.duration ? (
                      <View style={styles.metaChip}>
                        <Ionicons name="time-outline" size={sw(11)} color="#5C5C5C" />
                        <Text style={styles.metaChipText}>{svc.duration} min</Text>
                      </View>
                    ) : null}
                    {svc.qty && svc.qty > 1 ? (
                      <View style={styles.metaChip}>
                        <Text style={styles.metaChipText}>×{svc.qty}</Text>
                      </View>
                    ) : null}
                  </View>
                  {isTaken && svc.assignedPartnerName && (
                    <Text style={styles.takenByText}>Taken by {svc.assignedPartnerName}</Text>
                  )}
                </View>

                {/* Right side */}
                <View style={{alignItems: 'flex-end', gap: sw(4)}}>
                  <Text style={[styles.svcPrice, isTaken && {color: '#9CA3AF'}]}>
                    ₹{formatAmount(svc.price * (svc.qty || 1))}
                  </Text>
                  {isTaken && (
                    <View style={styles.takenBadge}>
                      <Text style={styles.takenBadgeText}>Taken</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {isMultiService && unassignedServices.length === 0 && (
            <View style={styles.allTakenBanner}>
              <Ionicons name="information-circle-outline" size={sw(16)} color="#D97706" />
              <Text style={styles.allTakenText}>All services in this booking have been claimed.</Text>
            </View>
          )}
        </View>

        {/* ── Earnings ── */}
        <LinearGradient colors={['#0E5843', '#022723']} style={styles.earningsCard}
          start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
          <View>
            <Text style={styles.earningsLabel}>Your Earnings</Text>
            <Text style={styles.earningsAmount}>
              ₹{formatAmount(selectedEarnings)}
            </Text>
          </View>
          <Ionicons name="cash-outline" size={sw(36)} color="rgba(255,255,255,0.25)" />
        </LinearGradient>

        {/* ── Notes ── */}
        {booking?.notes ? (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, {backgroundColor: '#F5F5F5'}]}>
                <Ionicons name="document-text-outline" size={sw(18)} color="#5C5C5C" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.cardLabel}>Customer Notes</Text>
                <Text style={styles.cardValue}>{booking.notes}</Text>
              </View>
            </View>
          </View>
        ) : null}

      </ScrollView>

      {/* ── Bottom action bar ── */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + sw(8)}]}>
        <SwipeToConfirm
          label={
            isMultiService
              ? `Accept All (${unassignedServices.length})`
              : 'Accept Job'
          }
          onConfirm={handleAccept}
          disabled={accepting || (isMultiService && unassignedServices.length === 0)}
          loading={accepting}
        />
        <TouchableOpacity style={styles.rejectBtn} activeOpacity={0.85} onPress={handleReject}>
          <Ionicons name="close-circle-outline" size={sw(18)} color="#DB1919" />
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
      </View>

      <AppAlertModal config={alertConfig} onRequestClose={hideAlert} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F4F6F8'},

  loadingText: {fontFamily: fonts.textFont, fontSize: sw(14), color: '#5C5C5C', marginTop: sw(12)},
  notFoundTitle: {fontFamily: fonts.title, fontSize: sw(18), fontWeight: '700', color: '#5C5C5C', marginTop: sw(12)},
  goBackBtn: {marginTop: sw(16), paddingHorizontal: sw(24), paddingVertical: sw(10), backgroundColor: '#105641', borderRadius: sw(8)},
  goBackText: {fontFamily: fonts.textFont, fontSize: sw(14), color: '#FFFFFF', fontWeight: '600'},

  /* ── Header ── */
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: sw(16), paddingBottom: sw(16), gap: sw(10),
  },
  backBtn: {
    width: sw(36), height: sw(36), borderRadius: sw(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '700', color: '#FFFFFF'},
  headerSub: {fontFamily: fonts.textFont, fontSize: sw(11), color: 'rgba(255,255,255,0.65)', marginTop: sw(2)},
  newBadge: {
    backgroundColor: '#FDD77A', borderRadius: sw(6),
    paddingHorizontal: sw(10), paddingVertical: sw(4),
  },
  newBadgeText: {fontFamily: fonts.title, fontSize: sw(11), fontWeight: '800', color: '#012823'},

  /* ── Sheet ── */
  sheet: {flex: 1},

  /* ── Card ── */
  card: {
    backgroundColor: '#FFFFFF', borderRadius: sw(16), padding: sw(14), gap: sw(12),
    elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  cardRow: {flexDirection: 'row', alignItems: 'center', gap: sw(10)},
  iconBox: {
    width: sw(38), height: sw(38), borderRadius: sw(10),
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardLabel: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#9CA3AF'},
  cardValue: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '500', marginTop: sw(1)},
  divider: {height: 1, backgroundColor: '#F5F5F5'},
  callBtn: {
    width: sw(36), height: sw(36), borderRadius: sw(18),
    backgroundColor: '#EAF5F0', alignItems: 'center', justifyContent: 'center',
  },
  callBtnLocked: {
    width: sw(36), height: sw(36), borderRadius: sw(18),
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  contactLockedNote: {
    fontFamily: fonts.textFont, fontSize: sw(11), color: '#9CA3AF',
    marginTop: -sw(4),
  },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: sw(8),
    borderWidth: 1.5, borderColor: '#3D5AF1',
    borderRadius: sw(10), paddingHorizontal: sw(12), paddingVertical: sw(10),
    backgroundColor: '#F0F3FF',
  },
  mapBtnText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#3D5AF1', fontWeight: '600', flex: 1},

  /* ── Services ── */
  sectionTitle: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#171816'},
  svcHeaderRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},

  svcRow: {
    flexDirection: 'row', alignItems: 'center', gap: sw(12),
    padding: sw(10), borderRadius: sw(12),
    borderWidth: 1.5, borderColor: '#EEEDED', backgroundColor: '#FAFAFA',
  },
  svcRowTaken: {borderColor: '#E5E5E5', backgroundColor: '#F5F5F5', opacity: 0.7},
  svcImage: {
    width: sw(56), height: sw(56), borderRadius: sw(10),
    backgroundColor: '#E5E5E5', flexShrink: 0,
  },
  svcName: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '600'},
  svcNameTaken: {color: '#9CA3AF'},
  svcMetaRow: {flexDirection: 'row', gap: sw(6), marginTop: sw(4), flexWrap: 'wrap'},
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: sw(3),
    backgroundColor: '#F0F0F0', borderRadius: sw(4), paddingHorizontal: sw(6), paddingVertical: sw(2),
  },
  metaChipText: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#5C5C5C'},
  svcPrice: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#105641'},
  packageBadge: {
    backgroundColor: '#E4E1D8', borderRadius: sw(4),
    paddingHorizontal: sw(5), paddingVertical: sw(1),
  },
  packageBadgeText: {fontFamily: fonts.textFont, fontSize: sw(11), fontWeight: '700', color: '#292524'},
  takenByText: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#9CA3AF', marginTop: sw(2), fontStyle: 'italic'},
  takenBadge: {
    backgroundColor: '#E5E7EB', borderRadius: sw(6),
    paddingHorizontal: sw(7), paddingVertical: sw(3),
  },
  takenBadgeText: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#6B7280', fontWeight: '600'},
  allTakenBanner: {
    flexDirection: 'row', alignItems: 'center', gap: sw(8),
    backgroundColor: '#FEF3C7', borderRadius: sw(8), padding: sw(10),
  },
  allTakenText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#92400E', flex: 1},

  /* ── Earnings ── */
  earningsCard: {
    borderRadius: sw(16), padding: sw(16),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  earningsLabel: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.7)', marginBottom: sw(4)},
  earningsAmount: {fontFamily: fonts.title, fontSize: sw(28), fontWeight: '800', color: '#FFFFFF'},

  /* ── Footer ── */
  footer: {
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EEEDED',
    paddingHorizontal: sw(16), paddingTop: sw(12), gap: sw(8),
    elevation: 8, shadowColor: '#000', shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.08, shadowRadius: 8,
  },
  rejectBtn: {
    height: sw(44), borderRadius: sw(12),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sw(6),
    backgroundColor: '#FFFFFF',
  },
  rejectText: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#DB1919'},
});

export default IncomingRequestScreen;
