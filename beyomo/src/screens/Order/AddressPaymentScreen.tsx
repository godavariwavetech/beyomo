import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DatePicker from 'react-native-date-picker';
import {useSelector, useDispatch} from 'react-redux';
import {fonts} from '../../config/theme';
import api from '../../utils/api';
import {endpoints} from '../../config/config';
import {fetchProfile} from '../../redux/reducers/user';
import {
  incrementItemQty, decrementItemQty, removeItemFromCart,
  addServicesToCart, incrementServiceQty, decrementServiceQty, removeServiceFromCart, removeFreeService,
  clearCart,
} from '../../redux/reducers/cart';
import {payWithRazorpay, openQuoteCheckout} from '../../utils/payments';
import type {RootState} from '../../redux/store';
import {formatAmount} from '../../utils/utils';
import {isCityServiceable} from '../../utils/geoUtils';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

type ServiceItem = {
  id: string | number;
  name: string;
  duration?: string | number;
  price: number;
  image?: string;
  qty: number;
};

type SavedAddress = {
  _id?: string;
  id?: string;
  tag?: string;
  label?: string;
  line1?: string;
  address?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
  lat?: number | null;
  lng?: number | null;
};

// Service hours are 8 AM - 8 PM, matching the website's checkout.
const BOOKING_WINDOW_START_HOUR = 8;
const BOOKING_WINDOW_END_HOUR = 20;

const getDefaultDate = () => {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  d.setSeconds(0, 0);
  // If the advance-time buffer pushes past closing, the earliest real slot is
  // next day's opening instead of a same-day time outside business hours.
  if (d.getHours() >= BOOKING_WINDOW_END_HOUR) {
    d.setDate(d.getDate() + 1);
    d.setHours(BOOKING_WINDOW_START_HOUR, 0, 0, 0);
  }
  return d;
};

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
// Lowered from 500 → 1 for pay-first flow testing. Bump back before release.
const MIN_BOOKING_AMOUNT = 500;
const MAX_SERVICE_QTY = 5;
const formatDate = (d: Date) =>
  d.toLocaleDateString('en-IN', {month: 'short', day: 'numeric', year: 'numeric'});
const formatTime = (d: Date) =>
  d.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: true}).toUpperCase();

const addrLabel = (a: SavedAddress) => a.tag ?? a.label ?? 'Address';
const addrLine = (a: SavedAddress) => a.line1 ?? a.address ?? '';

interface Props {
  navigation?: any;
  route?: any;
}

