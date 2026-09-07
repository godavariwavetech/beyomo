import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, Eye, XCircle, MapPin, CreditCard, Clock, UserCheck, Package, FileText, Tag, PlusCircle, CalendarClock, Check, Gift, CalendarCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useBookings } from '../hooks/useBookings';
import { useAuth } from '../context/AuthContext';
import { useCityFilter } from '../context/CityContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { Badge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import api from '../services/api';

const exportCSV = (data, filename) => {
  const headers = ['ID','Customer','User ID','Partner','Partner ID','Service','Amount','Commission','Status','Date','Slot','Payment'];
  const rows = data.map(b => [b.id, b.userName, b.userId, b.partnerName, b.partnerId, b.service, b.amount, b.commission, b.status, b.date, b.slot, b.paymentMethod]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download: filename });
  a.click(); URL.revokeObjectURL(a.href);
};

const ITEMS_PER_PAGE = 8;
const STATUSES = ['all','pending','confirmed','in_progress','completed','cancelled'];

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// Format a Date as a local "YYYY-MM-DDTHH:mm" string for <input type="datetime-local"> min/max/value
const toLocalInputValue = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const validateRescheduleDate = (value) => {
  if (!value) return '';
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 'Please select a valid date & time.';
  const now = Date.now();
  if (time < now + ONE_HOUR_MS) return 'New time must be at least 1 hour from now.';
  if (time > now + ONE_MONTH_MS) return 'New time cannot be more than 1 month in advance.';
  return '';
};

const parseServices = (s) => {
  if (Array.isArray(s)) return s;
  if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
  return [];
};

