import React, {useState, useCallback, useEffect} from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar, Modal, TextInput, FlatList,
  ActivityIndicator, Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';
import networkCall from '../../utils/networkCall';
import api from '../../utils/api';
import {endpoints} from '../../config/config';
import {resolveImageUrl, formatAmount} from '../../utils/utils';
import {useAppAlert} from '../../hooks/useAppAlert';
import AppAlertModal from '../../components/AppAlertModal/AppAlertModal';
import SwipeToConfirm from '../../components/SwipeToConfirm/SwipeToConfirm';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=90&fit=crop';

const parseServices = (s: any): any[] => {
  if (Array.isArray(s)) return s;
  if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
  return [];
};

// Local working copy of each service line tags its origin: `_origIndex` points back
// into the server's last-saved `services` array (null if it was added locally this
// session and never saved yet), and `_removed` soft-marks a deletion so we can diff
// against the baseline at save time instead of guessing from array positions.
const tagWithOrigIndex = (svcs: any[]) => svcs.map((s, i) => ({...s, _origIndex: i, _removed: false}));

const JobChecklistScreen = ({navigation, route}: any) => {
  const insets = useSafeAreaInsets();
  const [job, setJob] = useState<any>(route?.params?.job ?? null);
  const [services, setServices] = useState<any[]>(() => tagWithOrigIndex(parseServices(route?.params?.job?.services)));
  const [totalAmount, setTotalAmount] = useState<number>(Number(route?.params?.job?.totalAmount ?? 0));
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);

  // Start-service OTP — the 4-digit code the customer reads off their booking. The
  // job cannot move to in_progress until the backend has checked it.
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // The gate on "Start Service". Read off the booking rather than kept as its own
  // flag, so a job already verified in an earlier session comes back in past this
  // step. A job with no id is a local/preview one that was never persisted — there's
  // nothing to verify against, so it keeps its old straight-to-start behaviour.
  const needsOtp = !!job?.id && !job?.otpVerifiedAt;

  const openOtpModal = () => {
    setOtp('');
    setOtpError('');
    setShowOtpModal(true);
  };

  // Arriving from "Reached to Customer Location" on the job details screen — go
  // straight to the OTP prompt, the next step in the flow. Skipped when this booking
  // is already verified (the partner backed out and came in again) so the code isn't
  // asked for twice. Entry only: re-running this would trap the partner in the sheet.
  useEffect(() => {
    if (route?.params?.promptOtp && needsOtp) openOtpModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add Service modal — pick from the catalog, pick a combo/package, or key in a
  // free-form add-on charge. Combo and package picking reuse the same state/handlers
  // as the standalone Add Package modal below (same underlying `/packages` API,
  // split by packageType: 'fixed' = combo, 'flexible' = package).
  const [showModal, setShowModal] = useState(false);
  const [addMode, setAddMode] = useState<'catalog' | 'combo' | 'package' | 'addon'>('catalog');
  const [allServices, setAllServices] = useState<any[]>([]);
  const [loadingSvcs, setLoadingSvcs] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSvc, setSelectedSvc] = useState<any>(null);
  const [addQty, setAddQty] = useState(1);
  const [addonName, setAddonName] = useState('');
  const [addonPrice, setAddonPrice] = useState('');
  const {alertConfig, showAlert, hideAlert} = useAppAlert();

  // Add Package modal — fixed packages apply their fixed service list immediately;
  // flexible packages need the partner to pick `serviceCount` services first.
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [loadingPkgs, setLoadingPkgs] = useState(false);
  const [pickingPackage, setPickingPackage] = useState<any>(null);
  const [flexiblePicks, setFlexiblePicks] = useState<number[]>([]);
  const [addingPkg, setAddingPkg] = useState(false);
  const [removingPkgId, setRemovingPkgId] = useState<number | null>(null);

  const fetchAllServices = useCallback(async () => {
    setLoadingSvcs(true);
    const svcPath = endpoints.SERVICES.replace(/^\//, '');
    const result = await networkCall(`${svcPath}?limit=500`, 'GET');
    const raw = result.response?.data ?? result.response ?? [];
    setAllServices(Array.isArray(raw) ? raw : []);
    setLoadingSvcs(false);
  }, []);

  const openModal = () => {
    setAddMode('catalog');
    setSelectedSvc(null); setAddQty(1); setSearch('');
    setAddonName(''); setAddonPrice('');
    setPickingPackage(null); setFlexiblePicks([]);
    if (allServices.length === 0) fetchAllServices();
    fetchPackages();
    setShowModal(true);
  };

  // Add a catalog service to the local list — carries its category's commission
  // split so it's visible immediately, before the change is even saved.
  const handleAddService = () => {
    if (!selectedSvc) return;
    const newSvc = {
      serviceId: selectedSvc.id,
      name: selectedSvc.name,
      price: parseFloat(selectedSvc.basePrice),
      qty: addQty,
      duration: selectedSvc.duration || null,
      image: selectedSvc.image || null,
      addedByPartner: true,
      adminPercent: selectedSvc.category?.adminPercent != null ? parseFloat(selectedSvc.category.adminPercent) : undefined,
      partnerPercent: selectedSvc.category?.partnerPercent != null ? parseFloat(selectedSvc.category.partnerPercent) : undefined,
      gstPercent: selectedSvc.category?.gstPercent != null ? parseFloat(selectedSvc.category.gstPercent) : undefined,
      _origIndex: null,
      _removed: false,
    };
    setServices(prev => [...prev, newSvc]);
    setShowModal(false);
  };

  // Add a free-form add-on charge (no catalog service backing it)
  const handleAddAddon = () => {
    const price = parseFloat(addonPrice);
    if (!addonName.trim() || !(price >= 0)) return;
    const newAddon = {
      name: addonName.trim(),
      price,
      qty: addQty,
      isAddOn: true,
      addedByPartner: true,
      _origIndex: null,
      _removed: false,
    };
    setServices(prev => [...prev, newAddon]);
    setShowModal(false);
  };

  // Edit qty of existing service (by position in the local array)
  const updateQty = (idx: number, delta: number) => {
    setServices(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const newQty = Math.max(1, (s.qty || 1) + delta);
      return {...s, qty: newQty};
    }));
  };

  // Delete a service — soft-remove if it's already saved on the booking (so we can
  // tell the server which index to drop), or just drop it locally if it was only
  // added this session and never saved.
  const deleteService = (idx: number) => {
    showAlert('Remove Service', `Remove "${services[idx]?.name}" from this booking?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Remove', style: 'destructive', onPress: () =>
        setServices(prev => {
          const target = prev[idx];
          if (target._origIndex == null) return prev.filter((_, i) => i !== idx);
          return prev.map((s, i) => i === idx ? {...s, _removed: true} : s);
        })},
    ]);
  };

  const visibleServices = services.filter(s => !s._removed);

  // Group items that were part of a package/combo into a single card instead of
  // listing each of their services as its own line — matching the customer app/website.
  const packageItems = visibleServices.filter(s => s.addedByPackage);
  const otherVisibleServices = visibleServices.filter(s => !s.addedByPackage);
  const otherVisibleTotal = otherVisibleServices.reduce((sum, s) => sum + (s.price ?? 0) * (s.qty || 1), 0);
  const multiPackages: any[] = parseServices(job?.packages);
  const packageGroups = multiPackages.length > 0
    ? multiPackages.map((pkg: any) => ({
        key: pkg.packageId,
        title: pkg.title,
        price: Number(pkg.price || 0) * (pkg.qty || 1),
        items: packageItems.filter((s: any) => s.packageId === pkg.packageId),
      }))
    : packageItems.length > 0
      ? [{
          key: job?.packageId,
          title: job?.package?.title ?? 'Package Deal',
          price: Math.max(0, (job?.baseAmount ?? totalAmount) - otherVisibleTotal),
          items: packageItems,
        }]
      : [];

  // Total, on the same basis as the rows listed above it: a package is billed at its own
  // price (₹999 for "Any 3 @ ₹999"), not the sum of its services' à-la-carte prices. This
  // used to sum every visible service, so a package booking's services were counted at
  // their individual prices — NLR2600041 showed ₹2,056 (360+899+699, +5%) against a real
  // total of ₹1,049, while the package card right above it correctly read ₹999.
  const packagesTotal = packageGroups.reduce((sum, g) => sum + (Number(g.price) || 0), 0);
  const coupon = parseFloat(job?.couponDiscountAmount || 0);
  const taxable = packagesTotal + otherVisibleTotal - coupon;
  const tax = taxable * 0.05; // GST — backend recomputes the authoritative weighted rate on submit
  const displayTotal = parseFloat((taxable + tax).toFixed(2));

  // A package already on the booking can't be added again (the backend rejects it) —
  // filter it out of the picker up front instead of letting the partner hit that error.
  const existingPackageIds = new Set<number>([
    ...(job?.packageId != null ? [job.packageId] : []),
    ...multiPackages.map((p: any) => p.packageId),
  ]);
  const addablePackages = availablePackages.filter((p: any) => !existingPackageIds.has(p.id));

  // Same split, for the Combos / Packages tabs inside the Add Service modal —
  // 'fixed' packages are marketed as combos, 'flexible' ones as (custom) packages.
  const addableCombos = addablePackages.filter((p: any) => p.packageType === 'fixed');
  const addablePackagesOnly = addablePackages.filter((p: any) => p.packageType === 'flexible');
  const allCombosCount = availablePackages.filter((p: any) => p.packageType === 'fixed').length;
  const allPackagesOnlyCount = availablePackages.filter((p: any) => p.packageType === 'flexible').length;

  // Diff against the last-saved baseline to build the API payload
  const pendingAdds = services.filter(s => s._origIndex == null && !s._removed);
  const pendingRemoveIndices = services.filter(s => s._origIndex != null && s._removed).map(s => s._origIndex);
  const pendingQtyChanges = services.filter(s => {
    if (s._origIndex == null || s._removed) return false;
    const original = parseServices(job?.services)[s._origIndex];
    return original && Number(original.qty || 1) !== Number(s.qty || 1);
  }).map(s => ({index: s._origIndex, qty: s.qty}));
  const hasChanges = pendingAdds.length > 0 || pendingRemoveIndices.length > 0 || pendingQtyChanges.length > 0;

  // Save changes immediately — no customer approval, applies straight to the booking.
  const handleSaveChanges = async () => {
    if (!job?.id) return;
    setSaving(true);
    try {
      const servicesPayload = pendingAdds.map(item =>
        item.isAddOn
          ? {isAddOn: true, name: item.name, price: item.price, qty: item.qty || 1}
          : {id: item.serviceId, qty: item.qty || 1}
      );
      const res = await api.patch(endpoints.PARTNER_EXTRA_SERVICES(String(job.id)), {
        services: servicesPayload,
        removeIndices: pendingRemoveIndices,
        updateQty: pendingQtyChanges,
      });
      if (res.data?.status) {
        const updated = res.data.data;
        const freshServices = parseServices(updated.services);
        setServices(tagWithOrigIndex(freshServices));
        setTotalAmount(parseFloat(updated.totalAmount ?? 0));
        setJob((prev: any) => ({...prev, services: updated.services, totalAmount: updated.totalAmount}));
      }
    } catch (e: any) {
      showAlert('Error', e.response?.data?.message ?? 'Failed to save changes.');
    }
    setSaving(false);
  };

  // Pulls a fresh booking (post add/remove-package) back into local state — same
  // shape handleSaveChanges applies after its own save.
  const syncFromBooking = (updated: any) => {
    setServices(tagWithOrigIndex(parseServices(updated.services)));
    setTotalAmount(parseFloat(updated.totalAmount ?? 0));
    setJob((prev: any) => ({...prev, services: updated.services, packages: updated.packages, packageId: updated.packageId, totalAmount: updated.totalAmount, partnerEarning: updated.partnerEarning, taxAmount: updated.taxAmount}));
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
    fetchPackages();
    setShowAddPackageModal(true);
  };

  const submitAddPackage = async (packageId: number, items: {id: number; qty: number}[]) => {
    if (!job?.id) return;
    setAddingPkg(true);
    try {
      const res = await api.patch(endpoints.PARTNER_ADD_PACKAGE(String(job.id)), {packageId, services: items});
      if (res.data?.status) {
        syncFromBooking(res.data.data);
        // Closes whichever modal is currently driving this add — the standalone Add
        // Package modal, or the Combos/Packages tab inside the Add Service modal.
        setShowAddPackageModal(false);
        setShowModal(false);
        setPickingPackage(null);
        setFlexiblePicks([]);
      }
    } catch (e: any) {
      showAlert('Error', e.response?.data?.message ?? 'Failed to add package. Please try again.');
    }
    setAddingPkg(false);
  };

  const handleAddFixedPackage = (pkg: any) => {
    const items = (pkg.services || []).map((s: any) => ({id: s.serviceId ?? s.id, qty: 1}));
    submitAddPackage(pkg.id, items);
  };

  const handlePickFlexible = (pkg: any) => {
    setPickingPackage(pkg);
    setFlexiblePicks([]);
    if (allServices.length === 0) fetchAllServices();
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

  const handleRemovePackage = (packageId: number | null, title: string) => {
    if (!job?.id) return;
    showAlert('Remove Package', `Remove "${title}" from this booking? Its services will be dropped and any remaining services will be billed at their normal price.`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Remove', style: 'destructive', onPress: async () => {
        setRemovingPkgId(packageId ?? -1);
        try {
          const res = await api.patch(endpoints.PARTNER_REMOVE_PACKAGE(String(job.id)), {packageId});
          if (res.data?.status) syncFromBooking(res.data.data);
        } catch (e: any) {
          showAlert('Error', e.response?.data?.message ?? 'Failed to remove package. Please try again.');
        }
        setRemovingPkgId(null);
      }},
    ]);
  };

  // Step 2 of "reached → OTP → start": the sheet now only *verifies* the customer's
  // code, it no longer starts the job. Starting is a separate deliberate swipe
  // afterwards, so the partner gets a last look at the checklist in between.
  const handleVerifyOtp = async () => {
    if (!/^\d{4}$/.test(otp)) {
      setOtpError('Enter the 4-digit code from the customer.');
      return;
    }
    setVerifyingOtp(true);
    setOtpError('');
    try {
      const res = await api.post(endpoints.PARTNER_VERIFY_OTP(String(job.id)), {otp});
      // Mirror the server's own timestamp so a later reload of this booking agrees
      // with what the screen is showing. Verification is idempotent server-side, so
      // a retry after a dropped response still lands here rather than failing.
      const verifiedAt = res.data?.data?.otpVerifiedAt ?? new Date().toISOString();
      setJob((prev: any) => ({...prev, otpVerifiedAt: verifiedAt}));
      setShowOtpModal(false);
      setOtp('');
    } catch (e: any) {
      // Wrong code, or too many tries — keep the sheet open so it can be retyped.
      setOtpError(e.response?.data?.message ?? 'Could not verify the OTP. Please try again.');
    }
    setVerifyingOtp(false);
  };

  // Step 3: the booking only ever moves to "in_progress" here, and only after the OTP
  // is verified. The backend enforces the same rule on this call (403 without
  // otpVerifiedAt), so the steps can't be reordered or the first one skipped — if
  // verification is somehow missing, reopen the sheet rather than fire a doomed
  // request. A job with no id is a local/preview one that was never persisted, so
  // there's nothing to verify or start against.
  const handleStartService = async () => {
    if (!job?.id) {
      navigation.navigate('ActiveJob', {job: {...job, services: visibleServices, totalAmount}});
      return;
    }
    if (needsOtp) { openOtpModal(); return; }

    setStarting(true);
    try {
      await api.patch(endpoints.PARTNER_BOOKING_STATUS(String(job.id)), {status: 'in_progress'});
      navigation.navigate('ActiveJob', {job: {...job, services: visibleServices, totalAmount, status: 'in_progress'}});
    } catch (e: any) {
      showAlert('Error', e.response?.data?.message ?? 'Failed to start service. Please try again.');
    }
    setStarting(false);
  };

  // Derived
  const orderId      = job?.bookingCode ?? `#${String(job?.id ?? '').slice(-8).toUpperCase()}`;
  const customerName = job?.user?.name ?? job?.userName ?? 'Customer';
  const customerPhone = job?.user?.phone ?? job?.userId?.phone ?? job?.userPhone ?? null;
  const scheduledAt  = job?.scheduledAt
    ? new Date(job.scheduledAt).toLocaleString('en-IN', {
        weekday: 'short', day: '2-digit', month: 'long',
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
    : '—';
  const earnings     = Number(job?.partnerEarning ?? totalAmount);
  const notes        = job?.notes ?? '';
  const jobTaxAmount = Number(job?.taxAmount ?? 0);
  // What's left after the partner's share and GST (a pass-through, not part of the
  // admin/partner split) is the admin's commission — only meaningful against the
  // booking's last-saved figures, not an unsent local edit (no live recalculation here).
  const adminCommission = Math.max(0, totalAmount - jobTaxAmount - earnings);

  const filteredSvcs = allServices.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()));

  const commissionLine = (svc: any) =>
    svc.adminPercent != null && svc.partnerPercent != null && svc.gstPercent != null
      ? `Admin ${svc.adminPercent}% · Partner ${svc.partnerPercent}% · GST ${svc.gstPercent}%`
      : null;

  // Combo/Package picker body for the Add Service modal's "Combos"/"Packages" tabs —
  // same list card, "Add"/"Choose →" actions, and flexible-pick sub-view as the
  // standalone Add Package modal below, just scoped to one packageType at a time.
  const renderPackagePickerBody = (list: any[], totalOfKind: number, kindLabel: string) => (
    !pickingPackage ? (
      loadingPkgs ? (
        <ActivityIndicator color="#105641" style={{marginVertical: sw(24)}} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={item => String(item.id)}
          style={{maxHeight: sw(300)}}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => (
            <View style={styles.pkgPickCard}>
              <View style={{flex: 1}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: sw(6)}}>
                  <Text style={styles.pickName}>{item.title}</Text>
                  <View style={[styles.pkgTypeBadge, item.packageType === 'fixed' ? styles.pkgTypeBadgeFixed : styles.pkgTypeBadgeFlex]}>
                    <Text style={[styles.pkgTypeBadgeText, {color: item.packageType === 'fixed' ? '#105641' : '#1D4ED8'}]}>
                      {item.packageType === 'fixed' ? 'FIXED' : 'FLEXIBLE'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.pickMeta}>
                  {item.packageType === 'fixed'
                    ? `${(item.services || []).length} services`
                    : `Pick any ${item.serviceCount} services`}
                  {'  ·  '}₹{formatAmount(item.price)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.pkgAddBtn}
                disabled={addingPkg}
                onPress={() => item.packageType === 'fixed' ? handleAddFixedPackage(item) : handlePickFlexible(item)}
                activeOpacity={0.85}>
                <Text style={styles.pkgAddBtnText}>
                  {item.packageType === 'fixed' ? (addingPkg ? 'Adding…' : 'Add') : 'Choose →'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyPick}>
              {totalOfKind === 0
                ? `No ${kindLabel} available`
                : `All available ${kindLabel} are already on this booking`}
            </Text>
          }
        />
      )
    ) : (
      <>
        <View style={styles.pkgProgressRow}>
          <Text style={styles.qtyLabel}>Pick {pickingPackage.serviceCount} service{pickingPackage.serviceCount !== 1 ? 's' : ''}</Text>
          <Text style={[styles.qtyLabel, {fontWeight: '700', color: flexiblePicks.length === pickingPackage.serviceCount ? '#105641' : '#171816'}]}>
            {flexiblePicks.length} / {pickingPackage.serviceCount}
          </Text>
        </View>
        {loadingSvcs ? (
          <ActivityIndicator color="#105641" style={{marginVertical: sw(24)}} />
        ) : (
          <FlatList
            data={allServices.filter((s: any) => !pickingPackage.categoryId || s.categoryId === pickingPackage.categoryId)}
            keyExtractor={item => String(item.id)}
            style={{maxHeight: sw(260)}}
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => {
              const picked = flexiblePicks.includes(item.id);
              const disabled = !picked && flexiblePicks.length >= pickingPackage.serviceCount;
              return (
                <TouchableOpacity
                  style={[styles.svcPickRow, picked && styles.svcPickRowSel, disabled && {opacity: 0.4}]}
                  disabled={disabled}
                  onPress={() => toggleFlexiblePick(item.id)} activeOpacity={0.8}>
                  <Image source={{uri: resolveImageUrl(item.image) ?? FALLBACK_IMG}} style={styles.pickImg} resizeMode="cover" />
                  <View style={{flex: 1}}>
                    <Text style={styles.pickName}>{item.name}</Text>
                    <Text style={styles.pickMeta}>
                      {item.duration ? `${item.duration} min  ·  ` : ''}₹{formatAmount(item.basePrice)}
                    </Text>
                  </View>
                  {picked && <Ionicons name="checkmark-circle" size={sw(22)} color="#105641" />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<Text style={styles.emptyPick}>No services found</Text>}
          />
        )}
        <View style={{flexDirection: 'row', gap: sw(10), marginTop: sw(14)}}>
          <TouchableOpacity style={styles.pkgBackBtn} onPress={() => setPickingPackage(null)} activeOpacity={0.85}>
            <Text style={styles.pkgBackBtnText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, {flex: 1, marginTop: 0}, (flexiblePicks.length !== pickingPackage.serviceCount || addingPkg) && {opacity: 0.5}]}
            disabled={flexiblePicks.length !== pickingPackage.serviceCount || addingPkg}
            onPress={handleConfirmFlexiblePackage} activeOpacity={0.88}>
            {addingPkg ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
              <Text style={styles.confirmBtnText}>Add Package (₹{formatAmount(pickingPackage.price)})</Text>
            )}
          </TouchableOpacity>
        </View>
      </>
    )
  );

  return (
    <View style={[styles.root, {paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor="#022723" />

      <LinearGradient colors={['#0E5843', '#022723']}
        style={[styles.header, {paddingTop: insets.top + sw(12)}]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={sw(20)} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{flex: 1, marginLeft: sw(10)}}>
          <Text style={styles.headerTitle}>Review Order</Text>
          <Text style={styles.headerSub}>{orderId}</Text>
        </View>
        <TouchableOpacity style={styles.addServiceBtn} onPress={openModal} activeOpacity={0.85}>
          <Ionicons name="add" size={sw(16)} color="#FDD77A" />
          <Text style={styles.addServiceText}>Add Service</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: sw(16), gap: sw(14), paddingBottom: sw(120)}}>

        {/* Schedule */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconBox, {backgroundColor: '#EAF5F0'}]}>
              <Ionicons name="calendar" size={sw(18)} color="#105641" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Scheduled</Text>
              <Text style={styles.value}>{scheduledAt}</Text>
            </View>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{customerName[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.value}>{customerName}</Text>
              {customerPhone && <Text style={styles.sub}>{customerPhone}</Text>}
            </View>
            {customerPhone && (
              <TouchableOpacity style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${customerPhone}`)} activeOpacity={0.8}>
                <Ionicons name="call" size={sw(18)} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Services — editable, applies immediately on Save (no customer approval) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>
              Services ({visibleServices.length})
            </Text>
            <View style={{flexDirection: 'row', gap: sw(8)}}>
              <TouchableOpacity style={styles.addInlineBtn} onPress={openAddPackageModal} activeOpacity={0.85}>
                <Ionicons name="gift-outline" size={sw(14)} color="#105641" />
                <Text style={styles.addInlineText}>Add Package</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addInlineBtn} onPress={openModal} activeOpacity={0.85}>
                <Ionicons name="add-circle-outline" size={sw(14)} color="#105641" />
                <Text style={styles.addInlineText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {visibleServices.length === 0 && (
            <Text style={styles.emptyServices}>No services. Tap Add to include services.</Text>
          )}

          {packageGroups.map((group) => (
            <View key={group.key ?? group.title} style={[styles.svcRow, {alignItems: 'flex-start'}]}>
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
                <TouchableOpacity
                  onPress={() => handleRemovePackage(group.key, group.title)}
                  disabled={removingPkgId != null}
                  style={styles.removePkgBtn}>
                  <Text style={styles.removePkgBtnText}>
                    {removingPkgId === (group.key ?? -1) ? 'Removing…' : 'Remove Package'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.svcPrice}>₹{formatAmount(group.price)}</Text>
            </View>
          ))}

          {services.map((svc: any, idx: number) => {
            if (svc._removed || svc.addedByPackage) return null;
            const imgUri = resolveImageUrl(svc.image) ?? FALLBACK_IMG;
            const isFree = svc.addedByOffer || svc.price === 0;
            const commission = commissionLine(svc);
            return (
              <View key={idx} style={[styles.svcRow, idx > 0 && styles.svcBorder]}>
                {svc.isAddOn ? (
                  <View style={[styles.svcImg, styles.addonIconBox]}>
                    <Ionicons name="pricetag-outline" size={sw(20)} color="#C87B1A" />
                  </View>
                ) : (
                  <Image source={{uri: imgUri}} style={styles.svcImg} resizeMode="cover" />
                )}
                <View style={{flex: 1}}>
                  <View style={styles.svcNameRow}>
                    <Text style={styles.svcName} numberOfLines={1}>{svc.name}</Text>
                    {svc.isAddOn && (
                      <View style={styles.addonBadge}><Text style={styles.addonBadgeText}>Add-on</Text></View>
                    )}
                    {svc.addedByPartner && (
                      <View style={styles.addedBadge}><Text style={styles.addedBadgeText}>Added</Text></View>
                    )}
                    {isFree && (
                      <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>
                    )}
                  </View>
                  {commission && <Text style={styles.commissionText}>{commission}</Text>}
                  {/* Qty stepper */}
                  {!isFree && (
                    <View style={styles.qtyStepper}>
                      <TouchableOpacity onPress={() => updateQty(idx, -1)} style={styles.qtyBtn}>
                        <Ionicons name="remove" size={sw(14)} color="#105641" />
                      </TouchableOpacity>
                      <Text style={styles.qtyVal}>{svc.qty || 1}</Text>
                      <TouchableOpacity onPress={() => updateQty(idx, 1)} style={styles.qtyBtn}>
                        <Ionicons name="add" size={sw(14)} color="#105641" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <View style={{alignItems: 'flex-end', gap: sw(6)}}>
                  <Text style={[styles.svcPrice, isFree && {color: '#9CA3AF'}]}>
                    {isFree ? 'FREE' : `₹${formatAmount(svc.price * (svc.qty || 1))}`}
                  </Text>
                  <TouchableOpacity onPress={() => deleteService(idx)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                    <Ionicons name="trash-outline" size={sw(16)} color="#DB1919" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{hasChanges ? 'New Total' : 'Total'}</Text>
            <Text style={[styles.totalValue, hasChanges && {color: '#C87B1A'}]}>
              ₹{formatAmount(displayTotal)}
              {hasChanges && ' *'}
            </Text>
          </View>
          {hasChanges && (
            <Text style={styles.changesNote}>* Unsaved changes. Tap "Save Changes" below.</Text>
          )}
        </View>

        {/* Earnings */}
        <LinearGradient colors={['#0E5843', '#022723']} style={styles.earningsCard}
          start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
          <View style={styles.earningsTopRow}>
            <View>
              <Text style={styles.earningsLabel}>Your Earnings</Text>
              <Text style={styles.earningsValue}>₹{formatAmount(hasChanges ? displayTotal : earnings)}</Text>
            </View>
            <Ionicons name="cash-outline" size={sw(40)} color="rgba(255,255,255,0.2)" />
          </View>
          {!hasChanges && (
            <View style={styles.earningsBreakdown}>
              <View style={styles.earningsBreakdownRow}>
                <Text style={styles.earningsBreakdownLabel}>Total Booking Amount</Text>
                <Text style={styles.earningsBreakdownVal}>₹{formatAmount(totalAmount)}</Text>
              </View>
              {jobTaxAmount > 0 && (
                <View style={styles.earningsBreakdownRow}>
                  <Text style={styles.earningsBreakdownLabel}>GST (pass-through)</Text>
                  <Text style={styles.earningsBreakdownVal}>–₹{formatAmount(jobTaxAmount)}</Text>
                </View>
              )}
              <View style={styles.earningsBreakdownRow}>
                <Text style={styles.earningsBreakdownLabel}>Admin Commission</Text>
                <Text style={styles.earningsBreakdownVal}>–₹{formatAmount(adminCommission)}</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Notes */}
        {!!notes && (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.iconBox, {backgroundColor: '#F5F5F5'}]}>
                <Ionicons name="document-text-outline" size={sw(18)} color="#5C5C5C" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.label}>Customer Notes</Text>
                <Text style={styles.value}>{notes}</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + sw(8)}]}>
        {hasChanges ? (
          <TouchableOpacity style={[styles.btn, styles.btnWarning, saving && {opacity: 0.6}]}
            onPress={handleSaveChanges} disabled={saving} activeOpacity={0.88}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : (
              <><Ionicons name="checkmark-circle-outline" size={sw(18)} color="#FFFFFF" />
              <Text style={styles.btnText}>Save Changes</Text></>
            )}
          </TouchableOpacity>
        ) : needsOtp ? (
          // "Start Service" isn't offered until the customer's code is verified. This
          // swipe reopens that step instead of sitting there as a dead disabled
          // button — the partner who dismissed the sheet needs a way back into it.
          <SwipeToConfirm
            label="Verify Customer OTP"
            onConfirm={openOtpModal}
          />
        ) : (
          <SwipeToConfirm
            label="Start Service"
            onConfirm={handleStartService}
            disabled={starting}
            loading={starting}
          />
        )}
      </View>

      {/* Start-Service OTP Modal — the customer reads the code off their booking in
          the Beyomo app. Verification only: passing it unlocks the "Start Service"
          swipe below rather than starting the job outright. No dismiss-on-backdrop
          here, so a stray tap can't silently drop the partner out of the step. */}
      <Modal visible={showOtpModal} animationType="slide" transparent onRequestClose={() => setShowOtpModal(false)}>
        <View style={styles.overlay} />
        <View style={[styles.sheet, {paddingBottom: insets.bottom + sw(16)}]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Enter Customer OTP</Text>
          <Text style={styles.otpSubtitle}>
            Ask the customer for the 4-digit code shown on their booking. The service
            can't be started without it.
          </Text>

          <TextInput
            style={[styles.otpInput, !!otpError && styles.otpInputError]}
            value={otp}
            onChangeText={t => { setOtp(t.replace(/\D/g, '').slice(0, 4)); setOtpError(''); }}
            keyboardType="number-pad"
            maxLength={4}
            autoFocus
            placeholder="––––"
            placeholderTextColor="#C4C4C4"
            editable={!verifyingOtp}
          />

          {!!otpError && <Text style={styles.otpErrorText}>{otpError}</Text>}

          <TouchableOpacity
            style={[styles.btn, styles.otpVerifyBtn, (verifyingOtp || otp.length !== 4) && {opacity: 0.6}]}
            onPress={handleVerifyOtp}
            disabled={verifyingOtp || otp.length !== 4}
            activeOpacity={0.88}>
            {verifyingOtp ? <ActivityIndicator color="#FFFFFF" /> : (
              <><Ionicons name="checkmark-circle-outline" size={sw(18)} color="#FFFFFF" />
              <Text style={styles.btnText}>Verify OTP</Text></>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.otpCancelBtn}
            onPress={() => setShowOtpModal(false)}
            disabled={verifyingOtp}
            activeOpacity={0.7}>
            <Text style={styles.otpCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Add Service Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowModal(false)} />
        <View style={[styles.sheet, {paddingBottom: insets.bottom + sw(16)}]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>
            {addMode === 'package' && pickingPackage ? pickingPackage.title : 'Add a Service'}
          </Text>

          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeToggleBtn, addMode === 'catalog' && styles.modeToggleBtnActive]}
              onPress={() => setAddMode('catalog')} activeOpacity={0.85}>
              <Text style={[styles.modeToggleText, addMode === 'catalog' && styles.modeToggleTextActive]}>From Catalog</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeToggleBtn, addMode === 'combo' && styles.modeToggleBtnActive]}
              onPress={() => setAddMode('combo')} activeOpacity={0.85}>
              <Text style={[styles.modeToggleText, addMode === 'combo' && styles.modeToggleTextActive]}>Combos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeToggleBtn, addMode === 'package' && styles.modeToggleBtnActive]}
              onPress={() => setAddMode('package')} activeOpacity={0.85}>
              <Text style={[styles.modeToggleText, addMode === 'package' && styles.modeToggleTextActive]}>Packages</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeToggleBtn, addMode === 'addon' && styles.modeToggleBtnActive]}
              onPress={() => setAddMode('addon')} activeOpacity={0.85}>
              <Text style={[styles.modeToggleText, addMode === 'addon' && styles.modeToggleTextActive]}>Custom Add-on</Text>
            </TouchableOpacity>
          </View>

          {addMode === 'catalog' ? (
            <>
              <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={sw(16)} color="#9CA3AF" />
                <TextInput style={styles.searchInput} placeholder="Search services…"
                  placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} />
              </View>
              {loadingSvcs ? (
                <ActivityIndicator color="#105641" style={{marginVertical: sw(24)}} />
              ) : (
                <FlatList
                  data={filteredSvcs}
                  keyExtractor={item => String(item.id)}
                  style={{maxHeight: sw(260)}}
                  showsVerticalScrollIndicator={false}
                  renderItem={({item}) => {
                    const imgUri = resolveImageUrl(item.image) ?? FALLBACK_IMG;
                    const isSelected = selectedSvc?.id === item.id;
                    const commission = commissionLine(item.category ?? {});
                    return (
                      <TouchableOpacity style={[styles.svcPickRow, isSelected && styles.svcPickRowSel]}
                        onPress={() => setSelectedSvc(item)} activeOpacity={0.8}>
                        <Image source={{uri: imgUri}} style={styles.pickImg} resizeMode="cover" />
                        <View style={{flex: 1}}>
                          <Text style={styles.pickName}>{item.name}</Text>
                          <Text style={styles.pickMeta}>
                            {item.duration ? `${item.duration} min  ·  ` : ''}₹{formatAmount(item.basePrice)}
                          </Text>
                          {commission && <Text style={styles.pickCommission}>{commission}</Text>}
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={sw(22)} color="#105641" />}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={<Text style={styles.emptyPick}>No services found</Text>}
                />
              )}
              {selectedSvc && (
                <View style={styles.qtyRow}>
                  <Text style={styles.qtyLabel}>Quantity</Text>
                  <View style={styles.qtyStepper}>
                    <TouchableOpacity onPress={() => setAddQty(q => Math.max(1, q - 1))} style={styles.qtyBtn}>
                      <Ionicons name="remove" size={sw(16)} color="#105641" />
                    </TouchableOpacity>
                    <Text style={styles.qtyVal}>{addQty}</Text>
                    <TouchableOpacity onPress={() => setAddQty(q => q + 1)} style={styles.qtyBtn}>
                      <Ionicons name="add" size={sw(16)} color="#105641" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.qtyTotal}>₹{formatAmount(Number(selectedSvc.basePrice) * addQty)}</Text>
                </View>
              )}
              <TouchableOpacity style={[styles.confirmBtn, !selectedSvc && {opacity: 0.5}]}
                disabled={!selectedSvc} onPress={handleAddService} activeOpacity={0.88}>
                <Ionicons name="add-circle-outline" size={sw(18)} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>
                  {selectedSvc ? `Add "${selectedSvc.name}"` : 'Select a service'}
                </Text>
              </TouchableOpacity>
            </>
          ) : addMode === 'combo' ? (
            renderPackagePickerBody(addableCombos, allCombosCount, 'combos')
          ) : addMode === 'package' ? (
            renderPackagePickerBody(addablePackagesOnly, allPackagesOnlyCount, 'packages')
          ) : (
            <>
              <View style={styles.addonFieldWrap}>
                <Text style={styles.addonFieldLabel}>Label</Text>
                <TextInput
                  style={styles.addonInput}
                  placeholder="e.g. Extra stain removal"
                  placeholderTextColor="#9CA3AF"
                  value={addonName}
                  onChangeText={setAddonName}
                />
              </View>
              <View style={styles.addonFieldWrap}>
                <Text style={styles.addonFieldLabel}>Amount (₹)</Text>
                <TextInput
                  style={styles.addonInput}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={addonPrice}
                  onChangeText={setAddonPrice}
                />
              </View>
              <View style={styles.qtyRow}>
                <Text style={styles.qtyLabel}>Quantity</Text>
                <View style={styles.qtyStepper}>
                  <TouchableOpacity onPress={() => setAddQty(q => Math.max(1, q - 1))} style={styles.qtyBtn}>
                    <Ionicons name="remove" size={sw(16)} color="#105641" />
                  </TouchableOpacity>
                  <Text style={styles.qtyVal}>{addQty}</Text>
                  <TouchableOpacity onPress={() => setAddQty(q => q + 1)} style={styles.qtyBtn}>
                    <Ionicons name="add" size={sw(16)} color="#105641" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.qtyTotal}>₹{formatAmount((parseFloat(addonPrice) || 0) * addQty)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.confirmBtn, (!addonName.trim() || !(parseFloat(addonPrice) >= 0)) && {opacity: 0.5}]}
                disabled={!addonName.trim() || !(parseFloat(addonPrice) >= 0)}
                onPress={handleAddAddon} activeOpacity={0.88}>
                <Ionicons name="add-circle-outline" size={sw(18)} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>Add Add-on</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      {/* Add Package Modal */}
      <Modal visible={showAddPackageModal} animationType="slide" transparent onRequestClose={() => setShowAddPackageModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowAddPackageModal(false)} />
        <View style={[styles.sheet, {paddingBottom: insets.bottom + sw(16)}]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{pickingPackage ? pickingPackage.title : 'Add a Package'}</Text>

          {!pickingPackage ? (
            loadingPkgs ? (
              <ActivityIndicator color="#105641" style={{marginVertical: sw(24)}} />
            ) : (
              <FlatList
                data={addablePackages}
                keyExtractor={item => String(item.id)}
                style={{maxHeight: sw(360)}}
                showsVerticalScrollIndicator={false}
                renderItem={({item}) => (
                  <View style={styles.pkgPickCard}>
                    <View style={{flex: 1}}>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: sw(6)}}>
                        <Text style={styles.pickName}>{item.title}</Text>
                        <View style={[styles.pkgTypeBadge, item.packageType === 'fixed' ? styles.pkgTypeBadgeFixed : styles.pkgTypeBadgeFlex]}>
                          <Text style={[styles.pkgTypeBadgeText, {color: item.packageType === 'fixed' ? '#105641' : '#1D4ED8'}]}>
                            {item.packageType === 'fixed' ? 'FIXED' : 'FLEXIBLE'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.pickMeta}>
                        {item.packageType === 'fixed'
                          ? `${(item.services || []).length} services`
                          : `Pick any ${item.serviceCount} services`}
                        {'  ·  '}₹{formatAmount(item.price)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.pkgAddBtn}
                      disabled={addingPkg}
                      onPress={() => item.packageType === 'fixed' ? handleAddFixedPackage(item) : handlePickFlexible(item)}
                      activeOpacity={0.85}>
                      <Text style={styles.pkgAddBtnText}>
                        {item.packageType === 'fixed' ? (addingPkg ? 'Adding…' : 'Add') : 'Choose →'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyPick}>
                    {availablePackages.length === 0 ? 'No packages available' : 'All available packages are already on this booking'}
                  </Text>
                }
              />
            )
          ) : (
            <>
              <View style={styles.pkgProgressRow}>
                <Text style={styles.qtyLabel}>Pick {pickingPackage.serviceCount} service{pickingPackage.serviceCount !== 1 ? 's' : ''}</Text>
                <Text style={[styles.qtyLabel, {fontWeight: '700', color: flexiblePicks.length === pickingPackage.serviceCount ? '#105641' : '#171816'}]}>
                  {flexiblePicks.length} / {pickingPackage.serviceCount}
                </Text>
              </View>
              {loadingSvcs ? (
                <ActivityIndicator color="#105641" style={{marginVertical: sw(24)}} />
              ) : (
                <FlatList
                  data={allServices.filter((s: any) => !pickingPackage.categoryId || s.categoryId === pickingPackage.categoryId)}
                  keyExtractor={item => String(item.id)}
                  style={{maxHeight: sw(260)}}
                  showsVerticalScrollIndicator={false}
                  renderItem={({item}) => {
                    const picked = flexiblePicks.includes(item.id);
                    const disabled = !picked && flexiblePicks.length >= pickingPackage.serviceCount;
                    return (
                      <TouchableOpacity
                        style={[styles.svcPickRow, picked && styles.svcPickRowSel, disabled && {opacity: 0.4}]}
                        disabled={disabled}
                        onPress={() => toggleFlexiblePick(item.id)} activeOpacity={0.8}>
                        <Image source={{uri: resolveImageUrl(item.image) ?? FALLBACK_IMG}} style={styles.pickImg} resizeMode="cover" />
                        <View style={{flex: 1}}>
                          <Text style={styles.pickName}>{item.name}</Text>
                          <Text style={styles.pickMeta}>
                            {item.duration ? `${item.duration} min  ·  ` : ''}₹{formatAmount(item.basePrice)}
                          </Text>
                        </View>
                        {picked && <Ionicons name="checkmark-circle" size={sw(22)} color="#105641" />}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={<Text style={styles.emptyPick}>No services found</Text>}
                />
              )}
              <View style={{flexDirection: 'row', gap: sw(10), marginTop: sw(14)}}>
                <TouchableOpacity style={styles.pkgBackBtn} onPress={() => setPickingPackage(null)} activeOpacity={0.85}>
                  <Text style={styles.pkgBackBtnText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, {flex: 1, marginTop: 0}, (flexiblePicks.length !== pickingPackage.serviceCount || addingPkg) && {opacity: 0.5}]}
                  disabled={flexiblePicks.length !== pickingPackage.serviceCount || addingPkg}
                  onPress={handleConfirmFlexiblePackage} activeOpacity={0.88}>
                  {addingPkg ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
                    <Text style={styles.confirmBtnText}>Add Package (₹{formatAmount(pickingPackage.price)})</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      <AppAlertModal config={alertConfig} onRequestClose={hideAlert} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F4F6F8'},
  header: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: sw(16), paddingBottom: sw(16)},
  backBtn: {width: sw(36), height: sw(36), borderRadius: sw(18), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center'},
  headerTitle: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '700', color: '#FFFFFF'},
  headerSub: {fontFamily: fonts.textFont, fontSize: sw(11), color: 'rgba(255,255,255,0.6)', marginTop: sw(2)},
  addServiceBtn: {flexDirection: 'row', alignItems: 'center', gap: sw(5), borderWidth: 1.5, borderColor: 'rgba(253,215,122,0.6)', borderRadius: sw(20), paddingHorizontal: sw(12), paddingVertical: sw(6)},
  addServiceText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#FDD77A', fontWeight: '600'},

  card: {backgroundColor: '#FFFFFF', borderRadius: sw(16), padding: sw(14), gap: sw(10), elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.06, shadowRadius: 6},
  row: {flexDirection: 'row', alignItems: 'center', gap: sw(12)},
  iconBox: {width: sw(40), height: sw(40), borderRadius: sw(10), alignItems: 'center', justifyContent: 'center', flexShrink: 0},
  label: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#9CA3AF'},
  value: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '500', marginTop: sw(2)},
  sub: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#9CA3AF', marginTop: sw(2)},
  avatarCircle: {width: sw(44), height: sw(44), borderRadius: sw(22), backgroundColor: '#012823', alignItems: 'center', justifyContent: 'center', flexShrink: 0},
  avatarInitial: {fontFamily: fonts.title, fontSize: sw(18), fontWeight: '700', color: '#FDD77A'},
  callBtn: {width: sw(40), height: sw(40), borderRadius: sw(20), backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center'},

  cardHeaderRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  sectionTitle: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#171816'},
  addInlineBtn: {flexDirection: 'row', alignItems: 'center', gap: sw(4), borderWidth: 1, borderColor: '#105641', borderRadius: sw(20), paddingHorizontal: sw(10), paddingVertical: sw(4)},
  addInlineText: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#105641', fontWeight: '600'},
  emptyServices: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#9CA3AF', textAlign: 'center', paddingVertical: sw(8)},

  svcRow: {flexDirection: 'row', alignItems: 'center', gap: sw(12), paddingVertical: sw(8)},
  svcBorder: {borderTopWidth: 1, borderTopColor: '#F5F5F5'},
  svcImg: {width: sw(52), height: sw(52), borderRadius: sw(10), backgroundColor: '#E5E5E5', flexShrink: 0},
  addonIconBox: {alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF3E4'},
  svcNameRow: {flexDirection: 'row', alignItems: 'center', gap: sw(6), flexWrap: 'wrap'},
  svcName: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '600'},
  addedBadge: {backgroundColor: '#FEF3C7', borderRadius: sw(4), paddingHorizontal: sw(6), paddingVertical: sw(2)},
  addedBadgeText: {fontFamily: fonts.textFont, fontSize: sw(9), color: '#92400E', fontWeight: '700'},
  addonBadge: {backgroundColor: '#FFF3E4', borderRadius: sw(4), paddingHorizontal: sw(6), paddingVertical: sw(2)},
  addonBadgeText: {fontFamily: fonts.textFont, fontSize: sw(9), color: '#C87B1A', fontWeight: '700'},
  freeBadge: {backgroundColor: '#EAF5F0', borderRadius: sw(4), paddingHorizontal: sw(6), paddingVertical: sw(2)},
  freeBadgeText: {fontFamily: fonts.textFont, fontSize: sw(9), color: '#105641', fontWeight: '700'},
  commissionText: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#9CA3AF', marginTop: sw(2)},
  qtyStepper: {flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: sw(20), overflow: 'hidden', alignSelf: 'flex-start', marginTop: sw(6)},
  qtyBtn: {width: sw(28), height: sw(28), alignItems: 'center', justifyContent: 'center'},
  qtyVal: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#105641', minWidth: sw(24), textAlign: 'center'},
  svcPrice: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#105641'},
  packageBadge: {
    backgroundColor: '#E4E1D8', borderRadius: sw(4),
    paddingHorizontal: sw(5), paddingVertical: sw(1),
  },
  packageBadgeText: {fontFamily: fonts.textFont, fontSize: sw(11), fontWeight: '700', color: '#292524'},
  metaChipText: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#5C5C5C', marginTop: sw(2)},
  removePkgBtn: {
    alignSelf: 'flex-start', marginTop: sw(8),
    borderWidth: 1, borderColor: '#FCA5A5', borderRadius: sw(20),
    paddingHorizontal: sw(12), paddingVertical: sw(5),
  },
  removePkgBtnText: {fontFamily: fonts.textFont, fontSize: sw(10), fontWeight: '700', color: '#B91C1C', letterSpacing: 0.3},
  totalRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1.5, borderTopColor: '#F0F0F0', paddingTop: sw(10), marginTop: sw(2)},
  totalLabel: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#5C5C5C', fontWeight: '600'},
  totalValue: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '800', color: '#012823'},
  changesNote: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#C87B1A', textAlign: 'right'},

  earningsCard: {borderRadius: sw(16), padding: sw(16), gap: sw(12)},
  earningsTopRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  earningsLabel: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.7)', marginBottom: sw(4)},
  earningsValue: {fontFamily: fonts.title, fontSize: sw(28), fontWeight: '800', color: '#FFFFFF'},
  earningsBreakdown: {
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: sw(10), gap: sw(6),
  },
  earningsBreakdownRow: {flexDirection: 'row', justifyContent: 'space-between'},
  earningsBreakdownLabel: {fontFamily: fonts.textFont, fontSize: sw(11), color: 'rgba(255,255,255,0.65)'},
  earningsBreakdownVal: {fontFamily: fonts.textFont, fontSize: sw(11), color: 'rgba(255,255,255,0.9)', fontWeight: '600'},

  footer: {backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EEEDED', paddingHorizontal: sw(16), paddingTop: sw(12)},
  btn: {borderRadius: sw(14), overflow: 'hidden'},
  btnGradient: {height: sw(56), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sw(10)},
  btnWarning: {backgroundColor: '#C87B1A', height: sw(56), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sw(10)},
  btnText: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700', color: '#FFFFFF'},

  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet: {backgroundColor: '#FFFFFF', borderTopLeftRadius: sw(20), borderTopRightRadius: sw(20), paddingHorizontal: sw(16), paddingTop: sw(12), maxHeight: '85%'},
  handle: {width: sw(40), height: sw(4), borderRadius: sw(2), backgroundColor: '#D0D0D0', alignSelf: 'center', marginBottom: sw(14)},
  sheetTitle: {fontFamily: fonts.title, fontSize: sw(17), fontWeight: '700', color: '#171816', marginBottom: sw(14)},

  // Start-service OTP sheet
  otpSubtitle: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#6B6B6B', lineHeight: sw(19), marginTop: sw(-6), marginBottom: sw(16)},
  otpInput: {
    fontFamily: fonts.title,
    fontSize: sw(30),
    fontWeight: '700',
    color: '#171816',
    textAlign: 'center',
    letterSpacing: sw(14),
    height: sw(66),
    borderRadius: sw(12),
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    // letterSpacing pads the right of the last glyph too, which visually shifts the
    // text left of centre — this offsets it back.
    paddingLeft: sw(14),
  },
  otpInputError: {borderColor: '#D64545', backgroundColor: '#FEF5F5'},
  otpErrorText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#D64545', marginTop: sw(8)},
  otpVerifyBtn: {backgroundColor: '#105641', height: sw(56), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sw(10), marginTop: sw(18)},
  otpCancelBtn: {alignItems: 'center', paddingVertical: sw(14)},
  otpCancelText: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '600', color: '#6B6B6B'},

  modeToggle: {flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: sw(12), padding: sw(4), marginBottom: sw(14)},
  modeToggleBtn: {flex: 1, alignItems: 'center', paddingVertical: sw(9), borderRadius: sw(9)},
  modeToggleBtnActive: {backgroundColor: '#FFFFFF', elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.08, shadowRadius: 3},
  modeToggleText: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '600', color: '#9CA3AF'},
  modeToggleTextActive: {color: '#105641'},
  searchWrap: {flexDirection: 'row', alignItems: 'center', gap: sw(8), backgroundColor: '#F5F5F5', borderRadius: sw(10), paddingHorizontal: sw(12), marginBottom: sw(10), height: sw(42)},
  searchInput: {flex: 1, fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816'},
  svcPickRow: {flexDirection: 'row', alignItems: 'center', gap: sw(10), paddingVertical: sw(10), borderBottomWidth: 1, borderBottomColor: '#F5F5F5'},
  svcPickRowSel: {backgroundColor: '#EAF5F0', borderRadius: sw(8), paddingHorizontal: sw(6)},
  pickImg: {width: sw(44), height: sw(44), borderRadius: sw(8), backgroundColor: '#E5E5E5'},
  pickName: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '600'},
  pickMeta: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#9CA3AF', marginTop: sw(2)},
  pickCommission: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#9CA3AF', marginTop: sw(2)},
  emptyPick: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#9CA3AF', textAlign: 'center', padding: sw(24)},
  qtyRow: {flexDirection: 'row', alignItems: 'center', gap: sw(12), backgroundColor: '#F9F9F9', borderRadius: sw(10), padding: sw(12), marginTop: sw(10)},
  qtyLabel: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#5C5C5C', flex: 1},
  qtyTotal: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700', color: '#012823'},
  confirmBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sw(8), backgroundColor: '#105641', borderRadius: sw(12), height: sw(50), marginTop: sw(14)},
  confirmBtnText: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#FFFFFF'},
  addonFieldWrap: {marginBottom: sw(12)},
  addonFieldLabel: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#5C5C5C', marginBottom: sw(6), fontWeight: '600'},
  addonInput: {backgroundColor: '#F5F5F5', borderRadius: sw(10), paddingHorizontal: sw(12), height: sw(44), fontFamily: fonts.textFont, fontSize: sw(14), color: '#171816'},

  pkgPickCard: {
    flexDirection: 'row', alignItems: 'center', gap: sw(10),
    paddingVertical: sw(12), borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  pkgTypeBadge: {borderRadius: sw(4), paddingHorizontal: sw(6), paddingVertical: sw(2)},
  pkgTypeBadgeFixed: {backgroundColor: '#EAF5F0'},
  pkgTypeBadgeFlex: {backgroundColor: '#EEF0FF'},
  pkgTypeBadgeText: {fontFamily: fonts.textFont, fontSize: sw(9), fontWeight: '700'},
  pkgAddBtn: {backgroundColor: '#105641', borderRadius: sw(20), paddingHorizontal: sw(14), paddingVertical: sw(8)},
  pkgAddBtnText: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '700', color: '#FFFFFF'},
  pkgProgressRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sw(10)},
  pkgBackBtn: {
    borderWidth: 1.5, borderColor: '#E5E5E5', borderRadius: sw(12),
    paddingHorizontal: sw(16), alignItems: 'center', justifyContent: 'center',
  },
  pkgBackBtnText: {fontFamily: fonts.textFont, fontSize: sw(13), fontWeight: '600', color: '#5C5C5C'},
});

export default JobChecklistScreen;
