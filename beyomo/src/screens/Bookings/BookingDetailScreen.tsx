import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  RefreshControl,
  AppState,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DatePicker from 'react-native-date-picker';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';
import {useDispatch, useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import {fetchBookingById, cancelBooking, rescheduleBooking, addUserServices, removePackage, addPackage} from '../../redux/reducers/bookings';
import networkCall from '../../utils/networkCall';
import {payWithRazorpay} from '../../utils/payments';
import {resolveImageUrl, formatAmount} from '../../utils/utils';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_SERVICE_QTY = 5;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&q=80&fit=crop';

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('en-IN', {weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'});
  const time = d.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
  return {date, time};
};

const validateRescheduleDate = (date: Date): string => {
  const now = Date.now();
  if (date.getTime() < now + ONE_HOUR_MS) return 'New time must be at least 1 hour from now.';
  if (date.getTime() > now + ONE_MONTH_MS) return 'New time cannot be more than 1 month in advance.';
  return '';
};

const STATUS_BANNER: Record<string, {icon: string; title: string; color: string}> = {
  pending:     {icon: 'time-outline',         title: 'Booking Pending',     color: '#C87B1A'},
  confirmed:   {icon: 'checkmark-circle',     title: 'Booking Confirmed!',  color: '#105641'},
  in_progress: {icon: 'construct',            title: 'Service In Progress', color: '#0369A1'},
  completed:   {icon: 'checkmark-done-circle', title: 'Service Completed',  color: '#105641'},
  cancelled:   {icon: 'close-circle',         title: 'Booking Cancelled',   color: '#B91C1C'},
};

interface AvailableSvc { id: number; name: string; basePrice: string; duration: number; }
type CartItem = {svc: AvailableSvc; qty: number};

const SvcTag = ({type}: {type: 'admin' | 'partner' | 'user' | 'removed' | 'free' | 'package'}) => {
  const cfg = {
    admin:   {label: 'Admin +',   bg: '#EDE9FE', text: '#7C3AED'},
    partner: {label: 'Partner +', bg: '#E0F2FE', text: '#0369A1'},
    user:    {label: 'You +',     bg: '#FEF3C7', text: '#D97706'},
    removed: {label: 'Removed',   bg: '#FEE2E2', text: '#B91C1C'},
    free:    {label: 'FREE',      bg: '#E6F4EC', text: '#1B6B3A'},
    package: {label: 'Package',   bg: '#E4E1D8', text: '#292524'},
  }[type];
  return (
    <View style={{backgroundColor: cfg.bg, borderRadius: sw(4), paddingHorizontal: sw(5), paddingVertical: sw(1)}}>
      <Text style={{fontSize: sw(11), fontWeight: '700', color: cfg.text}}>{cfg.label}</Text>
    </View>
  );
};

const BookingDetailScreen = ({navigation, route}: any) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const {selected: booking, loading, actionLoading} = useSelector((s: any) => s.Bookings);
  const {profile} = useSelector((s: any) => s.User);

  const passedBookingId = route?.params?.bookingId ?? route?.params?.booking?._id ?? route?.params?.booking?.id;

  const [payingNow, setPayingNow] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableServices, setAvailableServices] = useState<AvailableSvc[]>([]);
  const [loadingSvcs, setLoadingSvcs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [svcCart, setSvcCart] = useState<CartItem[]>([]);

  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [loadingPkgs, setLoadingPkgs] = useState(false);
  const [pickingPackage, setPickingPackage] = useState<any>(null);
  const [flexiblePicks, setFlexiblePicks] = useState<number[]>([]);
  const [addPkgError, setAddPkgError] = useState('');

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date>(new Date(Date.now() + ONE_HOUR_MS * 2));
  const [rescheduleError, setRescheduleError] = useState('');
  const [showReschedDatePicker, setShowReschedDatePicker] = useState(false);
  const [showReschedTimePicker, setShowReschedTimePicker] = useState(false);
  const [autoOpenedReschedule, setAutoOpenedReschedule] = useState(false);

  const fetchServices = useCallback(async () => {
    if (availableServices.length > 0) return;
    setLoadingSvcs(true);
    try {
      const result = await networkCall('api/v1/services?limit=500', 'GET');
      const raw = result.response?.data?.data ?? result.response?.data ?? [];
      setAvailableServices(Array.isArray(raw) ? raw : []);
    } catch {}
    setLoadingSvcs(false);
  }, [availableServices.length]);

  const openAddModal = () => {
    setSvcCart([]);
    setSearchQuery('');
    fetchServices();
    setShowAddModal(true);
  };

  const fetchPackages = useCallback(async () => {
    if (availablePackages.length > 0) return;
    setLoadingPkgs(true);
    try {
      const result = await networkCall('api/v1/packages', 'GET');
      const raw = result.response?.data?.data ?? result.response?.data ?? [];
      setAvailablePackages(Array.isArray(raw) ? raw : []);
    } catch {}
    setLoadingPkgs(false);
  }, [availablePackages.length]);

  const openAddPackageModal = () => {
    setPickingPackage(null);
    setFlexiblePicks([]);
    setAddPkgError('');
    fetchPackages();
    setShowAddPackageModal(true);
  };

  const submitAddPackage = async (packageId: number, services: {id: number; qty: number}[]) => {
    setAddPkgError('');
    const result = await dispatch(addPackage({bookingId: booking?.id ?? booking?._id, packageId, services}));
    if (result.meta.requestStatus === 'fulfilled') {
      setShowAddPackageModal(false);
      setPickingPackage(null);
      setFlexiblePicks([]);
    } else {
      // Most likely cause is the package having just been added elsewhere (another device,
      // or a stale package list) — drop back to the picker list and refresh the booking so
      // it reflects reality instead of leaving the user stuck mid-pick on it.
      setAddPkgError(result.payload ?? 'Failed to add package. Please try again.');
      setPickingPackage(null);
      setFlexiblePicks([]);
      if (passedBookingId) dispatch(fetchBookingById(passedBookingId));
    }
  };

  const handleAddFixedPackage = (pkg: any) => {
    const services = (pkg.services || []).map((s: any) => ({id: s.serviceId ?? s.id, qty: 1}));
    submitAddPackage(pkg.id, services);
  };

  const handlePickFlexible = (pkg: any) => {
    setPickingPackage(pkg);
    setFlexiblePicks([]);
    setAddPkgError('');
    fetchServices();
  };

  const toggleFlexiblePick = (serviceId: number) => {
    setFlexiblePicks(prev => {
      if (prev.includes(serviceId)) return prev.filter(id => id !== serviceId);
      if (prev.length >= (pickingPackage?.serviceCount ?? 0)) return prev;
      return [...prev, serviceId];
    });
  };

  const handleConfirmFlexiblePackage = () => {
    if (!pickingPackage || flexiblePicks.length !== pickingPackage.serviceCount) return;
    submitAddPackage(pickingPackage.id, flexiblePicks.map(id => ({id, qty: 1})));
  };

  const handleConfirmAdd = async () => {
    if (!svcCart.length || !booking?.id) return;
    const result = await dispatch(addUserServices({
      bookingId: booking.id ?? booking._id,
      services: svcCart.map(item => ({id: item.svc.id, qty: item.qty})),
    }));
    if (result.meta.requestStatus === 'fulfilled') {
      const n = svcCart.length;
      setSvcCart([]);
      setShowAddModal(false);
      Alert.alert(
        'Services Added',
        `${n} service(s) added to your booking. New total: ₹${formatAmount(parseFloat(result.payload?.totalAmount ?? 0))}`,
      );
    } else {
      Alert.alert('Error', result.payload ?? 'Failed to add services. Please try again.');
    }
  };

  const handleRemovePackage = (packageId: number | null, title: string) => {
    Alert.alert(
      'Remove Package',
      `Remove "${title}" from this booking? Its services will be dropped and any remaining services will be billed at their normal price.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await dispatch(removePackage({bookingId: booking?.id ?? booking?._id, packageId}));
            if (result.meta.requestStatus !== 'fulfilled') {
              Alert.alert('Error', result.payload ?? 'Failed to remove package. Please try again.');
            }
          },
        },
      ],
    );
  };

  const filteredSvcs = availableServices.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const cartTotal = svcCart.reduce((sum, item) => sum + parseFloat(item.svc.basePrice) * item.qty, 0);

  // Poll while this screen is focused, but only while the app is actually in the
  // foreground — `useFocusEffect` only tracks navigation focus, not whether the app
  // itself is backgrounded, so without this the interval kept firing (and dispatching
  // state updates) after the user left the app, which was crashing it.
  useFocusEffect(
    useCallback(() => {
      if (!passedBookingId) return;
      dispatch(fetchBookingById(passedBookingId));

      let interval: ReturnType<typeof setInterval> | null = setInterval(
        () => dispatch(fetchBookingById(passedBookingId)),
        10000,
      );

      const sub = AppState.addEventListener('change', state => {
        if (state === 'active') {
          if (!interval) {
            dispatch(fetchBookingById(passedBookingId));
            interval = setInterval(() => dispatch(fetchBookingById(passedBookingId)), 10000);
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
    }, [passedBookingId]),
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    if (!passedBookingId) return;
    setRefreshing(true);
    await dispatch(fetchBookingById(passedBookingId));
    setRefreshing(false);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      {text: 'No, Keep it', style: 'cancel'},
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await dispatch(cancelBooking(booking?.id ?? booking?._id));
          navigation?.goBack();
        },
      },
    ]);
  };

  const openRescheduleModal = () => {
    const base = booking?.scheduledAt ? new Date(booking.scheduledAt) : new Date();
    const minAllowed = Date.now() + ONE_HOUR_MS;
    const initial = base.getTime() > minAllowed ? base : new Date(minAllowed + 60 * 60 * 1000);
    setRescheduleDate(initial);
    setRescheduleError(validateRescheduleDate(initial));
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = async () => {
    const err = validateRescheduleDate(rescheduleDate);
    if (err) {
      setRescheduleError(err);
      return;
    }
    const result = await dispatch(rescheduleBooking({
      bookingId: booking?.id ?? booking?._id,
      scheduledAt: rescheduleDate.toISOString(),
    }));
    if (result.meta.requestStatus === 'fulfilled') {
      setShowRescheduleModal(false);
      Alert.alert('Booking Rescheduled', 'Your booking has been rescheduled successfully.');
    } else {
      Alert.alert('Error', result.payload ?? 'Failed to reschedule booking. Please try again.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (route?.params?.openReschedule && booking && !autoOpenedReschedule) {
        setAutoOpenedReschedule(true);
        openRescheduleModal();
      }
    }, [route?.params?.openReschedule, booking, autoOpenedReschedule]),
  );

  const handleCompletePayment = async () => {
    const bookingId = booking?.id ?? booking?._id;
    setPayingNow(true);
    const result = await payWithRazorpay({
      bookingId,
      bookingCode: booking?.bookingCode,
      contact: profile?.phone,
      name: profile?.name,
      email: profile?.email,
    });
    setPayingNow(false);
    if (result.success) {
      Alert.alert('Payment Successful', 'Your payment has been received.');
      dispatch(fetchBookingById(bookingId));
    } else if (result.reason !== 'cancelled') {
      Alert.alert('Payment Failed', result.message);
    }
  };

  // Only show the full-screen spinner on the very first load — background polling
  // refreshes (and pull-to-refresh, which has its own RefreshControl spinner) should
  // update the data silently without replacing the screen.
  if (loading && !booking) {
    return (
      <View style={[styles.root, {alignItems: 'center', justifyContent: 'center'}]}>
        <ActivityIndicator size="large" color="#105641" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.root, {alignItems: 'center', justifyContent: 'center', padding: sw(32)}]}>
        <Ionicons name="alert-circle-outline" size={sw(48)} color="#CCCCCC" />
        <Text style={{fontFamily: 'System', fontSize: sw(15), color: '#888', textAlign: 'center', marginTop: sw(12)}}>
          Unable to load booking details.
        </Text>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={{marginTop: sw(20)}}>
          <Text style={{fontFamily: 'System', fontSize: sw(14), color: '#105641', fontWeight: '600'}}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bookingId = booking.bookingCode ?? `#${(booking._id ?? booking.id)?.slice(-10).toUpperCase()}`;
  const services: any[] = booking.services ?? [];
  const activeServices = services.filter((s: any) => !s.removed);
  const packageItems = activeServices.filter((s: any) => s.addedByPackage);
  const otherItems = activeServices.filter((s: any) => !s.addedByPackage);
  // baseAmount is the source of truth for the subtotal — it already accounts for the
  // package's fixed price, unlike summing each line item's own catalog price (which,
  // for a package, adds up to more than what was actually charged).
  const subtotal = booking.baseAmount ?? activeServices.reduce((s: number, i: any) => s + (i.price ?? 0) * (i.qty || 1), 0);
  const otherItemsTotal = otherItems.reduce((s: number, i: any) => s + (i.price ?? 0) * (i.qty || 1), 0);
  // A booking can contain more than one package/combo booked together — each keeps its
  // own title and price, so they must be grouped separately rather than merged into one.
  const multiPackages: any[] = Array.isArray(booking.packages) ? booking.packages : [];
  const packageGroups = multiPackages.length > 0
    ? multiPackages.map((pkg: any) => ({
        key: pkg.packageId,
        title: pkg.title,
        qty: Number(pkg.qty) || 1,
        unitPrice: Number(pkg.price) || 0,
        price: Number(pkg.price || 0) * (pkg.qty || 1),
        items: packageItems.filter((s: any) => s.packageId === pkg.packageId),
      }))
    : packageItems.length > 0
      ? [{
          key: booking.packageId,
          title: booking.package?.title ?? 'Package Deal',
          qty: Number(booking.packageQty) || 1,
          // Back-derived, so there's no reliable per-unit figure to show alongside it.
          unitPrice: 0,
          price: Math.max(0, subtotal - otherItemsTotal),
          items: packageItems,
        }]
      : [];
  // A package already on the booking can't be added again (the backend rejects it) —
  // filter it out of the "Add Package" picker up front instead of letting the user hit that error.
  const existingPackageIds = new Set<number>([
    ...(booking.packageId != null ? [booking.packageId] : []),
    ...multiPackages.map((p: any) => p.packageId),
  ]);
  const addablePackages = availablePackages.filter((p: any) => !existingPackageIds.has(p.id));
  const total = booking.totalAmount ?? subtotal;

  // Item count is quantity-aware: two of the same service is two items. Packages count
  // as one item each (their contents are listed underneath), plus their own qty.
  const itemCount =
    otherItems.reduce((n: number, i: any) => n + (Number(i.qty) || 1), 0) +
    (multiPackages.length > 0
      ? multiPackages.reduce((n: number, pkg: any) => n + (Number(pkg.qty) || 1), 0)
      : packageGroups.length * (Number(booking.packageQty) || 1));

  // The bill lines, so "Total Paid" is arithmetic the user can follow rather than a
  // number that appears from nowhere. Every component the backend stores gets a row
  // when it's non-zero; `discountAmount` was previously never shown at all.
  const offerDiscount = Number(booking.discountAmount) || 0;
  const couponDiscount = Number(booking.couponDiscountAmount) || 0;
  const taxAmount = Number(booking.taxAmount) || 0;
  const discountedSubtotal = Math.max(0, subtotal - offerDiscount - couponDiscount);
  // Derive the rate actually charged rather than assuming 5% — it's configurable per
  // category/package, so a hardcoded label would be wrong for some bookings.
  const gstRate = discountedSubtotal > 0 ? (taxAmount / discountedSubtotal) * 100 : 0;
  const gstLabel = gstRate > 0 ? `GST (${gstRate.toFixed(gstRate % 1 === 0 ? 0 : 1)}%)` : 'GST';
  // Every amount on screen is rounded to whole rupees, so the spelled-out sum can land
  // a rupee off its own parts (100.4 + 50.4 shows as 100 + 50 = 151). A line whose only
  // job is to show the arithmetic must not contradict itself — show it only when the
  // rounded figures genuinely add up; the rows above carry the breakdown regardless.
  const formulaAddsUp =
    Math.round(discountedSubtotal) + Math.round(taxAmount) === Math.round(Number(total) || 0);
  const partner = booking.partner ?? {};
  const partnerName = partner.name ?? booking.partnerName ?? '';
  const partnerAvatar = resolveImageUrl(partner.profilePicture ?? partner.avatar ?? partner.photo) ?? '';
  const partnerPhone = partner.phone ?? '';
  const partnerRole = partner.specialty ?? partner.role ?? 'Beauty Expert';
  const partnerRating = partner.ratingsAverage ?? partner.averageRating ?? partner.rating ?? '';
  const partnerExp = partner.experience ? `${partner.experience}+ yrs experience` : '';
  // The API returns the delivery address as flat columns — addressLine1, addressCity
  // and friends — never as a nested `address` object, so reading `booking.address`
  // always produced undefined and the `!!address` guard below silently hid the whole
  // row. The address the user picked at checkout is stored on the booking; build it
  // from the fields that actually exist, keeping the nested/string shapes as a
  // fallback in case another caller supplies one.
  const flatAddress = [
    booking.addressLine1,
    booking.addressLine2,
    booking.addressCity,
    booking.addressState,
    booking.addressPincode,
  ].filter(Boolean).join(', ');
  const nestedAddress =
    booking.address?.formatted ??
    booking.address?.line1 ??
    (typeof booking.address === 'string' ? booking.address : '');
  const address = flatAddress || nestedAddress || '';
  const addressLabel = booking.addressLabel ?? '';

  // A reschedule is recorded on the booking as a counter plus the slot it moved from.
  const isRescheduled = Number(booking.rescheduledCount ?? 0) > 0;
  const previousDt = booking.previousScheduledAt
    ? formatDateTime(booking.previousScheduledAt)
    : null;
  const paymentModeLabel = booking.paymentMode === 'cod' ? 'Pay after Service' : 'Paid Online';
  const paymentStatusLabel = booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentMode === 'cod' ? 'Due on completion' : 'Unpaid';

  const dt = booking.scheduledAt ? formatDateTime(booking.scheduledAt) : null;

  // Backend only allows cancel/reschedule while the booking is pending or confirmed —
  // once a partner has started the job (in_progress) it can no longer be cancelled/rescheduled.
  const isCancellable = ['pending', 'confirmed'].includes(booking.status?.toLowerCase() ?? '');
  const isCompleted = booking.status?.toLowerCase() === 'completed';
  const needsPayment = booking.paymentMode === 'online'
    && booking.paymentStatus !== 'paid'
    && !['cancelled'].includes(booking.status?.toLowerCase() ?? '');

  const statusInfo = STATUS_BANNER[booking.status?.toLowerCase() ?? ''] ?? STATUS_BANNER.pending;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#012823" />

      <View style={[styles.header, {paddingTop: insets.top + sw(8)}]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(22)} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{width: sw(22)}} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#105641']} />}
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(32)}]}>

        <View style={[styles.confirmedBanner, {backgroundColor: statusInfo.color}]}>
          <View style={styles.confirmedIconWrap}>
            <Ionicons name={statusInfo.icon} size={sw(36)} color="#FFFFFF" />
          </View>
          <View style={{flex: 1}}>
            <View style={styles.statusTitleRow}>
              <Text style={styles.confirmedTitle}>{statusInfo.title}</Text>
              {isRescheduled && (
                <View style={styles.rescheduledChip}>
                  <Ionicons name="repeat" size={sw(11)} color="#FFFFFF" />
                  <Text style={styles.rescheduledChipText}>Rescheduled</Text>
                </View>
              )}
            </View>
            <Text style={styles.confirmedCode}>Booking ID: {bookingId}</Text>
            {isRescheduled && !!previousDt && (
              <Text style={styles.rescheduledNote}>
                Moved from {previousDt.date}, {previousDt.time}
              </Text>
            )}
          </View>
        </View>

        {needsPayment && (
          <View style={styles.paymentDueCard}>
            <View style={{flex: 1}}>
              <Text style={styles.paymentDueTitle}>Payment Pending</Text>
              <Text style={styles.paymentDueSub}>Complete your online payment to confirm this booking.</Text>
            </View>
            <TouchableOpacity
              style={[styles.paymentDueBtn, payingNow && {opacity: 0.6}]}
              activeOpacity={0.8}
              disabled={payingNow}
              onPress={handleCompletePayment}>
              {payingNow ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                <Text style={styles.paymentDueBtnText}>Pay Now</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Appointment Details</Text>
          {dt && (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={sw(16)} color="#105641" />
                <Text style={styles.infoText}>{dt.date}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={sw(16)} color="#105641" />
                <Text style={styles.infoText}>{dt.time}</Text>
              </View>
            </>
          )}
          {!!address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={sw(16)} color="#105641" />
              <Text style={styles.infoText}>
                {addressLabel ? `${addressLabel} — ${address}` : address}
              </Text>
            </View>
          )}
        </View>

        {!!partnerName && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Your Beauty Expert</Text>
            <View style={styles.expertRow}>
              {partnerAvatar ? (
                <Image source={{uri: partnerAvatar}} style={styles.expertAvatar} />
              ) : (
                <View style={[styles.expertAvatar, styles.expertAvatarFallback]}>
                  <Text style={styles.expertInitial}>{partnerName[0]}</Text>
                </View>
              )}
              <View style={styles.expertInfo}>
                <Text style={styles.expertName}>{partnerName}</Text>
                {!!partnerRole && <Text style={styles.expertRole}>{partnerRole}</Text>}
                <View style={styles.expertMeta}>
                  {!!partnerRating && (
                    <View style={styles.ratingPill}>
                      <Ionicons name="star" size={sw(11)} color="#F5A623" />
                      <Text style={styles.ratingText}>{partnerRating}</Text>
                    </View>
                  )}
                  {!!partnerExp && <Text style={styles.expertExp}>  •  {partnerExp}</Text>}
                </View>
              </View>
              {!!partnerPhone && (
                <TouchableOpacity
                  style={styles.callBtn}
                  activeOpacity={0.8}
                  onPress={() => Linking.openURL(`tel:${partnerPhone}`)}>
                  <Ionicons name="call" size={sw(20)} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {services.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabel}>
                Services Booked
                {itemCount > 0 ? ` (${itemCount} ${itemCount === 1 ? 'item' : 'items'})` : ''}
              </Text>
              {['pending', 'confirmed'].includes(booking.status?.toLowerCase() ?? '') && (
                <View style={{flexDirection: 'row', gap: sw(8)}}>
                  <TouchableOpacity style={styles.addServiceBtn} activeOpacity={0.8} onPress={openAddPackageModal}>
                    <Ionicons name="gift-outline" size={sw(14)} color="#105641" />
                    <Text style={styles.addServiceBtnText}>Add Package</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addServiceBtn} activeOpacity={0.8} onPress={openAddModal}>
                    <Ionicons name="add-circle-outline" size={sw(14)} color="#105641" />
                    <Text style={styles.addServiceBtnText}>Add Services</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {packageGroups.map((group) => (
              <View key={group.key ?? group.title} style={styles.serviceRowBorder}>
                <View style={[styles.serviceRow, {alignItems: 'flex-start', borderTopWidth: 0}]}>
                  <View style={{flex: 1}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: sw(6), flexWrap: 'wrap'}}>
                      <Text style={styles.serviceName}>{group.title}</Text>
                      <SvcTag type="package" />
                    </View>
                    <Text style={styles.serviceQty}>
                      Qty : {group.qty}
                      {group.qty > 1 && group.unitPrice > 0
                        ? ` × ₹${formatAmount(group.unitPrice)}`
                        : ''}
                    </Text>
                    <View style={{marginTop: sw(4)}}>
                      {group.items.map((s: any, i: number) => (
                        <Text key={s._id ?? s.id ?? i} style={styles.serviceDuration}>{i + 1}. {s.name}</Text>
                      ))}
                    </View>
                  </View>
                  <Text style={styles.servicePrice}>₹{formatAmount(group.price)}</Text>
                </View>
                {['pending', 'confirmed'].includes(booking.status?.toLowerCase() ?? '') && (
                  <TouchableOpacity
                    style={styles.removePkgBtn}
                    activeOpacity={0.8}
                    disabled={actionLoading}
                    onPress={() => handleRemovePackage(group.key, group.title)}>
                    <Text style={styles.removePkgBtnText}>Remove Package</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {services.filter((svc: any) => !svc.addedByPackage).map((svc: any, idx: number) => {
              const isRemoved = !!svc.removed;
              const isFreeOffer = !!svc.addedByOffer;
              const qty = Number(svc.qty) || 1;
              // svc.price is the UNIT price, but the subtotal bills unit × qty — so a
              // qty-3 line showed ₹299 next to a ₹897 subtotal and the column simply
              // didn't add up. Show the line total, with the unit price spelled out
              // beside the qty so the multiplication is visible rather than implied.
              const lineTotal = (Number(svc.price) || 0) * qty;
              const tagType: 'admin' | 'partner' | 'user' | 'removed' | 'free' | null =
                isRemoved ? 'removed' :
                isFreeOffer ? 'free' :
                svc.addedByAdmin ? 'admin' :
                svc.addedByPartner ? 'partner' :
                svc.addedByUser ? 'user' : null;
              return (
                <View key={svc._id ?? svc.id ?? idx} style={[styles.serviceRow, (idx > 0 || packageItems.length > 0) && styles.serviceRowBorder, isRemoved && {opacity: 0.5}]}>
                  <Image
                    source={{uri: svc.image || FALLBACK_IMAGE}}
                    style={styles.serviceThumb}
                    resizeMode="cover"
                  />
                  <View style={{flex: 1}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: sw(6), flexWrap: 'wrap'}}>
                      <Text style={[styles.serviceName, isRemoved && {textDecorationLine: 'line-through', color: '#9CA3AF'}]}>
                        {svc.name}
                      </Text>
                      {tagType && <SvcTag type={tagType} />}
                    </View>
                    {!isFreeOffer && (
                      <Text style={styles.serviceQty}>
                        Qty : {qty}
                        {qty > 1 ? ` × ₹${formatAmount(svc.price)}` : ''}
                      </Text>
                    )}
                    {!!svc.duration && <Text style={styles.serviceDuration}>{svc.duration} min</Text>}
                  </View>
                  {isFreeOffer ? (
                    <Text style={[styles.servicePrice, {color: '#1B6B3A'}]}>FREE</Text>
                  ) : !!svc.price ? (
                    <Text style={[styles.servicePrice, isRemoved && {textDecorationLine: 'line-through', color: '#9CA3AF'}]}>
                      ₹{formatAmount(lineTotal)}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Bill Summary</Text>
          {subtotal > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billKey}>Subtotal</Text>
              <Text style={styles.billVal}>₹{formatAmount(subtotal)}</Text>
            </View>
          )}
          {offerDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billKey}>Offer Discount</Text>
              <Text style={[styles.billVal, styles.billValDiscount]}>
                −₹{formatAmount(offerDiscount)}
              </Text>
            </View>
          )}
          {couponDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billKey}>
                Coupon Discount{booking.couponCode ? ` (${booking.couponCode})` : ''}
              </Text>
              <Text style={[styles.billVal, styles.billValDiscount]}>
                −₹{formatAmount(couponDiscount)}
              </Text>
            </View>
          )}
          {/* Only worth showing once a discount has actually moved the number — with no
              discount this just repeats the subtotal. */}
          {(offerDiscount > 0 || couponDiscount > 0) && (
            <View style={styles.billRow}>
              <Text style={styles.billKey}>Amount after discount</Text>
              <Text style={styles.billVal}>₹{formatAmount(discountedSubtotal)}</Text>
            </View>
          )}
          {taxAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billKey}>{gstLabel}</Text>
              <Text style={styles.billVal}>+₹{formatAmount(taxAmount)}</Text>
            </View>
          )}
          <View style={[styles.billRow, styles.billTotal]}>
            <Text style={styles.billTotalKey}>Total Paid</Text>
            <Text style={styles.billTotalVal}>₹{formatAmount(total)}</Text>
          </View>
          {taxAmount > 0 && formulaAddsUp && (
            <Text style={styles.billFormula}>
              ₹{formatAmount(discountedSubtotal)} + ₹{formatAmount(taxAmount)} {gstLabel} = ₹
              {formatAmount(total)}
            </Text>
          )}
          <View style={styles.billRow}>
            <Text style={styles.billKey}>Payment Method</Text>
            <Text style={styles.billVal}>{paymentModeLabel}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billKey}>Payment Status</Text>
            <Text style={styles.billVal}>{paymentStatusLabel}</Text>
          </View>
        </View>

        <View style={styles.safetyCard}>
          <MaterialIcons name="verified-user" size={sw(20)} color="#105641" />
          <Text style={styles.safetyText}>
            All our experts are trained, verified & background-checked for your safety.
          </Text>
        </View>

        {isCompleted && (
          <TouchableOpacity
            style={styles.reviewBtn}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('ServiceCompleted', {booking})}>
            <Ionicons name="star" size={sw(16)} color="#FFFFFF" />
            <Text style={styles.reviewBtnText}>{booking.review ? 'View My Review' : 'Write a Review'}</Text>
          </TouchableOpacity>
        )}

        {isCancellable && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.rescheduleBtn}
              activeOpacity={0.8}
              onPress={openRescheduleModal}>
              <Text style={styles.rescheduleBtnText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelBtn, actionLoading && {opacity: 0.6}]}
              activeOpacity={0.8}
              disabled={actionLoading}
              onPress={handleCancel}>
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FB1616" />
              ) : (
                <Text style={styles.cancelBtnText}>Cancel Booking</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Services Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Services</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Ionicons name="close" size={sw(22)} color="#171816" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={sw(16)} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search services…"
                placeholderTextColor="#AAA"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Cart summary bar */}
            {svcCart.length > 0 && (
              <View style={styles.cartSummaryBar}>
                <Text style={styles.cartSummaryText}>{svcCart.length} selected</Text>
                <Text style={styles.cartSummaryPrice}>₹{formatAmount(cartTotal)}</Text>
              </View>
            )}

            {loadingSvcs ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color="#105641" size="large" />
              </View>
            ) : (
              <FlatList
                data={filteredSvcs}
                keyExtractor={item => String(item.id)}
                style={{flex: 1}}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.svcListContent}
                renderItem={({item}) => {
                  const cartItem = svcCart.find(c => c.svc.id === item.id);
                  const isSelected = !!cartItem;
                  return (
                    <View style={[styles.svcItem, isSelected && styles.svcItemSelected]}>
                      <TouchableOpacity
                        style={{flex: 1}}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (isSelected) setSvcCart(prev => prev.filter(c => c.svc.id !== item.id));
                          else setSvcCart(prev => [...prev, {svc: item, qty: 1}]);
                        }}>
                        <Text style={[styles.svcItemName, isSelected && styles.svcItemNameSelected]}>{item.name}</Text>
                        <Text style={styles.svcItemMeta}>{item.duration} min  •  ₹{formatAmount(parseFloat(item.basePrice))}</Text>
                      </TouchableOpacity>
                      {isSelected ? (
                        <View style={styles.inlineQty}>
                          <TouchableOpacity onPress={() => setSvcCart(prev => prev.map(c => c.svc.id === item.id ? {...c, qty: Math.max(1, c.qty - 1)} : c))}>
                            <Ionicons name="remove-circle" size={sw(22)} color="#105641" />
                          </TouchableOpacity>
                          <Text style={styles.inlineQtyNum}>{cartItem.qty}</Text>
                          <TouchableOpacity onPress={() => setSvcCart(prev => prev.map(c => c.svc.id === item.id ? {...c, qty: Math.min(c.qty + 1, MAX_SERVICE_QTY)} : c))}>
                            <Ionicons name="add-circle" size={sw(22)} color="#105641" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => setSvcCart(prev => [...prev, {svc: item, qty: 1}])}>
                          <Ionicons name="add-circle-outline" size={sw(22)} color="#CCCCCC" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }}
                ListEmptyComponent={<Text style={styles.emptyText}>No services found</Text>}
              />
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalAddBtn, (!svcCart.length || actionLoading) && styles.modalAddBtnDisabled]}
                disabled={!svcCart.length || actionLoading}
                onPress={handleConfirmAdd}>
                {actionLoading
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.modalAddText}>Add {svcCart.length || ''} Service{svcCart.length !== 1 ? 's' : ''}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Package Modal */}
      <Modal visible={showAddPackageModal} animationType="slide" transparent onRequestClose={() => setShowAddPackageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pickingPackage ? pickingPackage.title : 'Add Package'}</Text>
              <TouchableOpacity onPress={() => setShowAddPackageModal(false)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Ionicons name="close" size={sw(22)} color="#171816" />
              </TouchableOpacity>
            </View>

            {!!addPkgError && <Text style={{color: '#FB1616', fontSize: sw(12), paddingHorizontal: sw(16), paddingTop: sw(10)}}>{addPkgError}</Text>}

            {!pickingPackage ? (
              loadingPkgs ? (
                <View style={styles.loadingWrap}><ActivityIndicator color="#105641" size="large" /></View>
              ) : (
                <FlatList
                  data={addablePackages}
                  keyExtractor={item => String(item.id)}
                  style={{flex: 1}}
                  contentContainerStyle={styles.pkgListContent}
                  renderItem={({item}) => (
                    <View style={styles.pkgCard}>
                      <View style={styles.pkgCardTop}>
                        <Text style={styles.pkgCardTitle} numberOfLines={2}>{item.title}</Text>
                        <View style={[styles.pkgBadge, item.packageType === 'fixed' ? styles.pkgBadgeFixed : styles.pkgBadgeFlexible]}>
                          <Text style={[styles.pkgBadgeText, {color: item.packageType === 'fixed' ? '#105641' : '#1D4ED8'}]}>
                            {item.packageType === 'fixed' ? 'FIXED' : 'FLEXIBLE'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.pkgCardPrice}>₹{formatAmount(parseFloat(item.price))}</Text>
                      <Text style={styles.pkgCardIncludes} numberOfLines={3}>
                        {item.packageType === 'fixed'
                          ? (item.services || []).map((s: any) => s.name).join(', ')
                          : `Pick any ${item.serviceCount} service${item.serviceCount !== 1 ? 's' : ''}${item.categoryId ? ' from this category' : ''}.`}
                      </Text>
                      <TouchableOpacity
                        style={styles.pkgCardBtn}
                        activeOpacity={0.85}
                        disabled={actionLoading}
                        onPress={() => item.packageType === 'fixed' ? handleAddFixedPackage(item) : handlePickFlexible(item)}>
                        <Text style={styles.pkgCardBtnText}>{item.packageType === 'fixed' ? 'Add to Booking' : 'Choose Services →'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      {availablePackages.length === 0 ? 'No packages available' : 'All available packages are already on this booking'}
                    </Text>
                  }
                />
              )
            ) : (
              <>
                <View style={{paddingHorizontal: sw(16), paddingTop: sw(12), paddingBottom: sw(8)}}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: sw(6)}}>
                    <Text style={styles.pkgProgressLabel}>
                      Pick {pickingPackage.serviceCount} service{pickingPackage.serviceCount !== 1 ? 's' : ''}
                    </Text>
                    <Text style={[styles.pkgProgressLabel, {fontWeight: '700', color: flexiblePicks.length === pickingPackage.serviceCount ? '#105641' : '#171816'}]}>
                      {flexiblePicks.length} / {pickingPackage.serviceCount}
                    </Text>
                  </View>
                  <View style={styles.pkgProgressTrack}>
                    <View style={[styles.pkgProgressFill, {width: `${Math.min(100, (flexiblePicks.length / pickingPackage.serviceCount) * 100)}%`}]} />
                  </View>
                </View>
                {loadingSvcs ? (
                  <View style={styles.loadingWrap}><ActivityIndicator color="#105641" size="large" /></View>
                ) : (
                  <FlatList
                    data={availableServices.filter((s: any) => !pickingPackage.categoryId || s.categoryId === pickingPackage.categoryId)}
                    keyExtractor={item => String(item.id)}
                    style={{flex: 1}}
                    contentContainerStyle={styles.svcListContent}
                    renderItem={({item}) => {
                      const picked = flexiblePicks.includes(item.id);
                      return (
                        <TouchableOpacity
                          style={[styles.svcItem, picked && styles.svcItemSelected]}
                          activeOpacity={0.8}
                          onPress={() => toggleFlexiblePick(item.id)}>
                          <View style={{flex: 1}}>
                            <Text style={[styles.svcItemName, picked && styles.svcItemNameSelected]}>{item.name}</Text>
                            <Text style={styles.svcItemMeta}>{item.duration} min  •  ₹{formatAmount(parseFloat(item.basePrice))}</Text>
                          </View>
                          <Ionicons name={picked ? 'checkmark-circle' : 'add-circle-outline'} size={sw(22)} color={picked ? '#105641' : '#CCCCCC'} />
                        </TouchableOpacity>
                      );
                    }}
                    ListEmptyComponent={<Text style={styles.emptyText}>No services found</Text>}
                  />
                )}
                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setPickingPackage(null)}>
                    <Text style={styles.modalCancelText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalAddBtn, (flexiblePicks.length !== pickingPackage.serviceCount || actionLoading) && styles.modalAddBtnDisabled]}
                    disabled={flexiblePicks.length !== pickingPackage.serviceCount || actionLoading}
                    onPress={handleConfirmFlexiblePackage}>
                    {actionLoading
                      ? <ActivityIndicator color="#FFFFFF" size="small" />
                      : <Text style={styles.modalAddText}>Add Package (₹{formatAmount(parseFloat(pickingPackage.price))})</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal visible={showRescheduleModal} animationType="slide" transparent onRequestClose={() => setShowRescheduleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, {maxHeight: undefined, flex: undefined}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Booking</Text>
              <TouchableOpacity onPress={() => setShowRescheduleModal(false)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Ionicons name="close" size={sw(22)} color="#171816" />
              </TouchableOpacity>
            </View>

            <View style={{paddingHorizontal: sw(16), paddingTop: sw(14), paddingBottom: sw(8), gap: sw(10)}}>
              <Text style={styles.reschedLabel}>New Date & Time</Text>
              <TouchableOpacity
                style={[styles.reschedDateBox, !!rescheduleError && styles.reschedDateBoxError]}
                activeOpacity={0.7}
                onPress={() => setShowReschedDatePicker(true)}>
                <Ionicons name="calendar-outline" size={sw(16)} color="#105641" />
                <Text style={styles.reschedDateText}>
                  {rescheduleDate.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}
                  {'  |  '}
                  {rescheduleDate.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: true})}
                </Text>
              </TouchableOpacity>
              {!!rescheduleError && <Text style={styles.reschedErrorText}>{rescheduleError}</Text>}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowRescheduleModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalAddBtn, (!!rescheduleError || actionLoading) && styles.modalAddBtnDisabled]}
                disabled={!!rescheduleError || actionLoading}
                onPress={handleConfirmReschedule}>
                {actionLoading
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.modalAddText}>Confirm Reschedule</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DatePicker
        modal
        open={showReschedDatePicker}
        date={rescheduleDate}
        mode="date"
        minimumDate={new Date()}
        title="Select Date"
        confirmText="Next"
        cancelText="Cancel"
        onConfirm={date => {
          const merged = new Date(rescheduleDate);
          merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
          setRescheduleDate(merged);
          setRescheduleError(validateRescheduleDate(merged));
          setShowReschedDatePicker(false);
          setShowReschedTimePicker(true);
        }}
        onCancel={() => setShowReschedDatePicker(false)}
      />
      <DatePicker
        modal
        open={showReschedTimePicker}
        date={rescheduleDate}
        mode="time"
        title="Select Time"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={time => {
          const merged = new Date(rescheduleDate);
          merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
          setRescheduleDate(merged);
          setRescheduleError(validateRescheduleDate(merged));
          setShowReschedTimePicker(false);
        }}
        onCancel={() => setShowReschedTimePicker(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F5F5'},

  header: {
    backgroundColor: '#012823',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingBottom: sw(14),
  },
  headerTitle: {fontFamily: fonts.title, fontSize: sw(17), color: '#FFFFFF', fontWeight: '700'},

  scroll: {padding: sw(16), gap: sw(12)},

  confirmedBanner: {
    backgroundColor: '#105641',
    borderRadius: sw(12),
    padding: sw(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(12),
  },
  confirmedIconWrap: {
    width: sw(48),
    height: sw(48),
    borderRadius: sw(24),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmedTitle: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '700', color: '#FFFFFF'},
  statusTitleRow: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: sw(8)},
  rescheduledChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(3),
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: sw(10),
    paddingHorizontal: sw(7),
    paddingVertical: sw(2),
  },
  rescheduledChipText: {
    fontFamily: fonts.textFont,
    fontSize: sw(10),
    color: '#FFFFFF',
    lineHeight: sw(14),
  },
  rescheduledNote: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: 'rgba(255,255,255,0.85)',
    marginTop: sw(2),
  },
  confirmedCode: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.75)', marginTop: sw(2)},

  paymentDueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(12),
    backgroundColor: '#FFFBF0',
    borderRadius: sw(12),
    borderWidth: 1.5,
    borderColor: '#F5C842',
    padding: sw(14),
  },
  paymentDueTitle: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#C87B1A'},
  paymentDueSub: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#6B4C0A', marginTop: sw(2)},
  paymentDueBtn: {
    backgroundColor: '#105641',
    borderRadius: sw(8),
    paddingHorizontal: sw(16),
    paddingVertical: sw(10),
  },
  paymentDueBtnText: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#FFFFFF'},

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(16),
    gap: sw(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardLabel: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#171816', marginBottom: sw(2)},

  infoRow: {flexDirection: 'row', alignItems: 'flex-start', gap: sw(10)},
  infoText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#444', flex: 1, lineHeight: sw(19)},

  expertRow: {flexDirection: 'row', alignItems: 'center', gap: sw(12)},
  expertAvatar: {width: sw(60), height: sw(60), borderRadius: sw(30), backgroundColor: '#EEEDED'},
  expertAvatarFallback: {backgroundColor: '#105641', alignItems: 'center', justifyContent: 'center'},
  expertInitial: {fontFamily: fonts.title, fontSize: sw(22), color: '#FFFFFF', fontWeight: '700'},
  expertInfo: {flex: 1, gap: sw(2)},
  expertName: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700', color: '#171816'},
  expertRole: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#656565'},
  expertMeta: {flexDirection: 'row', alignItems: 'center'},
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: sw(4),
    paddingHorizontal: sw(6),
    paddingVertical: sw(2),
    gap: sw(3),
  },
  ratingText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '600'},
  expertExp: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#656565'},
  callBtn: {
    width: sw(44),
    height: sw(44),
    borderRadius: sw(22),
    backgroundColor: '#105641',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardHeaderRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: sw(8)},
  addServiceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: sw(3),
    borderWidth: 1, borderColor: '#105641', borderRadius: sw(16),
    paddingHorizontal: sw(8), paddingVertical: sw(4),
  },
  addServiceBtnText: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#105641', fontWeight: '600'},

  serviceRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: sw(8), gap: sw(10)},
  serviceRowBorder: {borderTopWidth: 1, borderTopColor: '#F0F0F0'},
  serviceThumb: {width: sw(44), height: sw(44), borderRadius: sw(8), backgroundColor: '#EEEDED'},
  serviceName: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '500'},
  serviceDuration: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#656565', marginTop: sw(2)},
  serviceQty: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#105641',
    fontWeight: '600',
    marginTop: sw(3),
  },
  servicePrice: {fontFamily: fonts.title, fontSize: sw(14), color: '#105641', fontWeight: '700'},
  removePkgBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEE2E2',
    borderRadius: sw(20),
    paddingHorizontal: sw(12),
    paddingVertical: sw(6),
    marginBottom: sw(8),
  },
  removePkgBtnText: {fontFamily: fonts.title, fontSize: sw(11), fontWeight: '700', color: '#B91C1C', textTransform: 'uppercase'},

  modalOverlay: {flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'flex-end'},
  modalSheet: {backgroundColor:'#FFFFFF', borderTopLeftRadius:sw(20), borderTopRightRadius:sw(20), maxHeight:'85%', flex:1, paddingBottom:sw(16)},
  modalHeader: {flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:sw(16), paddingVertical:sw(14), borderBottomWidth:1, borderBottomColor:'#EEEDED'},
  modalTitle: {fontFamily:fonts.title, fontSize:sw(16), fontWeight:'700', color:'#171816'},
  searchWrap: {flexDirection:'row', alignItems:'center', gap:sw(8), marginHorizontal:sw(16), marginVertical:sw(10), backgroundColor:'#F5F5F5', borderRadius:sw(10), paddingHorizontal:sw(12), height:sw(40)},
  searchInput: {flex:1, fontFamily:fonts.textFont, fontSize:sw(13), color:'#171816', padding:0},

  cartSummaryBar: {flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginHorizontal:sw(16), marginBottom:sw(6), backgroundColor:'rgba(16,86,65,0.07)', borderRadius:sw(8), paddingHorizontal:sw(12), paddingVertical:sw(7)},
  cartSummaryText: {fontFamily:fonts.textFont, fontSize:sw(12), color:'#105641', fontWeight:'600'},
  cartSummaryPrice: {fontFamily:fonts.title, fontSize:sw(13), fontWeight:'700', color:'#105641'},

  loadingWrap: {flex:1, alignItems:'center', justifyContent:'center', paddingVertical:sw(40)},
  svcListContent: {paddingHorizontal:sw(16), paddingTop:sw(4), paddingBottom:sw(8), gap:sw(8)},
  svcItem: {flexDirection:'row', alignItems:'center', backgroundColor:'#F9F9F9', borderRadius:sw(10), padding:sw(12), borderWidth:1.5, borderColor:'transparent', gap:sw(10)},
  svcItemSelected: {borderColor:'#105641', backgroundColor:'rgba(16,86,65,0.05)'},
  svcItemName: {fontFamily:fonts.textFont, fontSize:sw(13), color:'#171816', fontWeight:'500', marginBottom:sw(2)},
  svcItemNameSelected: {color:'#105641', fontWeight:'700'},
  svcItemMeta: {fontFamily:fonts.textFont, fontSize:sw(13), color:'#5C5C5C'},
  inlineQty: {flexDirection:'row', alignItems:'center', gap:sw(6)},
  inlineQtyNum: {fontFamily:fonts.title, fontSize:sw(14), fontWeight:'700', color:'#105641', minWidth:sw(20), textAlign:'center'},
  emptyText: {fontFamily:fonts.textFont, fontSize:sw(13), color:'#888', textAlign:'center', paddingVertical:sw(32)},

  pkgListContent: {paddingHorizontal:sw(16), paddingTop:sw(8), paddingBottom:sw(16), gap:sw(12)},
  pkgCard: {backgroundColor:'#FFFFFF', borderRadius:sw(14), padding:sw(16), borderWidth:1.5, borderColor:'#EEEDED', gap:sw(8)},
  pkgCardTop: {flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', gap:sw(8)},
  pkgCardTitle: {flex:1, fontFamily:fonts.title, fontSize:sw(15), fontWeight:'700', color:'#171816'},
  pkgBadge: {borderRadius:sw(20), paddingHorizontal:sw(9), paddingVertical:sw(3)},
  pkgBadgeFixed: {backgroundColor:'#E6F4EC'},
  pkgBadgeFlexible: {backgroundColor:'#DBEAFE'},
  pkgBadgeText: {fontFamily:fonts.title, fontSize:sw(10), fontWeight:'800', letterSpacing:0.4},
  pkgCardPrice: {fontFamily:fonts.title, fontSize:sw(22), fontWeight:'800', color:'#105641'},
  pkgCardIncludes: {fontFamily:fonts.textFont, fontSize:sw(12), color:'#656565', lineHeight:sw(18)},
  pkgCardBtn: {backgroundColor:'#105641', borderRadius:sw(10), paddingVertical:sw(10), alignItems:'center', marginTop:sw(4)},
  pkgCardBtnText: {fontFamily:fonts.title, fontSize:sw(13), fontWeight:'700', color:'#FFFFFF'},
  pkgProgressLabel: {fontFamily:fonts.textFont, fontSize:sw(12.5), color:'#5C5C5C'},
  pkgProgressTrack: {height:sw(6), borderRadius:sw(3), backgroundColor:'#EEEDED', overflow:'hidden'},
  pkgProgressFill: {height:'100%', backgroundColor:'#105641', borderRadius:sw(3)},
  modalFooter: {flexDirection:'row', gap:sw(10), paddingHorizontal:sw(16), paddingTop:sw(12), borderTopWidth:1, borderTopColor:'#EEEDED'},
  modalCancelBtn: {flex:1, height:sw(46), borderRadius:sw(10), borderWidth:1.5, borderColor:'#EEEDED', alignItems:'center', justifyContent:'center'},
  modalCancelText: {fontFamily:fonts.textFont, fontSize:sw(13), fontWeight:'600', color:'#5C5C5C'},
  modalAddBtn: {flex:2, height:sw(46), borderRadius:sw(10), backgroundColor:'#105641', alignItems:'center', justifyContent:'center'},
  modalAddBtnDisabled: {backgroundColor:'#AAAAAA'},
  modalAddText: {fontFamily:fonts.title, fontSize:sw(14), fontWeight:'700', color:'#FFFFFF'},

  billRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  billKey: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#656565'},
  billVal: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816'},
  billValDiscount: {color: '#105641'},
  billFormula: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#8A8A8A',
    textAlign: 'right',
    marginTop: sw(2),
  },
  billTotal: {borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: sw(10), marginTop: sw(4)},
  billTotalKey: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#171816'},
  billTotalVal: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '700', color: '#105641'},

  safetyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sw(10),
    backgroundColor: '#EAF5F0',
    borderRadius: sw(10),
    padding: sw(14),
  },
  safetyText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#105641', flex: 1, lineHeight: sw(18)},

  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(8),
    height: sw(48),
    borderRadius: sw(10),
    backgroundColor: '#105641',
    marginTop: sw(4),
  },
  reviewBtnText: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#FFFFFF'},
  actionRow: {flexDirection: 'row', gap: sw(12), marginTop: sw(4)},
  rescheduleBtn: {
    flex: 1,
    height: sw(46),
    borderRadius: sw(10),
    borderWidth: 1.5,
    borderColor: '#105641',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescheduleBtnText: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '600', color: '#105641'},
  reschedLabel: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '600', color: '#656565'},
  reschedDateBox: {
    flexDirection: 'row', alignItems: 'center', gap: sw(10),
    backgroundColor: '#F5F5F5', borderRadius: sw(10), borderWidth: 1.5, borderColor: 'transparent',
    paddingHorizontal: sw(14), height: sw(50),
  },
  reschedDateBoxError: {borderColor: '#FB1616'},
  reschedDateText: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#171816'},
  reschedErrorText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#FB1616'},
  cancelBtn: {
    flex: 1,
    height: sw(46),
    borderRadius: sw(10),
    borderWidth: 1.5,
    borderColor: '#FB1616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '600', color: '#FB1616'},
});

export default BookingDetailScreen;