export default function Bookings() {
  const { showToast } = useAuth();
  const { fetchList, action } = useBookings();
  const { cityParam } = useCityFilter();
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [serviceFilter, setService] = useState('all');
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bookings, setBookings]     = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [partners, setPartners]     = useState([]);
  const [reassignId, setReassignId] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [showNewBooking, setShowNewBooking] = useState(false);

  const [rescheduleDate, setRescheduleDate]     = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleError, setRescheduleError]   = useState('');
  const [rescheduling, setRescheduling]         = useState(false);

  // Add-services panel state
  const [allServices, setAllServices]       = useState([]);
  const [svcCart, setSvcCart]               = useState([]); // [{svc, qty}]
  const [svcSearch, setSvcSearch]           = useState('');
  const [addingSvc, setAddingSvc]           = useState(false);
  const [updatingQtyIdx, setUpdatingQtyIdx] = useState(null);
  const [qtyDrafts, setQtyDrafts]           = useState({}); // {[serviceIndex]: pendingQty}
  const [addMode, setAddMode]               = useState('catalog'); // 'catalog' | 'addon' | 'package'
  const [addonName, setAddonName]           = useState('');
  const [addonPrice, setAddonPrice]         = useState('');
  const [addonQty, setAddonQty]             = useState(1);
  const [addingAddon, setAddingAddon]       = useState(false);
  const [removingPackageId, setRemovingPackageId] = useState(null);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [pickingPackage, setPickingPackage] = useState(null); // flexible package awaiting service picks
  const [flexiblePicks, setFlexiblePicks]   = useState([]); // [serviceId, ...]
  const [addingPackage, setAddingPackage]   = useState(false);

  const loadBookings = () => {
    const params = cityParam ? { cityIds: cityParam, limit: 1000 } : { limit: 1000 };
    fetchList(params).then(res => {
      if (res.ok) {
        const raw = res.data?.data ?? [];
        const normalized = raw.map(b => ({
          ...b,
          services:    parseServices(b.services),
          packages:    parseServices(b.packages),
          id:          String(b._id ?? b.id ?? ''),
          userName:    b.userName ?? b.user?.name ?? b.customerName ?? '',
          userPhone:   b.user?.phone ?? '',
          userId:      b.userId ?? b.user?._id ?? '',
          partnerName: b.partnerName ?? b.partner?.name ?? '',
          partnerPhone: b.partner?.phone ?? '',
          partnerId:   b.partnerId ?? b.partner?._id ?? '',
          service:     b.service?.name ?? b.service ?? b.services?.[0]?.name ?? '',
          amount:      parseFloat(b.amount ?? b.totalAmount ?? 0),
          commission:  parseFloat(b.commission ?? b.commissionAmount ?? 0),
          date:        b.date ?? (b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : ''),
          slot:        b.slot ?? (b.scheduledAt ? new Date(b.scheduledAt).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'}) : ''),
          paymentMethod: b.paymentMethod ?? b.payment?.method ?? '',
          fullAddress:   [b.addressLine1, b.addressLine2, b.addressCity, b.addressState, b.addressPincode].filter(Boolean).join(', '),
        }));
        setBookings(normalized);
      }
      setPageLoading(false);
    });
  };

  useEffect(() => { loadBookings(); }, [cityParam]);
  useAutoRefresh(loadBookings);

  const services = [...new Set(bookings.map(b => b.service ?? b.services?.[0]?.name).filter(Boolean))].sort();

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const q = search.toLowerCase();
      const bid = String(b._id ?? b.id ?? '').toLowerCase();
      const bookingCode = (b.bookingCode ?? '').toLowerCase();
      const userName = (b.userName ?? '').toLowerCase();
      const partnerName = (b.partnerName ?? '').toLowerCase();
      const service = (b.service ?? b.services?.[0]?.name ?? '').toLowerCase();
      return (!q || bid.includes(q) || bookingCode.includes(q) || userName.includes(q) || partnerName.includes(q) || service.includes(q))
          && (statusFilter === 'all' || b.status === statusFilter)
          && (serviceFilter === 'all' || service === serviceFilter.toLowerCase());
    });
  }, [bookings, search, statusFilter, serviceFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageData   = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  const openDetail = async (b) => {
    setSelected(b);
    setReassignId('');
    setSvcCart([]);
    setSvcSearch('');
    setUpdatingQtyIdx(null);
    setQtyDrafts({});
    setAddMode('catalog');
    setAddonName('');
    setAddonPrice('');
    setAddonQty(1);
    setPartners([]);
    setRescheduleDate('');
    setRescheduleReason('');
    setRescheduleError('');
    setDetailLoading(true);
    if (allServices.length === 0) {
      api.get('/api/v1/admin/services', { params: { limit: 500 } })
        .then(res => setAllServices(res.data?.data?.data ?? res.data?.data ?? []))
        .catch(() => {});
    }
    try {
      const res = await api.get(`/api/v1/admin/bookings/${b.id}`);
      const fresh = res.data?.data;
      if (fresh) {
        const cityId = fresh.cityId ?? b.cityId;
        if (cityId) {
          api.get('/api/v1/admin/partners', { params: { status: 'approved', limit: 200, cityIds: String(cityId) } })
            .then(r => setPartners(r.data?.data?.data ?? r.data?.data ?? []))
            .catch(() => {});
        }
        setSelected(prev => ({
          ...prev,
          ...fresh,
          services:    parseServices(fresh.services ?? prev.services),
          packages:    parseServices(fresh.packages ?? prev.packages),
          id: String(fresh._id ?? fresh.id ?? b.id),
          userName:    fresh.user?.name ?? prev.userName,
          userPhone:   fresh.user?.phone ?? prev.userPhone,
          partnerName: fresh.partner?.name ?? prev.partnerName,
          partnerPhone: fresh.partner?.phone ?? prev.partnerPhone,
          amount:      parseFloat(fresh.totalAmount ?? prev.amount),
          commission:  parseFloat(fresh.commissionAmount ?? prev.commission ?? 0),
          recomputedAdminPercent:   fresh.recomputedAdminPercent,
          recomputedPartnerPercent: fresh.recomputedPartnerPercent,
          recomputedAdminCommission: fresh.recomputedAdminCommission,
          recomputedPartnerEarning:  fresh.recomputedPartnerEarning,
          date:        fresh.scheduledAt ? new Date(fresh.scheduledAt).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : prev.date,
          slot:        fresh.scheduledAt ? new Date(fresh.scheduledAt).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'}) : prev.slot,
          fullAddress: [fresh.addressLine1, fresh.addressLine2, fresh.addressCity, fresh.addressState, fresh.addressPincode].filter(Boolean).join(', '),
        }));
      } else {
        const cityId = b.cityId;
        if (cityId) {
          api.get('/api/v1/admin/partners', { params: { status: 'approved', limit: 200, cityIds: String(cityId) } })
            .then(r => setPartners(r.data?.data?.data ?? r.data?.data ?? []))
            .catch(() => {});
        }
      }
    } catch {
      const cityId = b.cityId;
      if (cityId) {
        api.get('/api/v1/admin/partners', { params: { status: 'approved', limit: 200, cityIds: String(cityId) } })
          .then(r => setPartners(r.data?.data?.data ?? r.data?.data ?? []))
          .catch(() => {});
      }
    }
    setDetailLoading(false);
  };

  const cancelBooking = async (id) => {
    await action('patch', `/api/v1/admin/bookings/${id}/cancel`);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status:'cancelled', commission:0 } : b));
    showToast('Booking cancelled successfully.', 'danger');
    if (selected?.id === id) setSelected(prev => ({ ...prev, status:'cancelled', commission:0 }));
  };

  const acceptBooking = async (id) => {
    const res = await action('patch', `/api/v1/admin/bookings/${id}/accept`);
    if (res.ok) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status:'confirmed' } : b));
      showToast('Booking accepted.', 'success');
      if (selected?.id === id) setSelected(prev => ({ ...prev, status:'confirmed' }));
    } else {
      showToast(res.error ?? 'Failed to accept booking.', 'danger');
    }
  };

  const handleAddServices = async (bookingId) => {
    if (!svcCart.length) { showToast('Please select at least one service.', 'warning'); return; }
    setAddingSvc(true);
    try {
      const res = await api.patch(`/api/v1/admin/bookings/${bookingId}/services`, {
        services: svcCart.map(item => ({ id: item.svc.id ?? item.svc._id, qty: item.qty })),
      });
      const updated = res.data?.data;
      if (updated) {
        const parsedSvcs = parseServices(updated.services ?? selected?.services);
        const newTotal = parseFloat(updated.totalAmount ?? selected?.amount ?? 0);
        setSelected(prev => ({ ...prev, services: parsedSvcs, amount: newTotal, totalAmount: newTotal }));
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, amount: newTotal } : b));
      }
      const n = svcCart.length;
      setSvcCart([]);
      setSvcSearch('');
      showToast(`${n} service(s) added to booking.`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to add services.';
      console.error('[addServices]', err.response?.data ?? err.message);
      showToast(msg, 'danger');
    }
    setAddingSvc(false);
  };

  const handleAddAddon = async (bookingId) => {
    const price = parseFloat(addonPrice);
    if (!addonName.trim() || !(price >= 0)) { showToast('Enter a label and a valid amount.', 'warning'); return; }
    setAddingAddon(true);
    try {
      const res = await api.patch(`/api/v1/admin/bookings/${bookingId}/services`, {
        services: [{ isAddOn: true, name: addonName.trim(), price, qty: addonQty }],
      });
      const updated = res.data?.data;
      if (updated) {
        const parsedSvcs = parseServices(updated.services ?? selected?.services);
        const newTotal = parseFloat(updated.totalAmount ?? selected?.amount ?? 0);
        setSelected(prev => ({ ...prev, services: parsedSvcs, amount: newTotal, totalAmount: newTotal }));
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, amount: newTotal } : b));
      }
      setAddonName(''); setAddonPrice(''); setAddonQty(1);
      showToast('Add-on added to booking.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to add add-on.';
      console.error('[addAddon]', err.response?.data ?? err.message);
      showToast(msg, 'danger');
    }
    setAddingAddon(false);
  };

  const fetchAvailablePackages = () => {
    if (availablePackages.length > 0) return;
    setLoadingPackages(true);
    api.get('/api/v1/admin/packages', { params: { limit: 200 } })
      .then(res => setAvailablePackages(res.data?.data?.data ?? res.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingPackages(false));
  };

  const handleAddPackage = async (bookingId, packageId, services) => {
    setAddingPackage(true);
    try {
      const res = await api.patch(`/api/v1/admin/bookings/${bookingId}/add-package`, { packageId, services });
      const updated = res.data?.data;
      if (updated) {
        const parsedSvcs = parseServices(updated.services ?? selected?.services);
        const parsedPkgs = parseServices(updated.packages ?? selected?.packages);
        const newTotal = parseFloat(updated.totalAmount ?? selected?.amount ?? 0);
        setSelected(prev => ({ ...prev, services: parsedSvcs, packages: parsedPkgs, amount: newTotal, totalAmount: newTotal }));
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, amount: newTotal } : b));
      }
      setPickingPackage(null);
      setFlexiblePicks([]);
      setShowAddPackageModal(false);
      showToast('Package added to booking.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to add package.';
      console.error('[addPackage]', err.response?.data ?? err.message);
      showToast(msg, 'danger');
      // Most likely cause is the package having just been added (stale list) — drop back to
      // the picker list, which will exclude it once `selected` is refreshed below.
      setPickingPackage(null);
      setFlexiblePicks([]);
      try {
        const fresh = await api.get(`/api/v1/admin/bookings/${bookingId}`);
        const freshData = fresh.data?.data;
        if (freshData) {
          setSelected(prev => ({ ...prev, services: parseServices(freshData.services ?? prev?.services), packages: parseServices(freshData.packages ?? prev?.packages), packageId: freshData.packageId ?? prev?.packageId }));
        }
      } catch {}
    }
    setAddingPackage(false);
  };

  const handleAddFixedPackage = (bookingId, pkg) => {
    const services = (pkg.services || []).map(s => ({ id: s.serviceId ?? s.id, qty: 1 }));
    handleAddPackage(bookingId, pkg.id, services);
  };

  const toggleFlexiblePick = (serviceId) => {
    setFlexiblePicks(prev => {
      if (prev.includes(serviceId)) return prev.filter(id => id !== serviceId);
      if (prev.length >= (pickingPackage?.serviceCount ?? 0)) return prev;
      return [...prev, serviceId];
    });
  };

  // Adjusts the local draft qty for a row — does NOT call the API. Saved via handleSaveQty.
  const adjustQtyDraft = (index, baseQty, delta) => {
    setQtyDrafts(prev => {
      const current = prev[index] ?? baseQty;
      const next = Math.max(1, current + delta);
      return { ...prev, [index]: next };
    });
  };

  const handleSaveQty = async (bookingId, index, qty) => {
    if (qty < 1) return;
    setUpdatingQtyIdx(index);
    try {
      const res = await api.patch(`/api/v1/admin/bookings/${bookingId}/services`, { updateQty: [{ index, qty }] });
      const updated = res.data?.data;
      if (updated) {
        const parsedSvcs = parseServices(updated.services ?? selected?.services);
        const newTotal = parseFloat(updated.totalAmount ?? selected?.amount ?? 0);
        setSelected(prev => ({ ...prev, services: parsedSvcs, amount: newTotal, totalAmount: newTotal }));
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, amount: newTotal } : b));
      }
      setQtyDrafts(prev => { const next = { ...prev }; delete next[index]; return next; });
      showToast(`Quantity updated. New total: ₹${fmt(updated?.totalAmount ?? 0)}`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to update quantity.';
      console.error('[updateQty]', err.response?.data ?? err.message);
      showToast(msg, 'danger');
    }
    setUpdatingQtyIdx(null);
  };

  const handleRemoveService = async (bookingId, serviceIndex) => {
    try {
      const res = await api.patch(`/api/v1/admin/bookings/${bookingId}/services`, { removeIndices: [serviceIndex] });
      const updated = res.data?.data;
      if (updated) {
        const parsedSvcs = parseServices(updated.services ?? selected?.services);
        const newTotal = parseFloat(updated.totalAmount ?? selected?.amount ?? 0);
        setSelected(prev => ({ ...prev, services: parsedSvcs, amount: newTotal, totalAmount: newTotal }));
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, amount: newTotal } : b));
      }
      showToast('Service removed from booking.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to remove service.';
      console.error('[removeService]', err.response?.data ?? err.message);
      showToast(msg, 'danger');
    }
  };

  const handleRemovePackage = async (bookingId, packageId, title) => {
    if (!window.confirm(`Remove "${title}" from this booking? Its services will be dropped and any remaining services will be billed at their normal price.`)) return;
    setRemovingPackageId(packageId ?? 'legacy');
    try {
      const res = await api.patch(`/api/v1/admin/bookings/${bookingId}/remove-package`, packageId != null ? { packageId } : {});
      const updated = res.data?.data;
      if (updated) {
        const parsedSvcs = parseServices(updated.services ?? selected?.services);
        const parsedPkgs = parseServices(updated.packages ?? selected?.packages);
        const newTotal = parseFloat(updated.totalAmount ?? selected?.amount ?? 0);
        setSelected(prev => ({ ...prev, services: parsedSvcs, packages: parsedPkgs, packageId: updated.packageId ?? null, amount: newTotal, totalAmount: newTotal }));
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, amount: newTotal } : b));
      }
      showToast('Package removed from booking.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to remove package.';
      console.error('[removePackage]', err.response?.data ?? err.message);
      showToast(msg, 'danger');
    }
    setRemovingPackageId(null);
  };

  const handleReassign = async (bookingId) => {
    if (!reassignId) { showToast('Please select a partner.', 'warning'); return; }
    setReassigning(true);
    try {
      await api.patch(`/api/v1/admin/bookings/${bookingId}/assign`, { partnerId: reassignId });
      const partner = partners.find(p => String(p.id ?? p._id) === reassignId);
      const pName = partner?.name ?? 'Partner';
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, partnerName: pName, partnerId: reassignId, status: b.status === 'pending' ? 'confirmed' : b.status } : b));
      setSelected(prev => ({ ...prev, partnerName: pName, partnerId: reassignId }));
      setReassignId('');
      showToast('Partner assigned successfully.', 'success');
    } catch {
      showToast('Failed to assign partner.', 'danger');
    }
    setReassigning(false);
  };

  const handleReschedule = async (bookingId) => {
    if (!rescheduleDate) { showToast('Please select a new date & time.', 'warning'); return; }
    const validationError = validateRescheduleDate(rescheduleDate);
    if (validationError) { setRescheduleError(validationError); showToast(validationError, 'warning'); return; }
    setRescheduling(true);
    try {
      const res = await api.patch(`/api/v1/admin/bookings/${bookingId}/reschedule`, {
        scheduledAt: new Date(rescheduleDate).toISOString(),
        reason: rescheduleReason || undefined,
      });
      const updated = res.data?.data;
      const newScheduledAt = updated?.scheduledAt ?? rescheduleDate;
      const dateStr = new Date(newScheduledAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
      const slotStr = new Date(newScheduledAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, date: dateStr, slot: slotStr } : b));
      setSelected(prev => ({ ...prev, date: dateStr, slot: slotStr }));
      setRescheduleDate('');
      setRescheduleReason('');
      setRescheduleError('');
      showToast('Booking rescheduled successfully.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to reschedule booking.';
      showToast(msg, 'danger');
    }
    setRescheduling(false);
  };

  const stats = {
    total:      bookings.length,
    pending:    bookings.filter(b => b.status==='pending').length,
    inProgress: bookings.filter(b => b.status==='in_progress').length,
    completed:  bookings.filter(b => b.status==='completed').length,
    cancelled:  bookings.filter(b => b.status==='cancelled').length,
  };

  const servicesList = Array.isArray(selected?.services) && selected.services.length > 0
    ? selected.services
    : selected?.service
      ? [{
          name:     typeof selected.service === 'object' ? selected.service.name     : selected.service,
          price:    typeof selected.service === 'object' ? (selected.service.basePrice ?? selected.baseAmount ?? selected.amount) : (selected.baseAmount ?? selected.amount),
          duration: typeof selected.service === 'object' ? selected.service.duration : undefined,
          qty: 1,
        }]
      : [];

  // A package already on the booking can't be added again (the backend rejects it) —
  // filter it out of the "Add Package" picker up front instead of letting the user hit that error.
  const existingPackageIds = new Set([
    ...(selected?.packageId != null ? [selected.packageId] : []),
    ...parseServices(selected?.packages).map(p => p.packageId),
  ]);
  const addablePackages = availablePackages.filter(p => !existingPackageIds.has(p.id));

  const baseAmount      = parseFloat(selected?.baseAmount ?? selected?.amount ?? 0);
  const couponDiscount  = parseFloat(selected?.couponDiscountAmount ?? 0);
  const tax             = parseFloat(selected?.taxAmount ?? 0);
  const totalAmt        = parseFloat(selected?.totalAmount ?? selected?.amount ?? 0);
  const taxableAmount   = Math.max(0, baseAmount - couponDiscount);
  // Preferred: the backend recomputes the split from the CURRENT category/package rates
  // and returns it on the booking detail (recomputedAdminCommission/PartnerEarning). This
  // keeps the UI accurate even when a category's adminPercent was raised after the booking
  // was created but the stored partnerEarning is still the original frozen snapshot.
  // Fallback: derive from the stored partnerEarning (base - partnerEarning), and as a last
  // resort apply the recomputed admin percent against the taxable amount.
  const recomputedAdminCommission = parseFloat(selected?.recomputedAdminCommission);
  const recomputedPartnerEarning  = parseFloat(selected?.recomputedPartnerEarning);
  const adminPercent = parseFloat(selected?.recomputedAdminPercent);
  const commission = !Number.isNaN(recomputedAdminCommission) && selected?.recomputedAdminCommission != null
    ? Math.round(recomputedAdminCommission)
    : selected?.partnerEarning != null
      ? Math.max(0, Math.round(taxableAmount - parseFloat(selected.partnerEarning)))
      : Math.round(taxableAmount * ((!Number.isNaN(adminPercent) && selected?.recomputedAdminPercent != null ? adminPercent : 20) / 100));
  const gstPercentLabel = taxableAmount > 0 ? Math.round((tax / taxableAmount) * 100) : 5;
  const adminPercentDisplay = !Number.isNaN(adminPercent) && selected?.recomputedAdminPercent != null
    ? Math.round(adminPercent)
    : (taxableAmount > 0 ? Math.round((commission / taxableAmount) * 100) : 20);

  // Edge case 8: for multi-partner bookings, compute per-partner payout from services JSON
  const partnerPayouts = (() => {
    // Once the booking is completed, the settlement ledger has the authoritative, actually-settled amount.
    const ledgerEntries = Array.isArray(selected?.ledgerEntries) ? selected.ledgerEntries : [];
    if (ledgerEntries.length > 0) {
      return ledgerEntries.map(e => ({
        name: e.partnerName || 'Partner',
        amount: e.partnerNetAmount,
        status: e.status,
      }));
    }

    const svcs = Array.isArray(selected?.services) ? selected.services : [];
    // Services' listed `price` is the raw undiscounted per-item price — bookings with
    // packages/combos earn less than the sum of those prices, so scale each partner's
    // raw-price share by the booking's real (already-discounted) partnerEarning instead
    // of summing raw prices directly (that overstated payouts for combo bookings).
    const rawTotal = svcs.reduce((sum, s) => sum + (s.price ?? 0) * (s.qty || 1), 0);
    const bookingEarning = !Number.isNaN(recomputedPartnerEarning) && selected?.recomputedPartnerEarning != null
      ? recomputedPartnerEarning
      : parseFloat(selected?.partnerEarning ?? (totalAmt - commission));
    const byPartner = {};
    svcs.forEach(s => {
      if (!s.assignedPartnerId) return;
      const key = String(s.assignedPartnerId);
      if (!byPartner[key]) byPartner[key] = { name: s.assignedPartnerName || 'Partner', amount: 0 };
      byPartner[key].amount += s.price * (s.qty || 1);
    });
    if (Object.keys(byPartner).length > 0) {
      if (rawTotal > 0 && bookingEarning) {
        Object.values(byPartner).forEach(p => { p.amount = p.amount * (bookingEarning / rawTotal); });
      }
      return Object.values(byPartner);
    }
    // Fallback: partner assigned at booking level (e.g. via "Assign / Change Partner")
    // but no service has been individually claimed/stamped with assignedPartnerId yet.
    if (selected?.partnerId) {
      return [{ name: selected?.partnerName || 'Partner', amount: !Number.isNaN(recomputedPartnerEarning) && selected?.recomputedPartnerEarning != null ? recomputedPartnerEarning : parseFloat(selected?.partnerEarning ?? (totalAmt - commission)) }];
    }
    return [];
  })();

  return (
    <div>
      <div className="stats-grid stats-grid-5" style={{ marginBottom:24 }}>
        {[
          { label:'Total',       value:stats.total,      color:'#064081', icon:CalendarCheck },
          { label:'Pending',     value:stats.pending,    color:'#F59E0B', icon:Clock },
          { label:'In Progress', value:stats.inProgress, color:'#8B5CF6', icon:RefreshCw },
          { label:'Completed',   value:stats.completed,  color:'#22C55E', icon:CheckCircle2 },
          { label:'Cancelled',   value:stats.cancelled,  color:'#EF4444', icon:XCircle },
        ].map(s => (
          <div className="stat-card" key={s.label} style={{ cursor:'pointer' }} onClick={() => { setStatus(s.label === 'Total' ? 'all' : s.label.toLowerCase().replace(' ','_')); setPage(1); }}>
            <div className="stat-card-header">
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
              </div>
              <div className="stat-icon" style={{ background: `${s.color}1A` }}>
                <s.icon size={20} style={{ color:s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search size={16} />
            <input className="search-input" placeholder="Search by ID, code, customer, partner or service…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="filter-select" value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase()+s.slice(1).replace(/_/g,' ')}</option>)}
          </select>
          <select className="filter-select" value={serviceFilter} onChange={e => { setService(e.target.value); setPage(1); }}>
            <option value="all">All Services</option>
            {services.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-outline btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }} onClick={() => exportCSV(filtered, 'bookings.csv')}>
            <Download size={14} /> Export
          </button>
          <button className="btn btn-primary btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }} onClick={() => setShowNewBooking(true)}>
            <PlusCircle size={14} /> New Booking
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Partner</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Date &amp; Slot</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={8} className="table-empty">
                  <Search size={32} style={{ color:'var(--c-text-muted)', display:'block', margin:'0 auto 8px' }} />
                  <p>No bookings match your filters.</p>
                </td></tr>
              ) : pageData.map(b => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontFamily:'monospace', fontSize:12, background:'var(--c-border-light)', padding:'2px 6px', borderRadius:'var(--r-sm)', fontWeight:600, display:'inline-block' }}>{b.bookingCode || b.id}</div>
                  </td>
                  <td>
                    <div className="table-cell-main">{b.userName}</div>
                    <div className="table-cell-sub">{b.userPhone || b.userId}</div>
                  </td>
                  <td>
                    {(() => {
                      const partnerNames = Array.isArray(b.services)
                        ? [...new Set(b.services.map(s => s.assignedPartnerName).filter(Boolean))]
                        : [];
                      if (partnerNames.length > 1) {
                        return (
                          <>
                            <div className="table-cell-main" style={{display:'flex',alignItems:'center',gap:4}}>
                              <Package size={12} style={{color:'#3b82f6'}} />
                              {partnerNames.length} partners
                            </div>
                            <div className="table-cell-sub">{partnerNames[0]}{partnerNames.length > 1 ? ` +${partnerNames.length - 1}` : ''}</div>
                          </>
                        );
                      }
                      return (
                        <>
                          <div className="table-cell-main">{b.partnerName || <span style={{color:'var(--c-text-muted)'}}>Unassigned</span>}</div>
                          <div className="table-cell-sub">{b.partnerPhone}</div>
                        </>
                      );
                    })()}
                  </td>
                  <td style={{ fontWeight:500, maxWidth:140 }}>
                    {Array.isArray(b.services) && b.services.length > 1
                      ? <><div>{b.services[0]?.name}</div><div style={{fontSize:11,color:'var(--c-text-muted)'}}>+{b.services.length-1} more</div></>
                      : b.service}
                  </td>
                  <td>
                    <div style={{ fontWeight:700 }}>₹{fmt(b.amount)}</div>
                    <div style={{ fontSize:11, color:'var(--c-text-muted)' }}>{b.paymentStatus ? `Pay: ${b.paymentStatus}` : ''}</div>
                  </td>
                  <td>
                    <div style={{ fontSize:13 }}>{b.date}</div>
                    <div style={{ fontSize:12, color:'var(--c-text-secondary)' }}>{b.slot}</div>
                  </td>
                  <td><Badge status={b.status} /></td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn btn-ghost btn-icon" title="View Details" onClick={() => openDetail(b)}><Eye size={15}/></button>
                      {b.status === 'pending' && (
                        <button className="btn btn-ghost btn-icon" title="Accept Booking" onClick={() => acceptBooking(b.id)} style={{ color:'#22C55E' }}><CheckCircle2 size={15}/></button>
                      )}
                      {!['completed','cancelled'].includes(b.status) && (
                        <button className="btn btn-ghost btn-icon" title="Cancel Booking" onClick={() => cancelBooking(b.id)} style={{ color:'var(--c-danger)' }}><XCircle size={15}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="pagination-info">Showing {Math.min((page-1)*ITEMS_PER_PAGE+1, filtered.length)}–{Math.min(page*ITEMS_PER_PAGE, filtered.length)} of {filtered.length} bookings</span>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => setPage(p=>p-1)} disabled={page===1}>‹</button>
            {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1).map((p,idx,arr)=>(
              <React.Fragment key={p}>
                {idx>0&&arr[idx-1]!==p-1&&<span style={{padding:'0 4px',color:'var(--c-text-muted)'}}>…</span>}
                <button className={`pagination-btn ${page===p?'active':''}`} onClick={() => setPage(p)}>{p}</button>
              </React.Fragment>
            ))}
            <button className="pagination-btn" onClick={() => setPage(p=>p+1)} disabled={page===totalPages||totalPages===0}>›</button>
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => { setSelected(null); setReassignId(''); }}
        title={`Booking — ${selected?.bookingCode || selected?.id}`}
        size="lg"
        // Not a read-only view: reassigning a partner, editing services, rescheduling
        // and adding packages all happen in here, so a stray backdrop click threw away
        // work in progress. Close via the header X or the footer Close button.
        dismissOnBackdrop={false}
        dismissOnEscape={false}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setSelected(null); setReassignId(''); }}>Close</button>
            {selected && selected.status === 'pending' && (
              <button className="btn btn-primary" onClick={() => acceptBooking(selected.id)} style={{ display:'flex', alignItems:'center', gap:6, background:'#22C55E', borderColor:'#22C55E' }}>
                <CheckCircle2 size={15}/> Accept Booking
              </button>
            )}
            {selected && !['completed','cancelled'].includes(selected.status) && (
              <button className="btn btn-danger" onClick={() => cancelBooking(selected.id)} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <XCircle size={15}/> Cancel Booking
              </button>
            )}
          </>
        }
      >
        {selected && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {detailLoading && (
              <div style={{ textAlign:'center', padding:'8px 0', fontSize:13, color:'var(--c-text-muted)' }}>
                Refreshing details…
              </div>
            )}

            {/* ── Customer / Partner row ── */}
            <div className="form-grid form-grid-2" style={{ gap:12 }}>
              <InfoBlock label="Customer">
                <div style={{ fontWeight:700, fontSize:15 }}>{selected.userName || selected.user?.name || '—'}</div>
                {(selected.userPhone || selected.user?.phone) && (
                  <div style={{ fontSize:13, color:'var(--c-text-secondary)', marginTop:2 }}>📞 {selected.userPhone || selected.user?.phone}</div>
                )}
              </InfoBlock>
              <InfoBlock label="Partner">
                <div style={{ fontWeight:700, fontSize:15 }}>{selected.partnerName || selected.partner?.name || <span style={{color:'var(--c-text-muted)'}}>Unassigned</span>}</div>
                {(selected.partnerPhone || selected.partner?.phone) && (
                  <div style={{ fontSize:13, color:'var(--c-text-secondary)', marginTop:2 }}>📞 {selected.partnerPhone || selected.partner?.phone}</div>
                )}
              </InfoBlock>
            </div>

            {/* ── Schedule & Address ── */}
            <div className="form-grid form-grid-2" style={{ gap:12 }}>
              <InfoBlock label="Scheduled">
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <Clock size={13} style={{ color:'var(--c-brand-primary)', flexShrink:0 }} />
                  <span style={{ fontSize:13, fontWeight:500 }}>{selected.date} · {selected.slot}</span>
                </div>
              </InfoBlock>
              <InfoBlock label="Payment">
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <CreditCard size={13} style={{ color:'var(--c-brand-primary)', flexShrink:0 }} />
                  <span style={{ fontSize:13, fontWeight:500 }}>
                    {selected.paymentMethod || '—'}
                    {selected.paymentStatus && <span style={{ marginLeft:6, fontSize:11, padding:'1px 6px', borderRadius:4, background: selected.paymentStatus==='paid' ? '#dcfce7':'#fef3c7', color: selected.paymentStatus==='paid' ? '#166534':'#92400e' }}>{selected.paymentStatus}</span>}
                  </span>
                </div>
              </InfoBlock>
            </div>

            {selected.fullAddress && (
              <InfoBlock label="Address">
                <div style={{ display:'flex', alignItems:'flex-start', gap:6 }}>
                  <MapPin size={13} style={{ color:'var(--c-brand-primary)', marginTop:2, flexShrink:0 }} />
                  <span style={{ fontSize:13, fontWeight:500, lineHeight:'1.5' }}>{selected.fullAddress}</span>
                </div>
              </InfoBlock>
            )}

            {/* ── Services list ── */}
            {(() => {
              const partnerSet = new Set((servicesList || []).map(s => s.assignedPartnerName).filter(Boolean));
              const isMultiPartner = partnerSet.size > 1;
              const unassignedCount = (servicesList || []).filter(s => !s.removed && !s.assignedPartnerName && s.serviceStatus === 'unassigned').length;
              return (
                <InfoBlock label={`Services (${servicesList.length})${isMultiPartner ? ' — Multi-partner' : ''}`}>
                  {isMultiPartner && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, padding:'6px 10px', background:'#eff6ff', borderRadius:6 }}>
                      <Package size={13} style={{ color:'#3b82f6' }} />
                      <span style={{ fontSize:12, color:'#1d4ed8', fontWeight:600 }}>
                        {partnerSet.size} partners assigned to this booking
                      </span>
                    </div>
                  )}
                  {unassignedCount > 0 && (
                    <div style={{ marginBottom:8, fontSize:12, color:'#f59e0b', fontWeight:600 }}>
                      ⚠ {unassignedCount} service{unassignedCount !== 1 ? 's' : ''} awaiting partner
                    </div>
                  )}
                  {(() => {
                    const svcTag = (svc) => {
                      if (svc.removed)        return { label:'Removed',   text:'#b91c1c', bg:'#fee2e2' };
                      if (svc.addedByAdmin)   return { label:'Admin +',   text:'#7c3aed', bg:'#ede9fe' };
                      if (svc.addedByPartner) return { label:'Partner +', text:'#0369a1', bg:'#e0f2fe' };
                      if (svc.addedByUser)    return { label:'User +',    text:'#d97706', bg:'#fef3c7' };
                      return                          { label:'Original', text:'#166534', bg:'#dcfce7' };
                    };
                    // Package-tagged items keep the package's own fixed price — their individual
                    // catalog prices (shown per-row below, informationally) sum to more than what
                    // was actually charged, so surface the real package price up front too. A
                    // booking can contain more than one package/combo booked together — each keeps
                    // its own title and price, so they must be grouped separately, not merged.
                    const packageItems = servicesList.filter(s => s.addedByPackage);
                    const nonPackageTotal = servicesList
                      .filter(s => !s.addedByPackage && !s.removed)
                      .reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (s.qty || 1), 0);
                    const multiPackages = parseServices(selected.packages);
                    const packageGroups = multiPackages.length > 0
                      ? multiPackages.map(pkg => ({
                          key: pkg.packageId,
                          title: pkg.title,
                          price: (parseFloat(pkg.price) || 0) * (pkg.qty || 1),
                          items: packageItems.filter(s => s.packageId === pkg.packageId),
                        }))
                      : packageItems.length > 0
                        ? [{
                            key: selected.packageId,
                            title: selected.package?.title ?? 'Package Deal',
                            price: Math.max(0, parseFloat(selected.baseAmount ?? selected.amount ?? 0) - nonPackageTotal),
                            items: packageItems,
                          }]
                        : [];
                    return (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {packageGroups.map(group => (
                      <div key={group.key ?? group.title} style={{ padding:'8px 10px', background:'#eff6ff', borderRadius:6 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'#1d4ed8' }}>
                            {group.title}
                          </span>
                          <span style={{ fontSize:13, fontWeight:700, color:'#1d4ed8' }}>₹{fmt(group.price)}</span>
                        </div>
                        <div style={{ marginTop:6, fontSize:12, color:'#1e40af', lineHeight:1.6 }}>
                          {group.items.map((s, i) => (
                            <div key={i}>{i + 1}. {s.name}</div>
                          ))}
                        </div>
                        {!['completed','cancelled'].includes(selected.status) && (
                          <button
                            disabled={removingPackageId === (group.key ?? 'legacy')}
                            onClick={() => handleRemovePackage(selected.id, group.key, group.title)}
                            style={{ marginTop:8, fontSize:11, fontWeight:700, letterSpacing:'0.03em', textTransform:'uppercase', color:'#b91c1c', background:'#fff', border:'1px solid #fca5a5', borderRadius:20, padding:'5px 12px', cursor: removingPackageId === (group.key ?? 'legacy') ? 'not-allowed' : 'pointer' }}>
                            {removingPackageId === (group.key ?? 'legacy') ? 'Removing…' : 'Remove Package'}
                          </button>
                        )}
                      </div>
                    ))}
                    {servicesList.length === 0 ? (
                      <span style={{ fontSize:13, color:'var(--c-text-muted)' }}>No service details available</span>
                    ) : servicesList.map((svc, idx) => {
                      if (svc.addedByPackage) return null; // already summarized compactly above — avoid showing twice
                      const statusColor = {
                        unassigned: { bg:'#f3f4f6', text:'#6b7280' },
                        claimed:    { bg:'#dbeafe', text:'#1d4ed8' },
                        completed:  { bg:'#dcfce7', text:'#166534' },
                      }[svc.serviceStatus] ?? { bg:'#f3f4f6', text:'#6b7280' };
                      const tag = svcTag(svc);

                      return (
                        <div key={idx} style={{ padding:'10px 0', borderBottom: idx < servicesList.length-1 ? '1px solid var(--c-border-light)':undefined, opacity: svc.removed ? 0.6 : 1 }}>
                          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                            <div style={{ display:'flex', alignItems:'flex-start', gap:8, flex:1 }}>
                              <div style={{ width:7, height:7, borderRadius:'50%', background: svc.removed ? '#ef4444' : 'var(--c-brand-primary)', marginTop:5, flexShrink:0 }} />
                              <div>
                                <div style={{ fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                                  <span style={{ textDecoration: svc.removed ? 'line-through' : 'none', color: svc.removed ? 'var(--c-text-muted)' : undefined }}>{svc.name}</span>
                                  <span style={{ fontSize:10, background:tag.bg, color:tag.text, padding:'1px 6px', borderRadius:4, fontWeight:700 }}>{tag.label}</span>
                                  {svc.isAddOn && (
                                    <span style={{ fontSize:10, background:'#fff3e4', color:'#c87b1a', padding:'1px 6px', borderRadius:4, fontWeight:700 }}>Add-on</span>
                                  )}
                                  {svc.serviceStatus && (
                                    <span style={{ fontSize:10, background:statusColor.bg, color:statusColor.text, padding:'1px 6px', borderRadius:4, fontWeight:600, textTransform:'capitalize' }}>
                                      {svc.serviceStatus}
                                    </span>
                                  )}
                                </div>
                                {svc.duration && <div style={{ fontSize:11, color:'var(--c-text-muted)', marginTop:2 }}>{svc.duration} min</div>}
                                {svc.adminPercent != null && svc.partnerPercent != null && svc.gstPercent != null && (
                                  <div style={{ fontSize:10, color:'var(--c-text-muted)', marginTop:2 }}>
                                    Admin {svc.adminPercent}% · Partner {svc.partnerPercent}% · GST {svc.gstPercent}%
                                  </div>
                                )}
                                {svc.assignedPartnerName && (
                                  <div style={{ fontSize:11, color:'var(--c-text-secondary)', marginTop:3, display:'flex', alignItems:'center', gap:4 }}>
                                    <UserCheck size={11} /> {svc.assignedPartnerName}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                              {(() => {
                                const baseQty = svc.qty || 1;
                                const draftQty = qtyDrafts[idx] ?? baseQty;
                                const isDirty = draftQty !== baseQty;
                                return (
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                                <div style={{ fontSize:13, fontWeight:700, textAlign:'right', textDecoration: svc.removed ? 'line-through' : 'none', color: svc.removed ? 'var(--c-text-muted)' : isDirty ? '#d97706' : undefined }}>
                                  ₹{fmt(svc.price * draftQty)}
                                </div>
                                {!svc.removed && !['completed','cancelled'].includes(selected.status) ? (
                                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                    <button
                                      title="Decrease quantity"
                                      disabled={updatingQtyIdx === idx || draftQty <= 1}
                                      onClick={() => adjustQtyDraft(idx, baseQty, -1)}
                                      style={{ width:18, height:18, border:'1px solid var(--c-border)', borderRadius:4, background:'var(--c-bg-card)', cursor: (updatingQtyIdx === idx || draftQty <= 1) ? 'not-allowed' : 'pointer', fontSize:11, fontWeight:700, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }}>–</button>
                                    <span style={{ fontSize:11, fontWeight:700, minWidth:16, textAlign:'center', color: isDirty ? '#d97706' : undefined }}>{updatingQtyIdx === idx ? '…' : draftQty}</span>
                                    <button
                                      title="Increase quantity"
                                      disabled={updatingQtyIdx === idx}
                                      onClick={() => adjustQtyDraft(idx, baseQty, 1)}
                                      style={{ width:18, height:18, border:'1px solid var(--c-border)', borderRadius:4, background:'var(--c-bg-card)', cursor: updatingQtyIdx === idx ? 'not-allowed' : 'pointer', fontSize:11, fontWeight:700, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                                    {isDirty && (
                                      <button
                                        title="Save quantity"
                                        disabled={updatingQtyIdx === idx}
                                        onClick={() => handleSaveQty(selected.id, idx, draftQty)}
                                        style={{ width:18, height:18, border:'1px solid #86efac', borderRadius:4, background:'#dcfce7', color:'#166534', cursor: updatingQtyIdx === idx ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:2 }}>
                                        <Check size={11} />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  svc.qty && svc.qty > 1 ? <div style={{ fontWeight:400, fontSize:11, color:'var(--c-text-muted)' }}>×{svc.qty}</div> : null
                                )}
                              </div>
                                );
                              })()}
                              {!svc.removed && !['completed','cancelled'].includes(selected.status) && (
                                <button
                                  title="Remove service"
                                  onClick={() => handleRemoveService(selected.id, idx)}
                                  style={{ width:20, height:20, borderRadius:'50%', border:'1px solid #fca5a5', background:'#fee2e2', color:'#b91c1c', cursor:'pointer', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, lineHeight:1 }}>
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                    );
                  })()}
                </InfoBlock>
              );
            })()}

            {/* ── Coupon ── */}
            {selected.couponCode && (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f0fdf4', borderRadius:'var(--r-md)', padding:'10px 14px' }}>
                <Tag size={14} style={{ color:'#16a34a' }} />
                <span style={{ fontSize:13, color:'#166534', fontWeight:600 }}>Coupon: {selected.couponCode}</span>
                <span style={{ marginLeft:'auto', fontSize:13, color:'#16a34a', fontWeight:700 }}>–₹{fmt(couponDiscount)}</span>
              </div>
            )}

            {/* ── Offer ── */}
            {selected.offerId && (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fef3c7', borderRadius:'var(--r-md)', padding:'10px 14px' }}>
                <Gift size={14} style={{ color:'#b45309' }} />
                <span style={{ fontSize:13, color:'#92400e', fontWeight:600 }}>
                  Offer: {selected.offer?.title ?? `#${selected.offerId}`}
                </span>
              </div>
            )}

            {/* ── Notes ── */}
            {selected.notes && (
              <InfoBlock label="Notes">
                <div style={{ display:'flex', gap:8 }}>
                  <FileText size={13} style={{ color:'var(--c-brand-primary)', marginTop:2, flexShrink:0 }} />
                  <span style={{ fontSize:13, color:'var(--c-text-secondary)', fontStyle:'italic' }}>{selected.notes}</span>
                </div>
              </InfoBlock>
            )}

            {/* ── Amount breakdown ── */}
            <div style={{ background:'linear-gradient(135deg,var(--c-brand-teal-mid),var(--c-brand-teal-dark))', borderRadius:'var(--r-md)', padding:16, color:'white' }}>
              <div style={{ fontSize:11, fontWeight:700, opacity:0.7, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>Amount Breakdown</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <AmtRow label="Base Amount" value={`₹${fmt(baseAmount)}`} />
                {couponDiscount > 0 && <AmtRow label={`Coupon Discount${selected.couponCode ? ` (${selected.couponCode})` : ''}`} value={`–₹${fmt(couponDiscount)}`} dimValue />}
                <AmtRow label={`Tax (${gstPercentLabel}% GST)`} value={`₹${fmt(tax)}`} dimValue />
                <div style={{ borderTop:'1px solid rgba(255,255,255,0.25)', marginTop:4, paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:14, fontWeight:700 }}>Total</span>
                  <span style={{ fontSize:22, fontWeight:800 }}>₹{fmt(totalAmt)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                  <span style={{ fontSize:12, opacity:0.75 }}>Platform Commission ({adminPercentDisplay}%)</span>
                  <span style={{ fontSize:13, fontWeight:600 }}>₹{fmt(commission)}</span>
                </div>
                {partnerPayouts.length === 0 ? (
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:12, opacity:0.75 }}>Partner Payout</span>
                    <span style={{ fontSize:12, opacity:0.6, fontStyle:'italic' }}>Unassigned</span>
                  </div>
                ) : partnerPayouts.length === 1 ? (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, opacity:0.75 }}>Partner Payout{partnerPayouts[0].status ? ` (${partnerPayouts[0].status})` : ''}</span>
                    <span style={{ fontSize:13, fontWeight:600 }}>₹{fmt(partnerPayouts[0].amount)}</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:12, opacity:0.75, marginBottom:4 }}>Partner Payouts</div>
                    {partnerPayouts.map((pp, i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', paddingLeft:8, marginBottom:2 }}>
                        <span style={{ fontSize:12, opacity:0.85 }}>↳ {pp.name}{pp.status ? ` (${pp.status})` : ''}</span>
                        <span style={{ fontSize:12, fontWeight:600 }}>₹{fmt(pp.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ marginTop:12, textAlign:'right' }}>
                <Badge status={selected.status} />
              </div>
            </div>

            {/* ── Add Services (multi-select) ── */}
            {!['completed','cancelled'].includes(selected.status) && (
              <div style={{ background:'var(--c-border-light)', borderRadius:'var(--r-md)', padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--c-text-secondary)', display:'flex', alignItems:'center', gap:6 }}>
                    <PlusCircle size={14} /> Add Services to Booking
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => { setShowAddPackageModal(true); setPickingPackage(null); setFlexiblePicks([]); fetchAvailablePackages(); }}
                    style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Package size={13}/> Add Package
                  </button>
                </div>

                {/* Catalog vs. custom add-on toggle */}
                <div style={{ display:'flex', background:'var(--c-bg-card)', border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:3, marginBottom:10 }}>
                  <button
                    onClick={() => setAddMode('catalog')}
                    style={{ flex:1, border:'none', borderRadius:4, padding:'6px 0', fontSize:12, fontWeight:600, cursor:'pointer', background: addMode === 'catalog' ? 'var(--c-brand-primary)' : 'transparent', color: addMode === 'catalog' ? '#fff' : 'var(--c-text-secondary)' }}>
                    From Catalog
                  </button>
                  <button
                    onClick={() => setAddMode('addon')}
                    style={{ flex:1, border:'none', borderRadius:4, padding:'6px 0', fontSize:12, fontWeight:600, cursor:'pointer', background: addMode === 'addon' ? 'var(--c-brand-primary)' : 'transparent', color: addMode === 'addon' ? '#fff' : 'var(--c-text-secondary)' }}>
                    Custom Add-on
                  </button>
                </div>

                {addMode === 'catalog' ? (
                  <>
                    {/* Filter input */}
                    <input
                      type="text"
                      placeholder="Filter services…"
                      value={svcSearch}
                      onChange={e => setSvcSearch(e.target.value)}
                      style={{ width:'100%', border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'6px 10px', fontSize:13, background:'var(--c-bg-card)', color:'var(--c-text-primary)', marginBottom:8, boxSizing:'border-box' }}
                    />
                    {/* Service list with checkboxes */}
                    <div style={{ maxHeight:180, overflowY:'auto', border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', background:'var(--c-bg-card)', marginBottom:8 }}>
                      {(svcSearch.trim()
                        ? allServices.filter(s => s.name.toLowerCase().includes(svcSearch.toLowerCase()))
                        : allServices
                      ).slice(0, 50).map(s => {
                        const svcId = String(s.id ?? s._id);
                        const cartItem = svcCart.find(item => String(item.svc.id ?? item.svc._id) === svcId);
                        const alreadyInBooking = servicesList.some(svc =>
                          !svc.removed && (
                            (svc.serviceId != null && String(svc.serviceId) === svcId) ||
                            (svc.name === s.name)
                          )
                        );
                        return (
                          <div key={svcId} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 12px', borderBottom:'1px solid var(--c-border-light)', background: alreadyInBooking ? 'var(--c-border-light)' : cartItem ? 'rgba(6,64,129,0.04)' : undefined, opacity: alreadyInBooking ? 0.6 : 1 }}>
                            <input
                              type="checkbox"
                              checked={!!cartItem}
                              disabled={alreadyInBooking}
                              onChange={() => {
                                if (alreadyInBooking) return;
                                if (cartItem) setSvcCart(prev => prev.filter(item => String(item.svc.id ?? item.svc._id) !== svcId));
                                else setSvcCart(prev => [...prev, {svc: s, qty: 1}]);
                              }}
                              style={{ cursor: alreadyInBooking ? 'not-allowed' : 'pointer', width:15, height:15, flexShrink:0 }}
                            />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:13, fontWeight: cartItem ? 600 : 400, display:'flex', alignItems:'center', gap:6 }}>
                                {s.name}
                                {alreadyInBooking && (
                                  <span style={{ fontSize:10, background:'#dbeafe', color:'#1d4ed8', padding:'1px 6px', borderRadius:4, fontWeight:700 }}>In booking</span>
                                )}
                              </div>
                              <div style={{ fontSize:11, color:'var(--c-text-muted)' }}>
                                ₹{parseFloat(s.basePrice || 0).toLocaleString('en-IN')} · {s.duration} min
                              </div>
                              {s.category?.adminPercent != null && (
                                <div style={{ fontSize:10, color:'var(--c-text-muted)' }}>
                                  Admin {s.category.adminPercent}% · Partner {s.category.partnerPercent}% · GST {s.category.gstPercent}%
                                </div>
                              )}
                            </div>
                            {cartItem && !alreadyInBooking && (
                              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                <button style={{ width:24, height:24, border:'1px solid var(--c-border)', borderRadius:4, background:'var(--c-bg-card)', cursor:'pointer', fontSize:13, fontWeight:700 }}
                                  onClick={() => setSvcCart(prev => prev.map(item => String(item.svc.id ?? item.svc._id) === svcId ? {...item, qty: Math.max(1, item.qty - 1)} : item))}>–</button>
                                <span style={{ minWidth:20, textAlign:'center', fontSize:13, fontWeight:700 }}>{cartItem.qty}</span>
                                <button style={{ width:24, height:24, border:'1px solid var(--c-border)', borderRadius:4, background:'var(--c-bg-card)', cursor:'pointer', fontSize:13, fontWeight:700 }}
                                  onClick={() => setSvcCart(prev => prev.map(item => String(item.svc.id ?? item.svc._id) === svcId ? {...item, qty: item.qty + 1} : item))}>+</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {allServices.length === 0 && <div style={{ padding:'12px', fontSize:13, color:'var(--c-text-muted)', textAlign:'center' }}>Loading services…</div>}
                    </div>
                    {/* Cart summary */}
                    {svcCart.length > 0 && (
                      <div style={{ fontSize:12, color:'var(--c-text-secondary)', marginBottom:8, display:'flex', justifyContent:'space-between' }}>
                        <span>{svcCart.length} service(s) selected</span>
                        <span style={{ fontWeight:700, color:'var(--c-brand-primary)' }}>
                          ₹{svcCart.reduce((sum, item) => sum + parseFloat(item.svc.basePrice || 0) * item.qty, 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAddServices(selected.id)}
                      disabled={addingSvc || !svcCart.length}
                      style={{ display:'flex', alignItems:'center', gap:6 }}>
                      {addingSvc ? '…' : <><PlusCircle size={13}/> Add {svcCart.length || ''} Service{svcCart.length !== 1 ? 's' : ''}</>}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:8 }}>
                      <input
                        type="text"
                        placeholder="Label (e.g. Extra stain removal)"
                        value={addonName}
                        onChange={e => setAddonName(e.target.value)}
                        style={{ width:'100%', border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'6px 10px', fontSize:13, background:'var(--c-bg-card)', color:'var(--c-text-primary)', boxSizing:'border-box' }}
                      />
                      <div style={{ display:'flex', gap:8 }}>
                        <input
                          type="number"
                          min="0"
                          placeholder="Amount (₹)"
                          value={addonPrice}
                          onChange={e => setAddonPrice(e.target.value)}
                          style={{ flex:1, border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'6px 10px', fontSize:13, background:'var(--c-bg-card)', color:'var(--c-text-primary)', boxSizing:'border-box' }}
                        />
                        <div style={{ display:'flex', alignItems:'center', gap:6, border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'0 8px' }}>
                          <button style={{ width:22, height:22, border:'1px solid var(--c-border)', borderRadius:4, background:'var(--c-bg-card)', cursor:'pointer', fontSize:13, fontWeight:700 }}
                            onClick={() => setAddonQty(q => Math.max(1, q - 1))}>–</button>
                          <span style={{ minWidth:18, textAlign:'center', fontSize:13, fontWeight:700 }}>{addonQty}</span>
                          <button style={{ width:22, height:22, border:'1px solid var(--c-border)', borderRadius:4, background:'var(--c-bg-card)', cursor:'pointer', fontSize:13, fontWeight:700 }}
                            onClick={() => setAddonQty(q => q + 1)}>+</button>
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAddAddon(selected.id)}
                      disabled={addingAddon || !addonName.trim() || !(parseFloat(addonPrice) >= 0)}
                      style={{ display:'flex', alignItems:'center', gap:6 }}>
                      {addingAddon ? '…' : <><PlusCircle size={13}/> Add Add-on</>}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Reschedule Booking ── */}
            {!['completed','cancelled'].includes(selected.status) && (
              <div style={{ background:'var(--c-border-light)', borderRadius:'var(--r-md)', padding:16 }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--c-text-secondary)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                  <CalendarClock size={14} /> Reschedule Booking
                </div>
                <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                  <input
                    type="datetime-local"
                    value={rescheduleDate}
                    min={toLocalInputValue(new Date(Date.now() + ONE_HOUR_MS))}
                    max={toLocalInputValue(new Date(Date.now() + ONE_MONTH_MS))}
                    onChange={e => { setRescheduleDate(e.target.value); setRescheduleError(validateRescheduleDate(e.target.value)); }}
                    style={{ flex:1, border:`1px solid ${rescheduleError ? 'var(--c-danger)' : 'var(--c-border)'}`, borderRadius:'var(--r-sm)', padding:'6px 10px', fontSize:13, background:'var(--c-bg-card)', color:'var(--c-text-primary)' }}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleReschedule(selected.id)}
                    disabled={rescheduling || !rescheduleDate || !!rescheduleError}
                    style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {rescheduling ? '…' : <><CalendarClock size={13}/> Reschedule</>}
                  </button>
                </div>
                {rescheduleError && (
                  <div style={{ fontSize:11, color:'var(--c-danger)', marginBottom:8 }}>{rescheduleError}</div>
                )}
                <div style={{ fontSize:11, color:'var(--c-text-muted)', marginBottom:8 }}>
                  Must be at least 1 hour from now and no more than 1 month in advance.
                </div>
                <input
                  type="text"
                  placeholder="Reason (optional)…"
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                  style={{ width:'100%', border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'6px 10px', fontSize:13, background:'var(--c-bg-card)', color:'var(--c-text-primary)', boxSizing:'border-box' }}
                />
              </div>
            )}

            {/* ── Reassign Partner ── */}
            {!['completed','cancelled'].includes(selected.status) && (
              <div style={{ background:'var(--c-border-light)', borderRadius:'var(--r-md)', padding:16 }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--c-text-secondary)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                  <UserCheck size={14} /> Assign / Change Partner
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <select
                    value={reassignId}
                    onChange={e => setReassignId(e.target.value)}
                    style={{ flex:1, border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'6px 10px', fontSize:13, background:'var(--c-bg-card)', color:'var(--c-text-primary)' }}>
                    <option value="">{partners.length ? 'Select approved partner…' : 'No partners in this city'}</option>
                    {partners.map(p => (
                      <option key={p.id ?? p._id} value={String(p.id ?? p._id)}>
                        {p.name}{p.phone ? ` · ${p.phone}` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleReassign(selected.id)}
                    disabled={reassigning || !reassignId}
                    style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {reassigning ? '…' : <><UserCheck size={13}/> Assign</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showAddPackageModal}
        onClose={() => { setShowAddPackageModal(false); setPickingPackage(null); setFlexiblePicks([]); }}
        title={pickingPackage ? pickingPackage.title : 'Add Package to Booking'}
        size="md"
        footer={pickingPackage ? (
          <>
            <button className="btn btn-outline" onClick={() => setPickingPackage(null)}>← Back to packages</button>
            <button
              className="btn btn-primary"
              disabled={addingPackage || flexiblePicks.length !== pickingPackage.serviceCount}
              onClick={() => selected && handleAddPackage(selected.id, pickingPackage.id, flexiblePicks.map(id => ({ id, qty: 1 })))}
              style={{ display:'flex', alignItems:'center', gap:6 }}>
              {addingPackage ? 'Adding…' : <><PlusCircle size={15}/> Add Package — ₹{parseFloat(pickingPackage.price).toLocaleString('en-IN')}</>}
            </button>
          </>
        ) : null}
      >
        {!pickingPackage ? (
          loadingPackages ? (
            <div style={{ padding:'40px 0', fontSize:14, color:'var(--c-text-muted)', textAlign:'center' }}>Loading packages…</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14 }}>
              {addablePackages.map(pkg => (
                <div key={pkg.id} style={{ border:'1px solid var(--c-border)', borderRadius:'var(--r-md)', padding:16, display:'flex', flexDirection:'column', gap:10 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:15, fontWeight:700, flex:1 }}>{pkg.title}</span>
                      <span style={{
                        fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px',
                        padding:'2px 8px', borderRadius:20,
                        background: pkg.packageType === 'fixed' ? '#dcfce7' : '#dbeafe',
                        color: pkg.packageType === 'fixed' ? '#166534' : '#1d4ed8',
                      }}>
                        {pkg.packageType === 'fixed' ? 'Fixed' : 'Flexible'}
                      </span>
                    </div>
                    <div style={{ fontSize:20, fontWeight:800, color:'var(--c-brand-primary)' }}>
                      ₹{parseFloat(pkg.price).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div style={{ fontSize:12, color:'var(--c-text-muted)', flex:1, lineHeight:1.6 }}>
                    {pkg.packageType === 'fixed'
                      ? (pkg.services || []).slice(0, 5).map((s, i) => (
                          <div key={i}>• {s.name}</div>
                        ))
                      : <div>Customer picks any {pkg.serviceCount} service{pkg.serviceCount !== 1 ? 's' : ''}{pkg.categoryId ? ' from this category' : ''}.</div>
                    }
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    disabled={addingPackage}
                    onClick={() => pkg.packageType === 'fixed' ? handleAddFixedPackage(selected.id, pkg) : setPickingPackage(pkg)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    {pkg.packageType === 'fixed'
                      ? (addingPackage ? 'Adding…' : <><PlusCircle size={13}/> Add to Booking</>)
                      : 'Choose Services →'}
                  </button>
                </div>
              ))}
              {addablePackages.length === 0 && (
                <div style={{ gridColumn:'1 / -1', padding:'40px 0', fontSize:14, color:'var(--c-text-muted)', textAlign:'center' }}>
                  {availablePackages.length === 0 ? 'No packages available.' : 'All available packages are already on this booking.'}
                </div>
              )}
            </div>
          )
        ) : (
          <>
            <div style={{ marginBottom:12, fontSize:13, color:'var(--c-text-secondary)' }}>
              Pick exactly <strong>{pickingPackage.serviceCount}</strong> service{pickingPackage.serviceCount !== 1 ? 's' : ''} for this package
              <span style={{ float:'right', fontWeight:700, color: flexiblePicks.length === pickingPackage.serviceCount ? 'var(--c-success)' : 'var(--c-text-secondary)' }}>
                {flexiblePicks.length} / {pickingPackage.serviceCount} selected
              </span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:420, overflowY:'auto' }}>
              {allServices
                .filter(s => !pickingPackage.categoryId || s.categoryId === pickingPackage.categoryId)
                .map(s => {
                  const svcId = s.id ?? s._id;
                  const picked = flexiblePicks.includes(svcId);
                  const disabled = !picked && flexiblePicks.length >= pickingPackage.serviceCount;
                  return (
                    <div
                      key={svcId}
                      onClick={() => !disabled && toggleFlexiblePick(svcId)}
                      style={{
                        display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                        border: `1.5px solid ${picked ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
                        borderRadius:'var(--r-sm)', background: picked ? 'rgba(6,64,129,0.05)' : 'var(--c-bg-card)',
                        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
                      }}>
                      <input type="checkbox" checked={picked} disabled={disabled} readOnly style={{ width:16, height:16, flexShrink:0, cursor:'inherit' }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight: picked ? 700 : 500 }}>{s.name}</div>
                        <div style={{ fontSize:12, color:'var(--c-text-muted)' }}>₹{parseFloat(s.basePrice || 0).toLocaleString('en-IN')} · {s.duration} min</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </Modal>

      <NewBookingModal
        isOpen={showNewBooking}
        onClose={() => setShowNewBooking(false)}
        onCreated={() => { setShowNewBooking(false); loadBookings(); showToast('Booking created for customer.', 'success'); }}
      />
    </div>
  );
}

// ── New Booking (support/admin creates a booking on a customer's behalf, e.g. a
// phone-support call requesting a one-time service) ──────────────────────────────
function NewBookingModal({ isOpen, onClose, onCreated }) {
  const { showToast } = useAuth();

  const [userSearch, setUserSearch]     = useState('');
  const [userResults, setUserResults]   = useState([]);
  const [searchingUser, setSearchingUser] = useState(false);
  const [customer, setCustomer]         = useState(null); // full user record incl. addresses

  const [addressMode, setAddressMode]   = useState('saved'); // 'saved' | 'new'
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddress, setNewAddress]     = useState({ label:'Home', line1:'', line2:'', city:'', state:'', pincode:'' });

  const [allServices, setAllServices]   = useState([]);
  const [cart, setCart]                 = useState([]); // [{type:'catalog', svc, qty} | {type:'addon', name, price, qty}]
  const [svcSearch, setSvcSearch]       = useState('');
  const [addMode, setAddMode]           = useState('catalog'); // 'catalog' | 'addon'
  const [addonName, setAddonName]       = useState('');
  const [addonPrice, setAddonPrice]     = useState('');
  const [addonQty, setAddonQty]         = useState(1);

  const [scheduleValue, setScheduleValue] = useState('');
  const [paymentMode, setPaymentMode]   = useState('cod');
  const [notes, setNotes]               = useState('');
  const [submitting, setSubmitting]     = useState(false);

  const resetAll = () => {
    setUserSearch(''); setUserResults([]); setCustomer(null);
    setAddressMode('saved'); setSelectedAddressId('');
    setNewAddress({ label:'Home', line1:'', line2:'', city:'', state:'', pincode:'' });
    setCart([]); setSvcSearch(''); setAddMode('catalog');
    setAddonName(''); setAddonPrice(''); setAddonQty(1);
    setScheduleValue(''); setPaymentMode('cod'); setNotes('');
  };

  useEffect(() => {
    if (!isOpen) return;
    resetAll();
    if (allServices.length === 0) {
      api.get('/api/v1/admin/services', { params: { limit: 500 } })
        .then(res => setAllServices(res.data?.data?.data ?? res.data?.data ?? []))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !userSearch.trim()) { setUserResults([]); return; }
    setSearchingUser(true);
    const t = setTimeout(() => {
      api.get('/api/v1/admin/users', { params: { search: userSearch.trim(), limit: 10 } })
        .then(res => setUserResults(res.data?.data?.data ?? res.data?.data ?? []))
        .catch(() => setUserResults([]))
        .finally(() => setSearchingUser(false));
    }, 350);
    return () => clearTimeout(t);
  }, [userSearch, isOpen]);

  const selectCustomer = async (u) => {
    setUserResults([]);
    setUserSearch(u.name || u.phone);
    try {
      const res = await api.get(`/api/v1/admin/users/${u.id ?? u._id}`);
      const full = res.data?.data ?? u;
      setCustomer(full);
      const addresses = full.addresses ?? [];
      const def = addresses.find(a => a.isDefault) ?? addresses[0];
      if (def) { setAddressMode('saved'); setSelectedAddressId(String(def.id)); }
      else { setAddressMode('new'); }
    } catch {
      setCustomer(u);
      setAddressMode('new');
    }
  };

  const addonTotal = cart.reduce((sum, item) => {
    const price = item.type === 'catalog' ? parseFloat(item.svc.basePrice || 0) : parseFloat(item.price || 0);
    return sum + price * item.qty;
  }, 0);

  const validateSchedule = () => {
    if (!scheduleValue) return 'Please choose a date & time.';
    const time = new Date(scheduleValue).getTime();
    if (Number.isNaN(time)) return 'Please select a valid date & time.';
    const now = Date.now();
    if (time < now + ONE_HOUR_MS) return 'Must be scheduled at least 1 hour from now.';
    if (time > now + ONE_MONTH_MS) return 'Cannot be scheduled more than 1 month in advance.';
    return '';
  };

  const handleSubmit = async () => {
    if (!customer) { showToast('Please select a customer.', 'warning'); return; }
    if (!cart.length) { showToast('Add at least one service.', 'warning'); return; }

    let address;
    if (addressMode === 'saved') {
      const saved = (customer.addresses ?? []).find(a => String(a.id) === selectedAddressId);
      if (!saved) { showToast('Please select a saved address.', 'warning'); return; }
      address = { label: saved.label, line1: saved.line1, line2: saved.line2, city: saved.city, state: saved.state, pincode: saved.pincode, lat: saved.lat, lng: saved.lng };
    } else {
      if (!newAddress.line1.trim() || !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.pincode.trim()) {
        showToast('Please fill in address line, city, state and pincode.', 'warning'); return;
      }
      address = newAddress;
    }

    const scheduleError = validateSchedule();
    if (scheduleError) { showToast(scheduleError, 'warning'); return; }

    const services = cart.map(item => item.type === 'catalog'
      ? { id: item.svc.id ?? item.svc._id, qty: item.qty }
      : { isAddOn: true, name: item.name, price: item.price, qty: item.qty });

    setSubmitting(true);
    try {
      await api.post('/api/v1/admin/bookings', {
        userId: customer.id ?? customer._id,
        services,
        address,
        scheduledAt: new Date(scheduleValue).toISOString(),
        paymentMode,
        notes: notes || undefined,
      });
      onCreated();
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to create booking.';
      showToast(msg, 'danger');
    }
    setSubmitting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Booking for Customer" size="lg" footer={
      <>
        <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting} style={{ display:'flex', alignItems:'center', gap:6 }}>
          {submitting ? 'Creating…' : <>Create Booking{cart.length ? ` · ₹${fmt(addonTotal)}` : ''}</>}
        </button>
      </>
    }>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {/* Customer */}
        <InfoBlock label="Customer">
          {!customer ? (
            <div style={{ position:'relative' }}>
              <input
                type="text"
                placeholder="Search by name or phone…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                style={{ width:'100%', border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'7px 10px', fontSize:13, background:'var(--c-bg-card)', color:'var(--c-text-primary)', boxSizing:'border-box' }}
              />
              {(userResults.length > 0 || searchingUser) && (
                <div style={{ position:'absolute', zIndex:5, top:'calc(100% + 4px)', left:0, right:0, maxHeight:200, overflowY:'auto', border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', background:'var(--c-bg-card)', boxShadow:'0 4px 12px rgba(0,0,0,0.12)' }}>
                  {searchingUser && <div style={{ padding:10, fontSize:12, color:'var(--c-text-muted)' }}>Searching…</div>}
                  {userResults.map(u => (
                    <div key={u.id ?? u._id} onClick={() => selectCustomer(u)}
                      style={{ padding:'8px 10px', cursor:'pointer', borderBottom:'1px solid var(--c-border-light)', fontSize:13 }}
                      onMouseDown={e => e.preventDefault()}>
                      <div style={{ fontWeight:600 }}>{u.name || 'Unnamed'}</div>
                      <div style={{ fontSize:11, color:'var(--c-text-muted)' }}>{u.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>{customer.name || 'Unnamed'}</div>
                <div style={{ fontSize:12, color:'var(--c-text-muted)' }}>{customer.phone}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setCustomer(null); setUserSearch(''); }}>Change</button>
            </div>
          )}
        </InfoBlock>

        {/* Address */}
        {customer && (
          <InfoBlock label="Service Address">
            <div style={{ display:'flex', background:'var(--c-border-light)', borderRadius:'var(--r-sm)', padding:3, marginBottom:10 }}>
              <button onClick={() => setAddressMode('saved')} style={{ flex:1, border:'none', borderRadius:4, padding:'6px 0', fontSize:12, fontWeight:600, cursor:'pointer', background: addressMode === 'saved' ? 'var(--c-brand-primary)' : 'transparent', color: addressMode === 'saved' ? '#fff' : 'var(--c-text-secondary)' }}>
                Saved Address
              </button>
              <button onClick={() => setAddressMode('new')} style={{ flex:1, border:'none', borderRadius:4, padding:'6px 0', fontSize:12, fontWeight:600, cursor:'pointer', background: addressMode === 'new' ? 'var(--c-brand-primary)' : 'transparent', color: addressMode === 'new' ? '#fff' : 'var(--c-text-secondary)' }}>
                New Address
              </button>
            </div>

            {addressMode === 'saved' ? (
              (customer.addresses ?? []).length === 0 ? (
                <div style={{ fontSize:12, color:'var(--c-text-muted)' }}>This customer has no saved addresses. Use "New Address" instead.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {customer.addresses.map(a => (
                    <label key={a.id} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:8, border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', cursor:'pointer', background: String(a.id) === selectedAddressId ? 'rgba(6,64,129,0.06)' : 'var(--c-bg-card)' }}>
                      <input type="radio" checked={String(a.id) === selectedAddressId} onChange={() => setSelectedAddressId(String(a.id))} style={{ marginTop:2 }} />
                      <div style={{ fontSize:12 }}>
                        <div style={{ fontWeight:600 }}>{a.label}</div>
                        <div style={{ color:'var(--c-text-muted)' }}>{[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ')}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { key:'label', placeholder:'Label (e.g. Home, Office)' },
                  { key:'line1', placeholder:'Address line 1' },
                  { key:'line2', placeholder:'Address line 2 (optional)' },
                  { key:'city', placeholder:'City' },
                  { key:'state', placeholder:'State' },
                  { key:'pincode', placeholder:'Pincode' },
                ].map(f => (
                  <input key={f.key} type="text" placeholder={f.placeholder} value={newAddress[f.key]}
                    onChange={e => setNewAddress(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width:'100%', border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'6px 10px', fontSize:13, background:'var(--c-bg-card)', color:'var(--c-text-primary)', boxSizing:'border-box' }} />
                ))}
              </div>
            )}
          </InfoBlock>
        )}

        {/* Services */}
        {customer && (
          <InfoBlock label="Services">
            <div style={{ display:'flex', background:'var(--c-border-light)', borderRadius:'var(--r-sm)', padding:3, marginBottom:10 }}>
              <button onClick={() => setAddMode('catalog')} style={{ flex:1, border:'none', borderRadius:4, padding:'6px 0', fontSize:12, fontWeight:600, cursor:'pointer', background: addMode === 'catalog' ? 'var(--c-brand-primary)' : 'transparent', color: addMode === 'catalog' ? '#fff' : 'var(--c-text-secondary)' }}>
                From Catalog
              </button>
              <button onClick={() => setAddMode('addon')} style={{ flex:1, border:'none', borderRadius:4, padding:'6px 0', fontSize:12, fontWeight:600, cursor:'pointer', background: addMode === 'addon' ? 'var(--c-brand-primary)' : 'transparent', color: addMode === 'addon' ? '#fff' : 'var(--c-text-secondary)' }}>
                One-Time / Custom Service
              </button>
            </div>

            {addMode === 'catalog' ? (
              <>
                <input type="text" placeholder="Filter services…" value={svcSearch} onChange={e => setSvcSearch(e.target.value)}
                  style={{ width:'100%', border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'6px 10px', fontSize:13, background:'var(--c-bg-card)', color:'var(--c-text-primary)', marginBottom:8, boxSizing:'border-box' }} />
                <div style={{ maxHeight:160, overflowY:'auto', border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', background:'var(--c-bg-card)', marginBottom:8 }}>
                  {(svcSearch.trim() ? allServices.filter(s => s.name.toLowerCase().includes(svcSearch.toLowerCase())) : allServices).slice(0, 50).map(s => {
                    const svcId = String(s.id ?? s._id);
                    const cartItem = cart.find(item => item.type === 'catalog' && String(item.svc.id ?? item.svc._id) === svcId);
                    return (
                      <div key={svcId} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 12px', borderBottom:'1px solid var(--c-border-light)', background: cartItem ? 'rgba(6,64,129,0.04)' : undefined }}>
                        <input type="checkbox" checked={!!cartItem}
                          onChange={() => {
                            if (cartItem) setCart(prev => prev.filter(item => !(item.type === 'catalog' && String(item.svc.id ?? item.svc._id) === svcId)));
                            else setCart(prev => [...prev, { type:'catalog', svc:s, qty:1 }]);
                          }}
                          style={{ cursor:'pointer', width:15, height:15, flexShrink:0 }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight: cartItem ? 600 : 400 }}>{s.name}</div>
                          <div style={{ fontSize:11, color:'var(--c-text-muted)' }}>₹{parseFloat(s.basePrice || 0).toLocaleString('en-IN')} · {s.duration} min</div>
                        </div>
                        {cartItem && (
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <button style={{ width:24, height:24, border:'1px solid var(--c-border)', borderRadius:4, background:'var(--c-bg-card)', cursor:'pointer', fontWeight:700 }}
                              onClick={() => setCart(prev => prev.map(item => (item.type === 'catalog' && String(item.svc.id ?? item.svc._id) === svcId) ? {...item, qty: Math.max(1, item.qty-1)} : item))}>–</button>
                            <span style={{ minWidth:20, textAlign:'center', fontSize:13, fontWeight:700 }}>{cartItem.qty}</span>
                            <button style={{ width:24, height:24, border:'1px solid var(--c-border)', borderRadius:4, background:'var(--c-bg-card)', cursor:'pointer', fontWeight:700 }}
                              onClick={() => setCart(prev => prev.map(item => (item.type === 'catalog' && String(item.svc.id ?? item.svc._id) === svcId) ? {...item, qty: item.qty+1} : item))}>+</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {allServices.length === 0 && <div style={{ padding:12, fontSize:13, color:'var(--c-text-muted)', textAlign:'center' }}>Loading services…</div>}
                </div>
              </>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:8 }}>
                <input type="text" placeholder="Label (e.g. Custom bridal package requested by phone)" value={addonName} onChange={e => setAddonName(e.target.value)}
                  style={{ width:'100%', border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'6px 10px', fontSize:13, background:'var(--c-bg-card)', color:'var(--c-text-primary)', boxSizing:'border-box' }} />
                <div style={{ display:'flex', gap:8 }}>
                  <input type="number" min="0" placeholder="Amount (₹)" value={addonPrice} onChange={e => setAddonPrice(e.target.value)}
                    style={{ flex:1, border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'6px 10px', fontSize:13, background:'var(--c-bg-card)', color:'var(--c-text-primary)', boxSizing:'border-box' }} />
                  <div style={{ display:'flex', alignItems:'center', gap:6, border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'0 8px' }}>
                    <button style={{ width:22, height:22, border:'1px solid var(--c-border)', borderRadius:4, background:'var(--c-bg-card)', cursor:'pointer', fontWeight:700 }} onClick={() => setAddonQty(q => Math.max(1, q-1))}>–</button>
                    <span style={{ minWidth:18, textAlign:'center', fontSize:13, fontWeight:700 }}>{addonQty}</span>
                    <button style={{ width:22, height:22, border:'1px solid var(--c-border)', borderRadius:4, background:'var(--c-bg-card)', cursor:'pointer', fontWeight:700 }} onClick={() => setAddonQty(q => q+1)}>+</button>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm" style={{ alignSelf:'flex-start', display:'flex', alignItems:'center', gap:6 }}
                  disabled={!addonName.trim() || !(parseFloat(addonPrice) >= 0)}
                  onClick={() => {
                    setCart(prev => [...prev, { type:'addon', name: addonName.trim(), price: parseFloat(addonPrice), qty: addonQty }]);
                    setAddonName(''); setAddonPrice(''); setAddonQty(1);
                  }}>
                  <PlusCircle size={13}/> Add to Booking
                </button>
              </div>
            )}

            {cart.length > 0 && (
              <div style={{ borderTop:'1px solid var(--c-border)', paddingTop:8, marginTop:4 }}>
                {cart.map((item, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, padding:'3px 0' }}>
                    <span>
                      {item.type === 'catalog' ? item.svc.name : item.name}
                      {item.type === 'addon' && <span style={{ marginLeft:6, fontSize:10, background:'#fff3e4', color:'#c87b1a', padding:'1px 6px', borderRadius:4, fontWeight:700 }}>One-time</span>}
                      {' '}× {item.qty}
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontWeight:600 }}>₹{fmt((item.type === 'catalog' ? item.svc.basePrice : item.price) * item.qty)}</span>
                      <button className="btn btn-ghost btn-icon" style={{ width:20, height:20 }} onClick={() => setCart(prev => prev.filter((_, idx) => idx !== i))}><XCircle size={13} /></button>
                    </span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:13, marginTop:6, borderTop:'1px solid var(--c-border)', paddingTop:6 }}>
                  <span>Total</span><span>₹{fmt(addonTotal)}</span>
                </div>
              </div>
            )}
          </InfoBlock>
        )}

        {/* Schedule / Payment / Notes */}
        {customer && (
          <InfoBlock label="Schedule & Payment">
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input type="datetime-local" value={scheduleValue} onChange={e => setScheduleValue(e.target.value)}
                min={toLocalInputValue(new Date(Date.now() + ONE_HOUR_MS))}
                max={toLocalInputValue(new Date(Date.now() + ONE_MONTH_MS))}
                style={{ flex:1, border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'6px 10px', fontSize:13, background:'var(--c-bg-card)', color:'var(--c-text-primary)' }} />
              <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}
                style={{ border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'6px 10px', fontSize:13, background:'var(--c-bg-card)', color:'var(--c-text-primary)' }}>
                <option value="cod">Cash on Delivery</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div style={{ fontSize:11, color:'var(--c-text-muted)', marginBottom:8 }}>Bookings must be 1 hour to 1 month out, between 8 AM–8 PM.</div>
            <textarea placeholder="Notes (e.g. requested via phone support call)" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              style={{ width:'100%', border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'6px 10px', fontSize:13, background:'var(--c-bg-card)', color:'var(--c-text-primary)', boxSizing:'border-box', resize:'vertical' }} />
          </InfoBlock>
        )}
      </div>
    </Modal>
  );
}

function InfoBlock({ label, children }) {
  return (
    <div style={{ background:'var(--c-border-light)', borderRadius:'var(--r-md)', padding:'12px 14px' }}>
      <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--c-text-secondary)', marginBottom:8 }}>{label}</div>
      {children}
    </div>
  );
}

function AmtRow({ label, value, dimValue }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <span style={{ fontSize:12, opacity: dimValue ? 0.75 : 1 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:600, opacity: dimValue ? 0.85 : 1 }}>{value}</span>
    </div>
  );
}