const AddressPaymentScreen = ({navigation, route}: Props) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const {profile, error: profileError} = useSelector((state: RootState) => state.User as any);
  const selectedCity = useSelector((state: RootState) => (state as any).City?.selectedCity);
  // Appended to service requests so the picker only offers services available in
  // the user's city (the backend applies each service's city mapping off this).
  const cityParam = selectedCity?.id ? `&cityId=${selectedCity.id}` : '';
  const addresses: SavedAddress[] = profile?.addresses ?? [];

  const isLocationAvailable = (city?: string | null) =>
    isCityServiceable(city, selectedCity);
  const selectableAddresses = addresses.filter(a => isLocationAvailable(a.city));

  const [selectedAddr, setSelectedAddr] = useState<SavedAddress | null>(null);
  const [showAddrModal, setShowAddrModal] = useState(false);

  const dedupeServices = (raw: any[]): ServiceItem[] => {
    const map = new Map<string, ServiceItem>();
    for (const s of raw) {
      const key = String(s.id);
      if (map.has(key)) {
        map.get(key)!.qty += 1;
      } else {
        map.set(key, {...s, qty: 1});
      }
    }
    return Array.from(map.values());
  };

  const [services, setServices] = useState<ServiceItem[]>(() => dedupeServices(route?.params?.services ?? []));

  const [description, setDescription] = useState('');
  const [billExpanded, setBillExpanded] = useState(true);
  const [booking, setBooking] = useState(false);
  const [dateError, setDateError] = useState('');
  const ONLINE_PAYMENTS_ENABLED = true;
  const [paymentMode, setPaymentMode] = useState<'online' | 'cod'>(ONLINE_PAYMENTS_ENABLED ? 'online' : 'cod');
  const [selectedDate, setSelectedDate] = useState<Date>(getDefaultDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Add More Services modal — lets the customer book extra individual services
  // alongside a package/combo (or any booking), billed additively on top.
  const [showAddSvcModal, setShowAddSvcModal] = useState(false);
  const [allServicesForAdd, setAllServicesForAdd] = useState<any[]>([]);
  const [loadingAddSvcs, setLoadingAddSvcs] = useState(false);
  const [addSvcSearch, setAddSvcSearch] = useState('');
  const [addSvcCart, setAddSvcCart] = useState<{svc: any; qty: number}[]>([]);

  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description?: string;
  } | null>(null);

  const routeOfferId: number | null = route?.params?.offerId ?? null;
  const routePackageId: number | null = route?.params?.packageId ?? null;
  const routePackagePrice: number | null = route?.params?.packagePrice ?? null; // per-unit package price
  const routePackageTitle: string | null = route?.params?.packageTitle ?? null;

  // Cart mode: arrived via the package cart (Packages tab "Add to Cart" -> "View Cart"),
  // which can hold several distinct packages at once, each keeping its own price/discount.
  // Legacy mode: arrived with an explicit `services` param (ServiceListingScreen's own
  // in-screen selection, or the old single-package direct-navigate flow) — unchanged.
  const isCartMode = !route?.params?.services;
  const cartItems: any[] = useSelector((state: RootState) => (state as any).Cart?.items ?? []);
  // Plain individual services (no package) in the shared cart — combines with cartItems
  // above so one booking can mix services + packages + combos, same as legacy mode's
  // local `services` state did for a single package's extras.
  const cartServices: ServiceItem[] = useSelector((state: RootState) => (state as any).Cart?.services ?? []);
  const isCartEmpty = isCartMode && cartItems.length === 0 && cartServices.length === 0;

  const [eligibleOffer, setEligibleOffer] = useState<{
    offerId: number;
    title: string;
    freeService: {id: string | number; name: string; image?: string; duration?: number; price: 0};
  } | null>(null);
  // If the cart arrived with a free item already in it (e.g. from the offer's service
  // listing screen), track it as "applied" so the eligibility re-check below — and the
  // pre-submit safety check — actually manage it instead of ignoring it. Actual value is
  // set by the route.params-sync effect below (covers both initial mount and re-navigation).
  const [appliedOffer, setAppliedOffer] = useState<{
    offerId: number;
    title: string;
    freeService: {id: string | number; name: string; image?: string; duration?: number; price: 0};
  } | null>(null);

  useEffect(() => {
    if (!profile) dispatch(fetchProfile());
  }, []);

  // Re-sync from route.params whenever this screen is navigated to again with a
  // different booking. A native-stack navigate() to a screen already in the stack
  // reuses the existing instance and just updates route.params — it does NOT
  // remount — so the useState lazy initializers above only ever apply once, to
  // the very first package/services this screen was opened with. Without this,
  // going back and booking a different package leaves the old package's services
  // (and quantities, and any applied free-item offer) showing under the new
  // package's banner.
  useEffect(() => {
    const raw: any[] = route?.params?.services ?? [];
    setServices(dedupeServices(raw));
    const freeItem = raw.find((s: any) => s.isFree);
    setAppliedOffer(
      freeItem && routeOfferId
        ? {
            offerId: routeOfferId,
            title: '',
            freeService: {id: freeItem.id, name: freeItem.name, image: freeItem.image, duration: freeItem.duration, price: 0},
          }
        : null,
    );
    setEligibleOffer(null);
    setAddSvcCart([]);
  }, [route?.params?.services]);

  // Auto-select default address once profile loads — only from addresses within the
  // selected city, so an out-of-city default never gets silently picked.
  useEffect(() => {
    if (selectableAddresses.length > 0 && !selectedAddr) {
      const def = selectableAddresses.find(a => a.isDefault) ?? selectableAddresses[0];
      setSelectedAddr(def);
    }
  }, [addresses, selectedCity]);

  // If the app-wide selected city changes to somewhere the current address doesn't
  // belong, drop it rather than silently letting an out-of-city booking through.
  useEffect(() => {
    if (selectedAddr && !isLocationAvailable(selectedAddr.city)) {
      setSelectedAddr(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity]);

  // Package-tagged items keep the package's own fixed price; anything else (a regular
  // booking's items, or extra services added on top of a package) bills at its own price.
  // In cart mode, packages live in Redux (cartItems) and plain services live in Redux
  // (cartServices) — local `services` state is only used by the (now-unused) legacy path.
  const packageItems = isCartMode ? [] : services.filter((s: any) => s.isPackageItem);
  const extraItems = isCartMode ? cartServices.filter((s: any) => !s.isFree) : services.filter((s: any) => !s.isPackageItem && !s.isFree);
  // All package-tagged items scale together as one unit — the package's own qty stepper
  // (in the banner below) bumps every one of them in lockstep, mirroring how the website's
  // cart lets you adjust a package's quantity directly at checkout.
  const currentPackageQty = packageItems[0]?.qty ?? 1;
  const packageItemsIndividualSum = packageItems.reduce((sum, s) => sum + (parseFloat(String(s.price)) || 0) * s.qty, 0);
  const extraItemsSubtotal = extraItems.reduce((sum, s) => sum + (parseFloat(String(s.price)) || 0) * s.qty, 0);
  const servicesSubtotal = services.reduce((sum, s) => sum + (parseFloat(String(s.price)) || 0) * s.qty, 0);

  const cartPackageTotal = cartItems.reduce((sum, item) => sum + item.packagePrice * item.qty, 0);
  const cartOriginalTotal = cartItems.reduce(
    (sum, item) => sum + (item.packageOriginalPrice ?? item.packagePrice) * item.qty, 0,
  );

  // When booking via a package, use the package price × qty (plus any extras) as the base instead of the raw service sum
  const subtotal = isCartMode
    ? cartPackageTotal + extraItemsSubtotal
    : routePackagePrice != null
      ? routePackagePrice * currentPackageQty + extraItemsSubtotal
      : servicesSubtotal;
  const packageSavings = isCartMode
    ? Math.max(0, cartOriginalTotal - cartPackageTotal)
    : routePackagePrice != null
      ? Math.max(0, packageItemsIndividualSum - routePackagePrice * currentPackageQty)
      : 0;
  // What actually renders in the "Service items" list below: cart-mode shows only
  // local extras — each cart package's own banner (above) already carries its name and
  // service count, so its included services don't also need their own card each.
  const displayServiceRows = isCartMode
    ? cartServices.map(s => ({...s, rowKey: String((s as any).isFree ? `free-${s.id}` : s.id)}))
    : services.map(s => ({...s, rowKey: String((s as any).isFree ? `free-${s.id}` : s.id)}));

  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const taxableAmount = Math.max(0, subtotal - couponDiscount);
  const tax = Math.round(taxableAmount * 0.05); // GST — backend recomputes the authoritative weighted rate on submit
  const total = taxableAmount + tax;

  const increment = (id: string | number) => {
    if (isCartMode) dispatch(incrementServiceQty(String(id)));
    else setServices(prev => prev.map(s => s.id === id ? {...s, qty: Math.min(s.qty + 1, MAX_SERVICE_QTY)} : s));
  };

  const decrement = (id: string | number) => {
    if (isCartMode) dispatch(decrementServiceQty(String(id)));
    else setServices(prev =>
      prev.map(s => s.id === id ? {...s, qty: s.qty - 1} : s).filter(s => s.qty > 0),
    );
  };

  const incrementPackageQty = () =>
    setServices(prev => prev.map(s => (s as any).isPackageItem ? {...s, qty: Math.min(s.qty + 1, MAX_SERVICE_QTY)} : s));

  const decrementPackageQty = () =>
    setServices(prev => prev.map(s => (s as any).isPackageItem && s.qty > 1 ? {...s, qty: s.qty - 1} : s));

  // Cart-mode equivalents — each package in the cart has its own independent qty.
  const incrementCartItem = (key: string) => dispatch(incrementItemQty(key));
  const decrementCartItem = (key: string) => dispatch(decrementItemQty(key));
  const removeCartItem = (key: string) => dispatch(removeItemFromCart(key));

  // "Add More Services" sends the customer to the Home screen, so they can add
  // services, combos OR packages using the screens that already exist — the sheet
  // below could only ever offer plain individual services.
  //
  // Home is the first tab of the `Main` navigator, which sits *below* this screen in
  // the stack, so navigating to it pops back rather than pushing a second copy. That
  // costs nothing here: the cart is Redux state, not this screen's, so every package,
  // combo and service already chosen survives the trip untouched. The customer comes
  // back the same way they got here in the first place — the CartBar's "View Cart" on
  // Home, or the cart tab — both of which re-open this screen off the same cart.
  const handleAddMoreServices = () => {
    navigation?.navigate('Main', {screen: 'Home'});
  };

  const openAddSvcModal = () => {
    setAddSvcCart([]);
    setAddSvcSearch('');
    if (allServicesForAdd.length === 0) {
      setLoadingAddSvcs(true);
      api.get(`${endpoints.SERVICES}?limit=500${cityParam}`)
        .then(res => { if (res.data?.status) setAllServicesForAdd(res.data.data ?? []); })
        .catch(() => {})
        .finally(() => setLoadingAddSvcs(false));
    }
    setShowAddSvcModal(true);
  };

  const filteredAddSvcs = allServicesForAdd.filter(s =>
    !addSvcSearch || s.name?.toLowerCase().includes(addSvcSearch.toLowerCase()));
  const addSvcCartTotal = addSvcCart.reduce((sum, item) => sum + (parseFloat(item.svc.basePrice) || 0) * item.qty, 0);

  const handleConfirmAddServices = () => {
    if (!addSvcCart.length) return;
    const newEntries = addSvcCart.map(item => ({
      id: item.svc.id,
      name: item.svc.name,
      price: parseFloat(item.svc.basePrice) || 0,
      duration: item.svc.duration ? `${item.svc.duration} min` : undefined,
      image: item.svc.image,
      qty: item.qty,
    }));
    if (isCartMode) {
      dispatch(addServicesToCart(newEntries));
    } else {
      setServices(prev => {
        const merged = [...prev];
        newEntries.forEach(entry => {
          const idx = merged.findIndex((s: any) =>
            String(s.id) === String(entry.id) && !s.isPackageItem && !s.isFree);
          if (idx >= 0) merged[idx] = {...merged[idx], qty: merged[idx].qty + entry.qty};
          else merged.push(entry);
        });
        return merged;
      });
    }
    setAddSvcCart([]);
    setShowAddSvcModal(false);
  };

  const validateDate = (date: Date): string => {
    const now = Date.now();
    if (date.getTime() < now + ONE_HOUR_MS) return 'Booking must be at least 1 hour from now.';
    if (date.getTime() > now + ONE_MONTH_MS) return 'Booking cannot be more than 1 month in advance.';
    const hour = date.getHours();
    if (hour >= BOOKING_WINDOW_END_HOUR) return 'The service is not available after 8 PM. Please choose a slot before 8 PM.';
    if (hour < BOOKING_WINDOW_START_HOUR) return 'The service is not available before 8 AM. Please choose a slot after 8 AM.';
    return '';
  };

  const handleDateChange = (date: Date) => {
    setDateError(validateDate(date));
    setSelectedDate(date);
  };

  // Check offer eligibility whenever the cart's plain services change (exclude
  // already-free services). Cart mode reads/writes the free item via Redux; legacy
  // mode keeps using local `services` state.
  const effectiveServices = isCartMode ? cartServices : services;
  const clearFreeItem = () => {
    if (isCartMode) dispatch(removeFreeService());
    else setServices(prev => prev.some((s: any) => s.isFree) ? prev.filter((s: any) => !s.isFree) : prev);
  };

  useEffect(() => {
    const paidServices = effectiveServices.filter((s: any) => !s.isFree);
    if (paidServices.length === 0) {
      // No paid services left — remove free service and clear both offer states
      setEligibleOffer(null);
      setAppliedOffer(null);
      clearFreeItem();
      return;
    }
    const serviceIds = paidServices.map(s => Number(s.id));
    const total = paidServices.reduce((sum, s) => sum + (parseFloat(String(s.price)) || 0) * s.qty, 0);
    api.post(endpoints.OFFERS_CHECK, {serviceIds, totalAmount: total})
      .then(res => {
        const eligible: any[] = res.data?.data ?? [];
        if (!appliedOffer) {
          const preferred = routeOfferId
            ? eligible.find(o => o.offerId === routeOfferId) ?? eligible[0]
            : eligible[0];
          setEligibleOffer(preferred ?? null);
        } else if (!eligible.some(o => o.offerId === appliedOffer.offerId)) {
          // The specific offer that's already applied no longer qualifies (e.g. a required
          // item was removed) — even if the cart happens to qualify for a different offer now.
          setEligibleOffer(null);
          setAppliedOffer(null);
          clearFreeItem();
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveServices]);

  const addFreeService = () => {
    if (!eligibleOffer) return;
    const fs = eligibleOffer.freeService;
    const freeEntry = {...fs, qty: 1, isFree: true, duration: fs.duration ? `${fs.duration} min` : undefined};
    if (isCartMode) {
      dispatch(removeFreeService());
      dispatch(addServicesToCart([freeEntry]));
    } else {
      setServices(prev => [...prev.filter((s: any) => !s.isFree), freeEntry]);
    }
    setAppliedOffer(eligibleOffer);
    setEligibleOffer(null);
  };

  const removeOffer = () => {
    clearFreeItem();
    setAppliedOffer(null);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const handleBooking = async () => {
    if (isCartMode ? cartItems.length === 0 && cartServices.length === 0 : services.length === 0) {
      Alert.alert('No services', 'Please add at least one service.');
      return;
    }
    if (subtotal < MIN_BOOKING_AMOUNT) {
      Alert.alert(
        'Minimum Booking Amount',
        `Please add services worth at least ₹${formatAmount(MIN_BOOKING_AMOUNT)} to continue. You're ₹${formatAmount(MIN_BOOKING_AMOUNT - subtotal)} away.`,
      );
      return;
    }
    if (!selectedAddr) {
      Alert.alert('Address Required', 'Please select a delivery address.');
      return;
    }
    if (!isLocationAvailable(selectedAddr.city)) {
      Alert.alert(
        'Outside serviceable area',
        `This address is outside ${selectedCity?.name ?? 'your serviceable area'}. Please choose or add an address in that location.`,
      );
      return;
    }
    const err = validateDate(selectedDate);
    if (err) {
      setDateError(err);
      Alert.alert('Invalid Date/Time', err);
      return;
    }
    setBooking(true);
    try {
      // Defensive re-check: the background eligibility check (above) is debounced by a
      // network round-trip, so it can lag behind a just-removed item if the user taps
      // Confirm Booking quickly. Re-validate right before submitting so we never send an
      // offerId / free item that no longer qualifies (the backend would reject it anyway,
      // but this avoids a confusing "Booking failed" and silently fixes the cart instead).
      let offerIdToSubmit = appliedOffer?.offerId;
      let servicesToSubmit = effectiveServices.filter((s: any) => !s.isFree);
      if (appliedOffer) {
        const serviceIds = servicesToSubmit.map(s => Number(s.id));
        const total = servicesToSubmit.reduce((sum, s) => sum + (parseFloat(String(s.price)) || 0) * s.qty, 0);
        try {
          const checkRes = await api.post(endpoints.OFFERS_CHECK, {serviceIds, totalAmount: total});
          const eligible: any[] = checkRes.data?.data ?? [];
          if (!eligible.some(o => o.offerId === appliedOffer.offerId)) {
            offerIdToSubmit = undefined;
            setAppliedOffer(null);
            setEligibleOffer(null);
            clearFreeItem();
            Alert.alert('Offer Removed', 'The free item no longer qualifies because a required service was removed.');
            setBooking(false);
            return;
          }
        } catch {
          // If the re-check itself fails, fall through and let the backend be the final word.
        }
      }

      // Package-tagged items are what the package's fixed price covers; anything else
      // (extras added on top, or the whole cart for a non-package booking) is billed
      // additively as `extraServices` so the backend never folds it into the package price.
      const packageItemsToSubmit = routePackageId
        ? servicesToSubmit.filter((s: any) => s.isPackageItem)
        : servicesToSubmit;
      const extraServicesToSubmit = routePackageId
        ? servicesToSubmit.filter((s: any) => !s.isPackageItem)
        : [];

      // Cart mode: each cart package becomes its own entry in `packages`, keeping its own
      // price/discount/revenue-split intact (see backend resolveRatesForMultiPackageBooking)
      // instead of collapsing into a single packageId. Local `services` state in cart mode
      // is extras-only (from "Add More Services"), submitted the same way as legacy mode.
      const cartPackagesPayload = cartItems.map(item => ({
        packageId: item.packageId,
        qty: item.qty,
        services: item.services.map((s: any) => ({id: String(s.id), qty: item.qty})),
      }));

      // Build the booking payload once — reused for both quote-order and the
      // eventual /bookings POST.
      const bookingPayload = isCartMode
        ? {
            // Backend requires `services` (not `extraServices`) whenever there's no
            // package in the booking — only send `packages`/`extraServices` when the
            // cart actually has a package, same as the website's Checkout.
            ...(cartPackagesPayload.length > 0
              ? {
                  packages: cartPackagesPayload,
                  extraServices: servicesToSubmit.length
                    ? servicesToSubmit.map(s => ({id: String(s.id), qty: s.qty}))
                    : undefined,
                }
              : {
                  services: servicesToSubmit.map(s => ({id: String(s.id), qty: s.qty})),
                }),
            address: {
              label: addrLabel(selectedAddr),
              line1: addrLine(selectedAddr),
              line2: selectedAddr.line2 ?? '',
              city: selectedAddr.city ?? '',
              state: selectedAddr.state ?? '',
              pincode: selectedAddr.pincode ?? '',
              lat: selectedAddr.lat ?? null,
              lng: selectedAddr.lng ?? null,
            },
            scheduledAt: selectedDate.toISOString(),
            // The city the customer is browsing in. The backend cross-checks it against
            // the address so a booking can't be filed under a city the customer isn't in.
            cityId: selectedCity?.id ?? undefined,
            notes: description || undefined,
            couponCode: appliedCoupon?.code || undefined,
            offerId: offerIdToSubmit || undefined,
            paymentMode,
          }
        : {
            services: packageItemsToSubmit.map(s => ({id: String(s.id), qty: s.qty})),
            extraServices: extraServicesToSubmit.length
              ? extraServicesToSubmit.map(s => ({id: String(s.id), qty: s.qty}))
              : undefined,
            address: {
              label: addrLabel(selectedAddr),
              line1: addrLine(selectedAddr),
              line2: selectedAddr.line2 ?? '',
              city: selectedAddr.city ?? '',
              state: selectedAddr.state ?? '',
              pincode: selectedAddr.pincode ?? '',
              lat: selectedAddr.lat ?? null,
              lng: selectedAddr.lng ?? null,
            },
            scheduledAt: selectedDate.toISOString(),
            // The city the customer is browsing in. The backend cross-checks it against
            // the address so a booking can't be filed under a city the customer isn't in.
            cityId: selectedCity?.id ?? undefined,
            notes: description || undefined,
            couponCode: appliedCoupon?.code || undefined,
            offerId: offerIdToSubmit || undefined,
            packageId: routePackageId || undefined,
            packageQty: routePackageId ? currentPackageQty : undefined,
            paymentMode,
          };

      let bk: any = null;

      if (paymentMode === 'online') {
        // Pay-first flow: create a Razorpay order tied to a temp quote on the
        // backend (server prices the cart). No Booking row exists yet — it will
        // only be created after the payment actually succeeds.
        const quoteRes = await api.post(endpoints.PAYMENT_QUOTE_ORDER, bookingPayload);
        const quote = quoteRes.data?.data;

        const attemptOnlinePayment = async (): Promise<boolean> => {
          const payResult = await openQuoteCheckout({
            keyId: quote.keyId,
            amount: quote.amount,
            currency: quote.currency,
            orderId: quote.orderId,
            description: 'Beyomo booking',
            contact: profile?.phone,
            name: profile?.name,
            email: profile?.email,
          });
          if (payResult.success) {
            // Verified on server + booking created atomically.
            const created = await api.post(endpoints.BOOKINGS, {
              ...bookingPayload,
              quoteId: quote.quoteId,
              razorpayOrderId: payResult.razorpayOrderId,
              razorpayPaymentId: payResult.razorpayPaymentId,
              razorpaySignature: payResult.razorpaySignature,
            });
            bk = created.data?.data;
            return true;
          }
          return new Promise<boolean>(resolve => {
            Alert.alert(
              'Payment Not Completed',
              `${payResult.message} No booking has been created. You can retry the payment now or cancel.`,
              [
                {text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
                {text: 'Retry Payment', onPress: () => attemptOnlinePayment().then(resolve)},
              ],
            );
          });
        };

        const paid = await attemptOnlinePayment();
        if (!paid) {
          // Nothing to clean up — no booking was created. Just stay on checkout.
          return;
        }
      } else {
        // COD flow unchanged — booking is created immediately.
        const result = await api.post(endpoints.BOOKINGS, bookingPayload);
        bk = result.data?.data;
      }

      // At this point bk exists (COD created, or online payment verified). Safe
      // to clear the cart and navigate to the success screen.
      if (isCartMode) dispatch(clearCart());

      navigation?.reset({
        index: 1,
        routes: [
          {name: 'Main'},
          {name: 'OrderPlaced', params: {bookingCode: bk?.bookingCode, bookingId: bk?.id}},
        ],
      });
    } catch (err: any) {
      Alert.alert(
        'Booking failed',
        err?.response?.data?.message ?? 'Something went wrong. Please try again.',
      );
    } finally {
      setBooking(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Header ── */}
      <View style={[styles.header, {paddingTop: insets.top + sw(10)}]}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={sw(22)} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isCartMode
              ? cartItems.length === 1
                ? cartItems[0].packageTitle
                : cartItems.length > 1
                  ? `${cartItems.length} Packages`
                  : 'Address & Payment'
              : routePackageTitle
                ? routePackageTitle
                : 'Address & Payment'}
          </Text>
          <View style={styles.headerUnderline} />
        </View>
        <View style={{width: sw(38)}} />
      </View>

      {isCartEmpty ? (
        <View style={styles.emptyCart}>
          <View style={styles.emptyCartIconCircle}>
            <Ionicons name="cart-outline" size={sw(40)} color="#105641" />
          </View>
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartSub}>
            Add a package, combo, or service to get started.
          </Text>
          <TouchableOpacity
            style={styles.emptyCartBtn}
            activeOpacity={0.85}
            onPress={() => navigation?.navigate('Main')}>
            <Text style={styles.emptyCartBtnText}>Browse Services</Text>
            <Ionicons name="arrow-forward" size={sw(16)} color="#FDD77A" />
          </TouchableOpacity>
        </View>
      ) : (
      <>
      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: sw(110)}]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── Delivery Address ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
              <Ionicons name="home" size={sw(16)} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>

          {!profile && profileError ? (
            <View style={{alignItems: 'center', paddingVertical: sw(12), gap: sw(8)}}>
              <Text style={{fontFamily: fonts.textFont, fontSize: sw(12), color: '#888'}}>
                {profileError}
              </Text>
              <TouchableOpacity
                style={styles.addAddrBtn}
                activeOpacity={0.8}
                onPress={() => dispatch(fetchProfile())}>
                <Ionicons name="refresh-outline" size={sw(18)} color="#105641" />
                <Text style={styles.addAddrText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : !profile ? (
            <ActivityIndicator size="small" color="#105641" style={{marginVertical: sw(12)}} />
          ) : addresses.length === 0 ? (
            <TouchableOpacity
              style={styles.addAddrBtn}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('MyAddresses')}>
              <Ionicons name="add-circle-outline" size={sw(20)} color="#105641" />
              <Text style={styles.addAddrText}>Add a saved address to continue</Text>
            </TouchableOpacity>
          ) : selectableAddresses.length === 0 ? (
            <TouchableOpacity
              style={styles.addAddrBtn}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('MyAddresses')}>
              <Ionicons name="warning-outline" size={sw(20)} color="#FB1616" />
              <Text style={styles.addAddrText}>
                No saved addresses in {selectedCity?.name}. Add one to continue.
              </Text>
            </TouchableOpacity>
          ) : selectedAddr ? (
            <View style={styles.addrBlock}>
              <View style={styles.addrInfo}>
                <View style={styles.addrTagRow}>
                  <Ionicons name="location-sharp" size={sw(14)} color="#105641" />
                  <Text style={styles.addrTag}>{addrLabel(selectedAddr)}</Text>
                  {selectedAddr.isDefault && (
                    <View style={styles.defaultChip}>
                      <Text style={styles.defaultChipText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addrLine1} numberOfLines={2}>{addrLine(selectedAddr)}</Text>
                {selectedAddr.line2 ? (
                  <Text style={styles.addrLine2} numberOfLines={1}>{selectedAddr.line2}</Text>
                ) : null}
                {(selectedAddr.city || selectedAddr.state || selectedAddr.pincode) ? (
                  <Text style={styles.addrLine2}>
                    {[selectedAddr.city, selectedAddr.state, selectedAddr.pincode].filter(Boolean).join(', ')}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.changeBtn}
                activeOpacity={0.7}
                onPress={() => setShowAddrModal(true)}>
                <Text style={styles.changeBtnText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* ── Package Banner(s) — cart mode: one per package, each independently priced ── */}
        {isCartMode && cartItems.map(item => (
          <View key={item.key} style={styles.packageBannerCard}>
            <View style={styles.packageBannerHeader}>
              <View style={styles.packageBadge}>
                <Ionicons name="gift" size={sw(12)} color="#012823" />
                <Text style={styles.packageBadgeText}>
                  {item.packageType === 'fixed' ? 'COMBO' : 'PACKAGE'}{item.qty > 1 ? ` ×${item.qty}` : ''}
                </Text>
              </View>
              <Text style={styles.packageBannerTitle} numberOfLines={2}>
                {item.packageTitle}
              </Text>
              <TouchableOpacity
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                onPress={() => removeCartItem(item.key)}>
                <Ionicons name="close-circle" size={sw(20)} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
            <View style={styles.packagePriceRow}>
              <Text style={styles.packageBannerPrice}>
                ₹{formatAmount(item.packagePrice * item.qty)}
              </Text>
              {item.packageOriginalPrice > item.packagePrice && (
                <Text style={styles.packageBannerOriginal}>
                  ₹{formatAmount(item.packageOriginalPrice * item.qty)}
                </Text>
              )}
            </View>
            <View style={styles.packageQtyRow}>
              <Text style={styles.packageBannerSub}>
                {item.services.length} service{item.services.length !== 1 ? 's' : ''} included
              </Text>
              <View style={styles.packageStepper}>
                <TouchableOpacity style={styles.stepBtn} activeOpacity={0.7} onPress={() => decrementCartItem(item.key)}>
                  <Ionicons name="remove" size={sw(16)} color="#FDD77A" />
                </TouchableOpacity>
                <Text style={styles.packageStepCount}>{item.qty}</Text>
                <TouchableOpacity style={styles.stepBtn} activeOpacity={0.7} onPress={() => incrementCartItem(item.key)}>
                  <Ionicons name="add" size={sw(16)} color="#FDD77A" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* ── Package Banner (legacy single-package direct flow) ── */}
        {!isCartMode && routePackageId && (
          <View style={styles.packageBannerCard}>
            <View style={styles.packageBannerHeader}>
              <View style={styles.packageBadge}>
                <Ionicons name="gift" size={sw(12)} color="#012823" />
                <Text style={styles.packageBadgeText}>
                  PACKAGE{currentPackageQty > 1 ? ` ×${currentPackageQty}` : ''}
                </Text>
              </View>
              <Text style={styles.packageBannerTitle} numberOfLines={2}>
                {routePackageTitle}
              </Text>
            </View>
            <View style={styles.packagePriceRow}>
              <Text style={styles.packageBannerPrice}>
                ₹{formatAmount((routePackagePrice ?? 0) * currentPackageQty)}
              </Text>
              {packageItemsIndividualSum > (routePackagePrice ?? 0) * currentPackageQty && (
                <Text style={styles.packageBannerOriginal}>
                  ₹{formatAmount(packageItemsIndividualSum)}
                </Text>
              )}
              {packageSavings > 0 && (
                <View style={styles.packageSavingChip}>
                  <Text style={styles.packageSavingChipText}>
                    Save ₹{formatAmount(packageSavings)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.packageQtyRow}>
              <Text style={styles.packageBannerSub}>
                {packageItems.length} service{packageItems.length !== 1 ? 's' : ''} included · Add more services below
              </Text>
              <View style={styles.packageStepper}>
                <TouchableOpacity style={styles.stepBtn} activeOpacity={0.7} onPress={decrementPackageQty}>
                  <Ionicons name="remove" size={sw(16)} color="#FDD77A" />
                </TouchableOpacity>
                <Text style={styles.packageStepCount}>{currentPackageQty}</Text>
                <TouchableOpacity style={styles.stepBtn} activeOpacity={0.7} onPress={incrementPackageQty}>
                  <Ionicons name="add" size={sw(16)} color="#FDD77A" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ── Service items ── */}
        {displayServiceRows.map(item => (
          <View key={item.rowKey} style={styles.serviceCard}>
            <Image source={{uri: item.image}} style={styles.serviceThumb} resizeMode="cover" />
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceCode} numberOfLines={2}>{item.name}</Text>
              {item.duration ? (
                <View style={styles.durationRow}>
                  <Ionicons name="time-outline" size={sw(15)} color="#292D32" />
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>
              ) : null}
              <View style={styles.serviceBottomRow}>
                {(item as any).isPackageItem ? (
                  <>
                    <Text style={styles.priceTextStrikethrough}>
                      ₹{formatAmount(item.price * item.qty)}
                    </Text>
                    <View style={styles.includedTag}>
                      <Ionicons name="checkmark-circle" size={sw(13)} color="#105641" />
                      <Text style={styles.includedTagText}>Included</Text>
                    </View>
                  </>
                ) : (item as any).isFree ? (
                  <>
                    <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>
                    <TouchableOpacity onPress={removeOffer} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                      <Ionicons name="close-circle" size={sw(20)} color="#FF2F2F" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.priceText}>
                      ₹{formatAmount(item.price * item.qty)}
                    </Text>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        activeOpacity={0.7}
                        onPress={() => decrement(item.id)}>
                        <Ionicons
                          name={item.qty === 1 ? 'trash-outline' : 'remove'}
                          size={sw(16)}
                          color={item.qty === 1 ? '#FF2F2F' : '#105641'}
                        />
                      </TouchableOpacity>
                      <Text style={styles.stepCount}>{item.qty}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        activeOpacity={0.7}
                        onPress={() => increment(item.id)}>
                        <Ionicons name="add" size={sw(16)} color="#105641" />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        ))}

        {/* ── Add more services ── */}
        <TouchableOpacity style={styles.addMoreBtn} activeOpacity={0.8} onPress={handleAddMoreServices}>
          <Ionicons name="add-circle-outline" size={sw(18)} color="#105641" />
          <Text style={styles.addMoreBtnText}>Add More Services</Text>
        </TouchableOpacity>

        {/* ── Date & time ── */}
        <TouchableOpacity
          style={[styles.dateCard, !!dateError && styles.dateCardError]}
          activeOpacity={0.7}
          onPress={() => setShowDatePicker(true)}>
          <View style={styles.dateLeft}>
            <View style={styles.calendarIconBox}>
              <MaterialIcons name="calendar-today" size={sw(15)} color="#FEFEFE" />
            </View>
            <View>
              <Text style={styles.dateLabel}>Date & time</Text>
              {!!dateError && <Text style={styles.dateErrorText}>{dateError}</Text>}
            </View>
          </View>
          <Text style={styles.dateValue}>
            {formatDate(selectedDate)} | {formatTime(selectedDate)}
          </Text>
        </TouchableOpacity>

        {/* ── Payment Method ── */}
        <View style={styles.couponCard}>
          <View style={styles.couponHeader}>
            <View style={styles.sectionIconBox}>
              <Ionicons name="card" size={sw(15)} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          <View style={styles.paymentModeRow}>
            <TouchableOpacity
              style={[
                styles.paymentModeOption,
                paymentMode === 'online' && styles.paymentModeOptionActive,
                !ONLINE_PAYMENTS_ENABLED && styles.paymentModeOptionDisabled,
              ]}
              activeOpacity={ONLINE_PAYMENTS_ENABLED ? 0.8 : 1}
              disabled={!ONLINE_PAYMENTS_ENABLED}
              onPress={() => setPaymentMode('online')}>
              <Ionicons
                name={paymentMode === 'online' ? 'radio-button-on' : 'radio-button-off'}
                size={sw(16)}
                color={paymentMode === 'online' ? '#105641' : '#AAAAAA'}
              />
              <View style={{flex: 1}}>
                <Text style={[styles.paymentModeLabel, paymentMode === 'online' && styles.paymentModeLabelActive]}>
                  Pay Online
                </Text>
                <Text style={styles.paymentModeSub}>
                  {ONLINE_PAYMENTS_ENABLED ? 'UPI, Card, Netbanking & more' : 'Currently unavailable'}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentModeOption, paymentMode === 'cod' && styles.paymentModeOptionActive]}
              activeOpacity={0.8}
              onPress={() => setPaymentMode('cod')}>
              <Ionicons
                name={paymentMode === 'cod' ? 'radio-button-on' : 'radio-button-off'}
                size={sw(16)}
                color={paymentMode === 'cod' ? '#105641' : '#AAAAAA'}
              />
              <View style={{flex: 1}}>
                <Text style={[styles.paymentModeLabel, paymentMode === 'cod' && styles.paymentModeLabelActive]}>
                  Pay after Service
                </Text>
                <Text style={styles.paymentModeSub}>Pay the expert after service</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Offer Banner ── */}
        {eligibleOffer && !appliedOffer && (
          <View style={styles.offerBanner}>
            <View style={styles.offerBannerLeft}>
              <Text style={styles.offerBannerGift}>🎁</Text>
              <View style={{flex: 1}}>
                <Text style={styles.offerBannerTitle}>{eligibleOffer.title}</Text>
                <Text style={styles.offerBannerSub}>
                  Add <Text style={{fontWeight: '700'}}>{eligibleOffer.freeService.name}</Text> to your booking for FREE!
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.offerAddBtn} activeOpacity={0.8} onPress={addFreeService}>
              <Text style={styles.offerAddText}>Add Free</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Coupon — hidden for now, state/logic stay intact, just not rendered.
        <View style={styles.couponCard}>
          <View style={styles.couponHeader}>
            <View style={styles.sectionIconBox}>
              <Ionicons name="pricetag" size={sw(15)} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Apply Coupon</Text>
          </View>
          {appliedCoupon ? (
            <View style={styles.couponApplied}>
              <View style={styles.couponAppliedLeft}>
                <Ionicons name="checkmark-circle" size={sw(18)} color="#105641" />
                <View>
                  <Text style={styles.couponAppliedCode}>{appliedCoupon.code}</Text>
                  {appliedCoupon.description ? (
                    <Text style={styles.couponAppliedDesc}>{appliedCoupon.description}</Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity onPress={removeCoupon} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Ionicons name="close-circle" size={sw(20)} color="#FF2F2F" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.browseCouponsBtn}
              activeOpacity={0.7}
              onPress={() =>
                navigation?.navigate('Coupons', {
                  orderAmount: subtotal,
                  onSelect: (c: {code: string; discountAmount: number; description?: string}) => {
                    setAppliedCoupon(c);
                    setCouponError('');
                  },
                })
              }>
              <Ionicons name="pricetag-outline" size={sw(13)} color="#105641" />
              <Text style={styles.browseCouponsText}>Browse all coupons & offers</Text>
              <Ionicons name="chevron-forward" size={sw(13)} color="#105641" />
            </TouchableOpacity>
          )}
          {!!couponError && <Text style={styles.couponErrorText}>{couponError}</Text>}
        </View>
        */}

        {/* ── Bill Summary ── */}
        <View style={styles.billCard}>
          <TouchableOpacity
            style={styles.billHeader}
            activeOpacity={0.7}
            onPress={() => setBillExpanded(v => !v)}>
            <Text style={styles.billTitle}>Bill Summary</Text>
            <Ionicons
              name={billExpanded ? 'chevron-up' : 'chevron-down'}
              size={sw(20)}
              color="#000000"
            />
          </TouchableOpacity>
          <View style={styles.divider} />
          {billExpanded && (
            <View style={styles.billRows}>
              {isCartMode && cartItems.map(item => (
                <View key={item.key} style={styles.billRow}>
                  <Text style={styles.billLabel} numberOfLines={1}>
                    {item.packageTitle}{item.qty > 1 ? ` ×${item.qty}` : ''}
                  </Text>
                  <Text style={styles.billValue}>
                    ₹{formatAmount(item.packagePrice * item.qty)}
                  </Text>
                </View>
              ))}
              {effectiveServices.map(s => (
                <View key={String((s as any).isFree ? `free-${s.id}` : s.id)} style={styles.billRow}>
                  <Text style={styles.billLabel} numberOfLines={1}>
                    {s.name}{s.qty > 1 ? ` ×${s.qty}` : ''}
                  </Text>
                  <Text style={styles.billValue}>
                    ₹{formatAmount(s.price * s.qty)}
                  </Text>
                </View>
              ))}
              {isCartMode ? (
                packageSavings > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, {color: '#105641'}]}>Package Savings</Text>
                    <Text style={[styles.billValue, {color: '#105641'}]}>
                      −₹{formatAmount(packageSavings)}
                    </Text>
                  </View>
                )
              ) : routePackageId ? (
                <>
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, {fontWeight: '600'}]}>Package Price</Text>
                    <Text style={[styles.billValue, {fontWeight: '600'}]}>
                      ₹{formatAmount(routePackagePrice ?? 0)}
                    </Text>
                  </View>
                  {extraItemsSubtotal > 0 && (
                    <View style={styles.billRow}>
                      <Text style={[styles.billLabel, {fontWeight: '600'}]}>Extra Services</Text>
                      <Text style={[styles.billValue, {fontWeight: '600'}]}>
                        ₹{formatAmount(extraItemsSubtotal)}
                      </Text>
                    </View>
                  )}
                  {packageSavings > 0 && (
                    <View style={styles.billRow}>
                      <Text style={[styles.billLabel, {color: '#105641'}]}>Package Savings</Text>
                      <Text style={[styles.billValue, {color: '#105641'}]}>
                        −₹{formatAmount(packageSavings)}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, {fontWeight: '600'}]}>Service Value</Text>
                  <Text style={[styles.billValue, {fontWeight: '600'}]}>
                    ₹{formatAmount(subtotal)}
                  </Text>
                </View>
              )}
              {couponDiscount > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, {color: '#105641'}]}>
                    Coupon ({appliedCoupon?.code})
                  </Text>
                  <Text style={[styles.billValue, {color: '#105641'}]}>
                    −₹{formatAmount(couponDiscount)}
                  </Text>
                </View>
              )}
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Platform Fee</Text>
                <Text style={styles.billValue}>₹0</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Disposable Charges</Text>
                <Text style={styles.billValue}>₹0</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Travelling Charges</Text>
                <Text style={styles.billValue}>₹0</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Taxes & GST (5%)</Text>
                <Text style={styles.billValue}>₹{formatAmount(tax)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.toPayRow}>
                <MaterialIcons name="receipt" size={sw(16)} color="#C49738" />
                <View style={styles.toPayTextBlock}>
                  <Text style={styles.toPayLabel}>To Pay</Text>
                  <Text style={styles.toPaySub}>Inclusive Of All Taxes And Charges</Text>
                </View>
                <Text style={styles.toPayAmount}>₹{formatAmount(total)}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date picker */}
      <DatePicker
        modal
        open={showDatePicker}
        date={selectedDate}
        mode="date"
        minimumDate={new Date()}
        title="Select Date"
        confirmText="Next"
        cancelText="Cancel"
        onConfirm={date => {
          const merged = new Date(selectedDate);
          merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
          handleDateChange(merged);
          setShowDatePicker(false);
          setShowTimePicker(true);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
      <DatePicker
        modal
        open={showTimePicker}
        date={selectedDate}
        mode="time"
        title="Select Time"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={time => {
          const merged = new Date(selectedDate);
          merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
          handleDateChange(merged);
          setShowTimePicker(false);
        }}
        onCancel={() => setShowTimePicker(false)}
      />

      {/* ── Address picker modal ── */}
      <Modal
        visible={showAddrModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddrModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddrModal(false)}
        />
        <View style={[styles.modalSheet, {paddingBottom: insets.bottom + sw(16)}]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select Address</Text>
          {selectedCity && (
            <Text style={styles.modalSubtitle}>Showing addresses in {selectedCity.name}</Text>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedCity && selectableAddresses.length === 0 && (
              <Text style={styles.modalEmptyText}>
                No saved addresses in {selectedCity.name} yet. Add one below.
              </Text>
            )}
            {selectableAddresses.map(addr => {
              const addrId = addr._id ?? addr.id;
              const selId  = selectedAddr?._id ?? selectedAddr?.id;
              const active = addrId === selId;
              return (
                <TouchableOpacity
                  key={addrId}
                  style={[styles.modalAddrCard, active && styles.modalAddrCardActive]}
                  activeOpacity={0.75}
                  onPress={() => { setSelectedAddr(addr); setShowAddrModal(false); }}>
                  <View style={[styles.modalRadio, active && styles.modalRadioActive]}>
                    {active && <View style={styles.modalRadioDot} />}
                  </View>
                  <View style={styles.modalAddrBody}>
                    <View style={styles.addrTagRow}>
                      <Ionicons name="location-sharp" size={sw(13)} color={active ? '#105641' : '#888'} />
                      <Text style={[styles.addrTag, active && {color: '#105641'}]}>
                        {addrLabel(addr)}
                      </Text>
                      {addr.isDefault && (
                        <View style={styles.defaultChip}>
                          <Text style={styles.defaultChipText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addrLine1} numberOfLines={1}>{addrLine(addr)}</Text>
                    {(addr.city || addr.state) ? (
                      <Text style={styles.addrLine2}>
                        {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.addNewAddrBtn}
              activeOpacity={0.8}
              onPress={() => { setShowAddrModal(false); navigation?.navigate('MyAddresses'); }}>
              <Ionicons name="add-circle-outline" size={sw(18)} color="#105641" />
              <Text style={styles.addNewAddrText}>Add New Address</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Add More Services modal ── */}
      <Modal
        visible={showAddSvcModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddSvcModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddSvcModal(false)}
        />
        <View style={[styles.addSvcSheet, {paddingBottom: insets.bottom + sw(16)}]}>
          <View style={styles.modalHandle} />
          <View style={styles.addSvcHeader}>
            <Text style={styles.modalTitle}>Add More Services</Text>
            <TouchableOpacity onPress={() => setShowAddSvcModal(false)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons name="close" size={sw(22)} color="#171816" />
            </TouchableOpacity>
          </View>

          <View style={styles.addSvcSearchWrap}>
            <Ionicons name="search-outline" size={sw(16)} color="#888" />
            <TextInput
              style={styles.addSvcSearchInput}
              placeholder="Search services…"
              placeholderTextColor="#AAA"
              value={addSvcSearch}
              onChangeText={setAddSvcSearch}
            />
          </View>

          {addSvcCart.length > 0 && (
            <View style={styles.addSvcCartBar}>
              <Text style={styles.addSvcCartText}>{addSvcCart.length} selected</Text>
              <Text style={styles.addSvcCartPrice}>₹{formatAmount(addSvcCartTotal)}</Text>
            </View>
          )}

          {loadingAddSvcs ? (
            <ActivityIndicator color="#105641" size="large" style={{marginVertical: sw(40)}} />
          ) : (
            <FlatList
              data={filteredAddSvcs}
              keyExtractor={item => String(item.id)}
              style={{flex: 1}}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.addSvcListContent}
              renderItem={({item}) => {
                const cartItem = addSvcCart.find(c => c.svc.id === item.id);
                const isSelected = !!cartItem;
                return (
                  <View style={[styles.addSvcItem, isSelected && styles.addSvcItemSelected]}>
                    <TouchableOpacity
                      style={{flex: 1}}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (isSelected) setAddSvcCart(prev => prev.filter(c => c.svc.id !== item.id));
                        else setAddSvcCart(prev => [...prev, {svc: item, qty: 1}]);
                      }}>
                      <Text style={[styles.addSvcItemName, isSelected && styles.addSvcItemNameSelected]}>{item.name}</Text>
                      <Text style={styles.addSvcItemMeta}>
                        {item.duration ? `${item.duration} min  •  ` : ''}₹{formatAmount(parseFloat(item.basePrice ?? 0))}
                      </Text>
                    </TouchableOpacity>
                    {isSelected ? (
                      <View style={styles.addSvcInlineQty}>
                        <TouchableOpacity onPress={() => setAddSvcCart(prev => prev.map(c => c.svc.id === item.id ? {...c, qty: Math.max(1, c.qty - 1)} : c))}>
                          <Ionicons name="remove-circle" size={sw(22)} color="#105641" />
                        </TouchableOpacity>
                        <Text style={styles.addSvcInlineQtyNum}>{cartItem.qty}</Text>
                        <TouchableOpacity onPress={() => setAddSvcCart(prev => prev.map(c => c.svc.id === item.id ? {...c, qty: Math.min(c.qty + 1, MAX_SERVICE_QTY)} : c))}>
                          <Ionicons name="add-circle" size={sw(22)} color="#105641" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => setAddSvcCart(prev => [...prev, {svc: item, qty: 1}])}>
                        <Ionicons name="add-circle-outline" size={sw(22)} color="#CCCCCC" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={<Text style={styles.addSvcEmptyText}>No services found</Text>}
            />
          )}

          <View style={styles.addSvcFooter}>
            <TouchableOpacity style={styles.addSvcCancelBtn} onPress={() => setShowAddSvcModal(false)}>
              <Text style={styles.addSvcCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addSvcConfirmBtn, !addSvcCart.length && styles.addSvcConfirmBtnDisabled]}
              disabled={!addSvcCart.length}
              onPress={handleConfirmAddServices}>
              <Text style={styles.addSvcConfirmText}>Add {addSvcCart.length || ''} Service{addSvcCart.length !== 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom bar */}
      {subtotal > 0 && subtotal < MIN_BOOKING_AMOUNT && (
        <View style={styles.minAmountBanner}>
          <Ionicons name="information-circle" size={sw(14)} color="#B45309" />
          <Text style={styles.minAmountText}>
            Add ₹{formatAmount(MIN_BOOKING_AMOUNT - subtotal)} more to reach the ₹{formatAmount(MIN_BOOKING_AMOUNT)} minimum booking amount
          </Text>
        </View>
      )}
      <View style={[styles.bottomBar, {paddingBottom: insets.bottom + sw(8)}]}>
        <View>
          <Text style={styles.bottomPrice}>₹{formatAmount(total)}</Text>
          <View style={styles.bottomSubRow}>
            <Text style={styles.bottomSub}>Inclusive all taxes</Text>
            <Ionicons name="information-circle-outline" size={sw(12)} color="#454545" />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.continueBtn, (booking || !selectedAddr || subtotal < MIN_BOOKING_AMOUNT) && {opacity: 0.6}]}
          activeOpacity={0.85}
          disabled={booking || !selectedAddr || subtotal < MIN_BOOKING_AMOUNT}
          onPress={handleBooking}>
          {booking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
      </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#EEEDED'},

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingBottom: sw(14),
    backgroundColor: '#105641',
  },
  backBtn: {
    width: sw(38),
    height: sw(38),
    borderRadius: sw(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {alignItems: 'center', gap: sw(4)},
  headerTitle: {
    fontFamily: fonts.title,
    fontSize: sw(17),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerUnderline: {width: sw(38), height: 1.5, backgroundColor: '#C49738'},

  /* ── Scroll ── */
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: sw(16), paddingTop: sw(14), gap: sw(14)},

  /* ── Empty cart ── */
  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sw(32),
  },
  emptyCartIconCircle: {
    width: sw(88),
    height: sw(88),
    borderRadius: sw(44),
    backgroundColor: 'rgba(16,86,65,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sw(20),
  },
  emptyCartTitle: {
    fontFamily: fonts.title,
    fontSize: sw(18),
    fontWeight: '700',
    color: '#171816',
    marginBottom: sw(8),
  },
  emptyCartSub: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#777',
    textAlign: 'center',
    lineHeight: sw(19),
    marginBottom: sw(24),
  },
  emptyCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    backgroundColor: '#105641',
    borderRadius: sw(12),
    paddingVertical: sw(13),
    paddingHorizontal: sw(24),
  },
  emptyCartBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── Section card ── */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(12),
    gap: sw(10),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
  },
  sectionIconBox: {
    width: sw(30),
    height: sw(30),
    borderRadius: sw(8),
    backgroundColor: '#C49738',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#105641',
    flex: 1,
  },

  /* ── Address display ── */
  addrBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sw(10),
    paddingTop: sw(4),
  },
  addrInfo: {flex: 1, gap: sw(3)},
  addrTagRow: {flexDirection: 'row', alignItems: 'center', gap: sw(4)},
  addrTag: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '600', color: '#555'},
  defaultChip: {
    backgroundColor: '#EAF5F0',
    borderRadius: sw(4),
    paddingHorizontal: sw(6),
    paddingVertical: sw(1),
  },
  defaultChipText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#105641'},
  addrLine1: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '500'},
  addrLine2: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#777'},
  changeBtn: {
    borderWidth: 1,
    borderColor: '#105641',
    borderRadius: sw(20),
    paddingHorizontal: sw(12),
    paddingVertical: sw(5),
  },
  changeBtnText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#105641', fontWeight: '600'},

  addAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    paddingVertical: sw(10),
  },
  addAddrText: {flex: 1, flexShrink: 1, fontFamily: fonts.textFont, fontSize: sw(13), color: '#105641', fontWeight: '500'},

  /* ── Service card ── */
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFEFE',
    borderRadius: sw(12),
    padding: sw(8),
    gap: sw(12),
  },
  serviceThumb: {
    borderRadius: sw(12),
    width: sw(99),
    height: sw(89),
    backgroundColor: '#D9D9D9',
    flexShrink: 0,
  },
  serviceInfo: {flex: 1, gap: sw(8)},
  serviceCode: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    fontWeight: '500',
    color: '#000000',
    lineHeight: sw(17),
  },
  durationRow: {flexDirection: 'row', alignItems: 'center', gap: sw(6)},
  durationText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#000000'},
  serviceBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: sw(4),
  },
  priceText: {fontFamily: fonts.textFont, fontSize: sw(16), fontWeight: '600', color: '#000000'},
  priceTextStrikethrough: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    fontWeight: '500',
    color: '#AAAAAA',
    textDecorationLine: 'line-through',
  },
  includedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    backgroundColor: '#EAF5F0',
    borderRadius: sw(20),
    paddingHorizontal: sw(10),
    paddingVertical: sw(4),
  },
  includedTagText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    fontWeight: '600',
    color: '#105641',
  },

  /* ── Package banner ── */
  packageBannerCard: {
    backgroundColor: '#012823',
    borderRadius: sw(12),
    padding: sw(14),
    gap: sw(8),
  },
  packageBannerHeader: {flexDirection: 'row', alignItems: 'center', gap: sw(10)},
  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    backgroundColor: '#FDD77A',
    borderRadius: sw(6),
    paddingHorizontal: sw(8),
    paddingVertical: sw(3),
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  packageBadgeText: {
    fontFamily: fonts.title,
    fontSize: sw(12),
    fontWeight: '800',
    color: '#012823',
    letterSpacing: 0.5,
  },
  packageBannerTitle: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  packagePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
    flexWrap: 'wrap',
  },
  packageBannerPrice: {
    fontFamily: fonts.title,
    fontSize: sw(22),
    fontWeight: '800',
    color: '#FDD77A',
  },
  packageBannerOriginal: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: 'rgba(255,255,255,0.45)',
    textDecorationLine: 'line-through',
  },
  packageSavingChip: {
    backgroundColor: '#105641',
    borderRadius: sw(20),
    paddingHorizontal: sw(10),
    paddingVertical: sw(3),
  },
  packageSavingChipText: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#FDD77A',
  },
  packageBannerSub: {
    flex: 1,
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: 'rgba(255,255,255,0.55)',
  },
  packageQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
  },
  packageStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDD77A',
    borderRadius: sw(20),
    overflow: 'hidden',
    flexShrink: 0,
  },
  packageStepCount: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#FDD77A',
    minWidth: sw(20),
    textAlign: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#105641',
    borderRadius: sw(20),
    overflow: 'hidden',
  },
  stepBtn: {width: sw(32), height: sw(32), alignItems: 'center', justifyContent: 'center'},
  stepCount: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#105641',
    minWidth: sw(24),
    textAlign: 'center',
  },

  /* ── Add more services ── */
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(8),
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    borderWidth: 1.5,
    borderColor: '#105641',
    borderStyle: 'dashed',
    paddingVertical: sw(12),
  },
  addMoreBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#105641',
  },

  /* ── Date ── */
  dateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    paddingVertical: sw(8),
    paddingHorizontal: sw(12),
    gap: sw(8),
  },
  dateLeft: {flexDirection: 'row', alignItems: 'center', gap: sw(8)},
  calendarIconBox: {
    width: sw(30),
    height: sw(30),
    borderRadius: sw(8),
    backgroundColor: '#012823',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEFEFE',
  },
  dateCardError: {borderWidth: 1, borderColor: '#FF2F2F'},
  dateErrorText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#FF2F2F', marginTop: sw(2)},
  dateLabel: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#012823'},
  dateValue: {fontFamily: fonts.textFont, fontSize: sw(14), fontWeight: '500', color: '#171816'},

  /* ── Offer banner ── */
  offerBanner: {
    backgroundColor: '#EAF5F0',
    borderRadius: sw(12),
    borderWidth: 1.5,
    borderColor: '#105641',
    padding: sw(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
  },
  offerBannerLeft: {flexDirection: 'row', alignItems: 'center', gap: sw(8), flex: 1},
  offerBannerGift: {fontSize: sw(24)},
  offerBannerTitle: {fontFamily: fonts.title, fontSize: sw(12), fontWeight: '700', color: '#105641'},
  offerBannerSub: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#444', marginTop: sw(2)},
  offerAddBtn: {
    backgroundColor: '#105641',
    borderRadius: sw(8),
    paddingHorizontal: sw(12),
    paddingVertical: sw(7),
  },
  offerAddText: {fontFamily: fonts.title, fontSize: sw(12), fontWeight: '700', color: '#FFFFFF'},
  freeBadge: {
    backgroundColor: '#105641',
    borderRadius: sw(6),
    paddingHorizontal: sw(10),
    paddingVertical: sw(4),
  },
  freeBadgeText: {fontFamily: fonts.title, fontSize: sw(12), fontWeight: '800', color: '#FDD77A'},

  /* ── Payment Method ── */
  paymentModeRow: {gap: sw(8)},
  paymentModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
    borderWidth: 1.5,
    borderColor: '#EEEDED',
    borderRadius: sw(10),
    padding: sw(12),
  },
  paymentModeOptionActive: {borderColor: '#105641', backgroundColor: 'rgba(16,86,65,0.05)'},
  paymentModeOptionDisabled: {opacity: 0.45},
  paymentModeLabel: {fontFamily: fonts.textFont, fontSize: sw(13), fontWeight: '600', color: '#171816'},
  paymentModeLabelActive: {color: '#105641'},
  paymentModeSub: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#888', marginTop: sw(2)},

  /* ── Coupon ── */
  couponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(12),
    gap: sw(10),
  },
  couponHeader: {flexDirection: 'row', alignItems: 'center', gap: sw(8)},
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EAF5F0',
    borderRadius: sw(8),
    paddingVertical: sw(8),
    paddingHorizontal: sw(10),
  },
  couponAppliedLeft: {flexDirection: 'row', alignItems: 'center', gap: sw(8), flex: 1},
  couponAppliedCode: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#105641'},
  couponAppliedDesc: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#555', marginTop: sw(2)},
  couponErrorText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#FF2F2F'},
  browseCouponsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    paddingVertical: sw(6),
  },
  browseCouponsText: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#105641',
    fontWeight: '600',
    flex: 1,
  },

  /* ── Bill ── */
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    borderWidth: 0.5,
    borderColor: '#CBCBCB',
    padding: sw(12),
    gap: sw(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  billHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  billTitle: {fontFamily: fonts.textFont, fontSize: sw(14), fontWeight: '700', color: '#303030'},
  divider: {height: 0.5, backgroundColor: '#CBCBCB'},
  billRows: {gap: sw(12)},
  billRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: sw(10)},
  billLabel: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#171816'},
  billValue: {fontFamily: fonts.textFont, fontSize: sw(14), fontWeight: '500', color: '#252525'},
  toPayRow: {flexDirection: 'row', alignItems: 'center', gap: sw(8)},
  toPayTextBlock: {flex: 1},
  toPayLabel: {fontFamily: fonts.textFont, fontSize: sw(14), fontWeight: '700', color: '#303030'},
  toPaySub: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#575757'},
  toPayAmount: {fontFamily: fonts.textFont, fontSize: sw(14), fontWeight: '700', color: '#303030'},

  /* ── Address picker modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: sw(20),
    borderTopRightRadius: sw(20),
    paddingHorizontal: sw(16),
    paddingTop: sw(12),
    maxHeight: '65%',
  },
  modalHandle: {
    width: sw(40),
    height: sw(4),
    borderRadius: sw(2),
    backgroundColor: '#D0D0D0',
    alignSelf: 'center',
    marginBottom: sw(12),
  },
  modalTitle: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#171816',
    marginBottom: sw(4),
  },
  modalSubtitle: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#888',
    marginBottom: sw(10),
  },
  modalEmptyText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#A3A3A3',
    textAlign: 'center',
    paddingVertical: sw(20),
  },
  modalAddrCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sw(12),
    padding: sw(12),
    borderRadius: sw(12),
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    marginBottom: sw(10),
  },
  modalAddrCardActive: {borderColor: '#105641', backgroundColor: '#F0FAF6'},
  modalRadio: {
    width: sw(20),
    height: sw(20),
    borderRadius: sw(10),
    borderWidth: 2,
    borderColor: '#CBCBCB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sw(2),
  },
  modalRadioActive: {borderColor: '#105641'},
  modalRadioDot: {
    width: sw(10),
    height: sw(10),
    borderRadius: sw(5),
    backgroundColor: '#105641',
  },
  modalAddrBody: {flex: 1, gap: sw(3)},
  addNewAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    paddingVertical: sw(14),
    borderTopWidth: 0.5,
    borderTopColor: '#EEEEEE',
    marginTop: sw(4),
  },
  addNewAddrText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#105641', fontWeight: '600'},

  /* ── Add More Services modal ── */
  addSvcSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: sw(20),
    borderTopRightRadius: sw(20),
    maxHeight: '85%',
    flex: 1,
    paddingBottom: sw(16),
  },
  addSvcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    marginBottom: sw(10),
  },
  addSvcSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    marginHorizontal: sw(16),
    marginBottom: sw(10),
    backgroundColor: '#F5F5F5',
    borderRadius: sw(10),
    paddingHorizontal: sw(12),
    height: sw(40),
  },
  addSvcSearchInput: {flex: 1, fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', padding: 0},
  addSvcCartBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: sw(16),
    marginBottom: sw(6),
    backgroundColor: 'rgba(16,86,65,0.07)',
    borderRadius: sw(8),
    paddingHorizontal: sw(12),
    paddingVertical: sw(7),
  },
  addSvcCartText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#105641', fontWeight: '600'},
  addSvcCartPrice: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#105641'},
  addSvcListContent: {paddingHorizontal: sw(16), paddingTop: sw(4), paddingBottom: sw(8), gap: sw(8)},
  addSvcItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: sw(10),
    padding: sw(12),
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: sw(10),
  },
  addSvcItemSelected: {borderColor: '#105641', backgroundColor: 'rgba(16,86,65,0.05)'},
  addSvcItemName: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '500', marginBottom: sw(2)},
  addSvcItemNameSelected: {color: '#105641', fontWeight: '700'},
  addSvcItemMeta: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#5C5C5C'},
  addSvcInlineQty: {flexDirection: 'row', alignItems: 'center', gap: sw(6)},
  addSvcInlineQtyNum: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#105641', minWidth: sw(20), textAlign: 'center'},
  addSvcEmptyText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#888', textAlign: 'center', paddingVertical: sw(32)},
  addSvcFooter: {
    flexDirection: 'row',
    gap: sw(10),
    paddingHorizontal: sw(16),
    paddingTop: sw(12),
    borderTopWidth: 1,
    borderTopColor: '#EEEDED',
  },
  addSvcCancelBtn: {flex: 1, height: sw(46), borderRadius: sw(10), borderWidth: 1.5, borderColor: '#EEEDED', alignItems: 'center', justifyContent: 'center'},
  addSvcCancelText: {fontFamily: fonts.textFont, fontSize: sw(13), fontWeight: '600', color: '#5C5C5C'},
  addSvcConfirmBtn: {flex: 2, height: sw(46), borderRadius: sw(10), backgroundColor: '#105641', alignItems: 'center', justifyContent: 'center'},
  addSvcConfirmBtnDisabled: {backgroundColor: '#AAAAAA'},
  addSvcConfirmText: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#FFFFFF'},

  /* ── Minimum booking amount banner ── */
  minAmountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    backgroundColor: '#FEF3C7',
    paddingHorizontal: sw(16),
    paddingVertical: sw(8),
  },
  minAmountText: {
    flex: 1,
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#B45309',
    fontWeight: '600',
  },

  /* ── Bottom bar ── */
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#105641',
    paddingHorizontal: sw(16),
    paddingTop: sw(8),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomPrice: {fontFamily: fonts.textFont, fontSize: sw(20), fontWeight: '700', color: '#012823'},
  bottomSubRow: {flexDirection: 'row', alignItems: 'center', gap: sw(4)},
  bottomSub: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#454545'},
  continueBtn: {
    backgroundColor: '#105641',
    borderRadius: sw(32),
    paddingVertical: sw(12),
    paddingHorizontal: sw(8),
    width: sw(174),
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '700', color: '#FFFFFF'},
});

export default AddressPaymentScreen;
