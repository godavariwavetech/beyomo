import React, {useState, useCallback} from 'react';
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
import {resolveImageUrl} from '../../utils/utils';
import {useAppAlert} from '../../hooks/useAppAlert';
import AppAlertModal from '../../components/AppAlertModal/AppAlertModal';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=90&fit=crop';

const parseServices = (s: any): any[] => {
  if (Array.isArray(s)) return s;
  if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
  return [];
};

const JobChecklistScreen = ({navigation, route}: any) => {
  const insets = useSafeAreaInsets();
  const [job, setJob] = useState<any>(route?.params?.job ?? null);
  const [services, setServices] = useState<any[]>(() => parseServices(route?.params?.job?.services));
  const [totalAmount, setTotalAmount] = useState<number>(Number(route?.params?.job?.totalAmount ?? 0));
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);

  // Approval flow state — restore from the booking's own fields on mount so a pending
  // request you sent before closing the app still shows as pending when you reopen it,
  // instead of resetting to idle and only showing on the customer's side.
  type ApprovalStatus = 'idle' | 'pending' | 'approved' | 'rejected';
  const parsePendingUpdate = (j: any) => {
    const p = j?.pendingServicesUpdate;
    if (!p) return null;
    if (typeof p === 'string') { try { return JSON.parse(p); } catch { return null; } }
    return p;
  };
  const initialJob = route?.params?.job;
  const initialPendingUpdate = parsePendingUpdate(initialJob);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(
    initialJob?.serviceUpdatePending ? 'pending' : 'idle',
  );
  const [pendingProposedServices, setPendingProposedServices] = useState<any[]>(
    initialJob?.serviceUpdatePending ? (initialPendingUpdate?.services ?? []) : [],
  );
  const [pendingTotal, setPendingTotal] = useState<number>(
    initialJob?.serviceUpdatePending ? Number(initialPendingUpdate?.totalAmount ?? 0) : 0,
  );
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Add service modal
  const [showModal, setShowModal] = useState(false);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [loadingSvcs, setLoadingSvcs] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSvc, setSelectedSvc] = useState<any>(null);
  const [addQty, setAddQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const {alertConfig, showAlert, hideAlert} = useAppAlert();

  const fetchAllServices = useCallback(async () => {
    setLoadingSvcs(true);
    const svcPath = endpoints.SERVICES.replace(/^\//, '');
    const result = await networkCall(`${svcPath}?limit=500`, 'GET');
    const raw = result.response?.data ?? result.response ?? [];
    setAllServices(Array.isArray(raw) ? raw : []);
    setLoadingSvcs(false);
  }, []);

  const openModal = () => {
    setSelectedSvc(null); setAddQty(1); setSearch('');
    if (allServices.length === 0) fetchAllServices();
    setShowModal(true);
  };

  // Add a brand new service to the local list
  const handleAddService = async () => {
    if (!selectedSvc) return;
    setAdding(true);
    const newSvc = {
      serviceId: selectedSvc.id,
      name: selectedSvc.name,
      price: parseFloat(selectedSvc.basePrice),
      qty: addQty,
      duration: selectedSvc.duration || null,
      image: selectedSvc.image || null,
      addedByPartner: true,
      serviceStatus: 'claimed',
    };
    setServices(prev => [...prev, newSvc]);
    setShowModal(false);
    setAdding(false);
  };

  // Edit qty of existing service
  const updateQty = (idx: number, delta: number) => {
    setServices(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const newQty = Math.max(1, (s.qty || 1) + delta);
      return {...s, qty: newQty};
    }));
  };

  // Delete a service
  const deleteService = (idx: number) => {
    showAlert('Remove Service', `Remove "${services[idx]?.name}" from this booking?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Remove', style: 'destructive', onPress: () =>
        setServices(prev => prev.filter((_, i) => i !== idx))},
    ]);
  };

  // Recalculate total from local services
  const recalcTotal = (svcs: any[]) => {
    const base = svcs.reduce((s, i) => s + (parseFloat(i.price) || 0) * (i.qty || 1), 0);
    const coupon = parseFloat(job?.couponDiscountAmount || 0);
    const taxable = base - coupon;
    const tax = taxable * 0.05; // GST — backend recomputes the authoritative weighted rate on submit
    return parseFloat((taxable + tax).toFixed(2));
  };

  // Submit proposed changes to backend → customer approves
  const handleSubmitChanges = async () => {
    if (!job?.id) return;
    setSubmitting(true);
    try {
      const res = await api.patch(endpoints.PARTNER_PROPOSE_CHANGES(String(job.id)), {services});
      if (res.data?.status) {
        const newTotal = recalcTotal(services);
        setTotalAmount(newTotal);
        setPendingProposedServices([...services]);
        setPendingTotal(newTotal);
        setApprovalStatus('pending');
      }
    } catch (e: any) {
      showAlert('Error', e.response?.data?.message ?? 'Failed to send changes.');
    }
    setSubmitting(false);
  };

  // The booking only actually moves to "in_progress" here — once the partner has
  // reviewed/confirmed the checklist and is ready to start, not at "Arrived at Location".
  const handleStartService = async () => {
    if (!job?.id) {
      navigation.navigate('ActiveJob', {job: {...job, services, totalAmount: displayTotal}});
      return;
    }
    setStarting(true);
    try {
      await api.patch(endpoints.PARTNER_BOOKING_STATUS(String(job.id)), {status: 'in_progress'});
      navigation.navigate('ActiveJob', {job: {...job, services, totalAmount: displayTotal, status: 'in_progress'}});
    } catch (e: any) {
      showAlert('Error', e.response?.data?.message ?? 'Failed to start service. Please try again.');
    }
    setStarting(false);
  };

  // Polls the single-booking endpoint (not the full list) and reads the explicit
  // lastServiceUpdateDecision field set by the backend — no more guessing approve vs
  // reject from comparing totals. `silent` suppresses alerts for background auto-checks.
  const checkApprovalStatus = async (silent = false) => {
    if (!job?.id) return;
    if (!silent) setCheckingStatus(true);
    try {
      const res = await api.get(endpoints.PARTNER_BOOKING_DETAIL(String(job.id)));
      const updated = res.data?.data;
      if (updated && updated.serviceUpdatePending === false && updated.lastServiceUpdateDecision === 'approved') {
        const approvedSvcs = parseServices(updated.services);
        const updatedTotal = parseFloat(updated.totalAmount ?? 0);
        setApprovalStatus('approved');
        setServices(approvedSvcs);
        setTotalAmount(updatedTotal);
        setJob((prev: any) => ({...prev, services: updated.services, totalAmount: updated.totalAmount}));
      } else if (updated && updated.serviceUpdatePending === false && updated.lastServiceUpdateDecision === 'rejected') {
        setApprovalStatus('rejected');
      } else if (!silent) {
        showAlert('Still Pending', 'The customer has not responded yet.');
      }
    } catch {
      if (!silent) showAlert('Error', 'Could not check status. Please try again.');
    }
    if (!silent) setCheckingStatus(false);
  };

  // Auto-poll while waiting on the customer, so the partner doesn't have to keep
  // tapping "Check Status" manually for the screen to update.
  React.useEffect(() => {
    if (approvalStatus !== 'pending') return;
    const interval = setInterval(() => checkApprovalStatus(true), 6000);
    return () => clearInterval(interval);
  }, [approvalStatus, job?.id]);

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
  const displayTotal = recalcTotal(services);
  const jobTaxAmount = Number(job?.taxAmount ?? 0);
  // What's left after the partner's share and GST (a pass-through, not part of the
  // admin/partner split) is the admin's commission — only meaningful against the
  // booking's last-saved figures, not an unsent local edit (no live recalculation here).
  const adminCommission = Math.max(0, totalAmount - jobTaxAmount - earnings);

  const filteredSvcs = allServices.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()));

  // Check if services differ from original
  const originalServices = parseServices(route?.params?.job?.services);
  const hasChanges = JSON.stringify(services) !== JSON.stringify(originalServices);

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
          <Text style={styles.headerSub}>{orderId} · Arrived at customer</Text>
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

        {/* Services — editable */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>
              Services ({services.length})
            </Text>
            <TouchableOpacity style={styles.addInlineBtn} onPress={openModal} activeOpacity={0.85}>
              <Ionicons name="add-circle-outline" size={sw(14)} color="#105641" />
              <Text style={styles.addInlineText}>Add</Text>
            </TouchableOpacity>
          </View>

          {services.length === 0 && (
            <Text style={styles.emptyServices}>No services. Tap Add to include services.</Text>
          )}

          {services.map((svc: any, idx: number) => {
            const imgUri = resolveImageUrl(svc.image) ?? FALLBACK_IMG;
            const isFree = svc.addedByOffer || svc.price === 0;
            return (
              <View key={idx} style={[styles.svcRow, idx > 0 && styles.svcBorder]}>
                <Image source={{uri: imgUri}} style={styles.svcImg} resizeMode="cover" />
                <View style={{flex: 1}}>
                  <View style={styles.svcNameRow}>
                    <Text style={styles.svcName} numberOfLines={1}>{svc.name}</Text>
                    {svc.addedByPartner && (
                      <View style={styles.addedBadge}><Text style={styles.addedBadgeText}>Added</Text></View>
                    )}
                    {isFree && (
                      <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>
                    )}
                  </View>
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
                    {isFree ? 'FREE' : `₹${Number(svc.price * (svc.qty || 1)).toLocaleString('en-IN')}`}
                  </Text>
                  <TouchableOpacity onPress={() => deleteService(idx)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                    <Ionicons name="trash-outline" size={sw(16)} color="#DB1919" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>New Total</Text>
            <Text style={[styles.totalValue, hasChanges && {color: '#C87B1A'}]}>
              ₹{displayTotal.toLocaleString('en-IN')}
              {hasChanges && ' *'}
            </Text>
          </View>
          {hasChanges && approvalStatus === 'idle' && (
            <Text style={styles.changesNote}>* Unsent changes. Tap "Send for Approval" below.</Text>
          )}
          {approvalStatus === 'pending' && (
            <Text style={[styles.changesNote, {color: '#C87B1A'}]}>Changes sent — awaiting customer approval.</Text>
          )}
        </View>

        {/* Earnings */}
        <LinearGradient colors={['#0E5843', '#022723']} style={styles.earningsCard}
          start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
          <View style={styles.earningsTopRow}>
            <View>
              <Text style={styles.earningsLabel}>Your Earnings</Text>
              <Text style={styles.earningsValue}>₹{(hasChanges ? displayTotal : earnings).toLocaleString('en-IN')}</Text>
            </View>
            <Ionicons name="cash-outline" size={sw(40)} color="rgba(255,255,255,0.2)" />
          </View>
          {!hasChanges && (
            <View style={styles.earningsBreakdown}>
              <View style={styles.earningsBreakdownRow}>
                <Text style={styles.earningsBreakdownLabel}>Total Booking Amount</Text>
                <Text style={styles.earningsBreakdownVal}>₹{totalAmount.toLocaleString('en-IN')}</Text>
              </View>
              {jobTaxAmount > 0 && (
                <View style={styles.earningsBreakdownRow}>
                  <Text style={styles.earningsBreakdownLabel}>GST (pass-through)</Text>
                  <Text style={styles.earningsBreakdownVal}>–₹{jobTaxAmount.toLocaleString('en-IN')}</Text>
                </View>
              )}
              <View style={styles.earningsBreakdownRow}>
                <Text style={styles.earningsBreakdownLabel}>Admin Commission</Text>
                <Text style={styles.earningsBreakdownVal}>–₹{adminCommission.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Approval status card */}
        {approvalStatus === 'pending' && (
          <View style={styles.approvalCard}>
            <View style={styles.approvalHeader}>
              <Ionicons name="time-outline" size={sw(18)} color="#C87B1A" />
              <Text style={styles.approvalTitle}>Awaiting Customer Approval</Text>
            </View>
            <Text style={styles.approvalSub}>The following changes have been sent to the customer:</Text>
            {pendingProposedServices.map((svc: any, idx: number) => (
              <View key={idx} style={styles.approvalSvcRow}>
                <Text style={styles.approvalSvcName} numberOfLines={1}>
                  {svc.name}{svc.qty > 1 ? ` ×${svc.qty}` : ''}
                  {svc.addedByPartner ? '  (Added)' : ''}
                </Text>
                <Text style={styles.approvalSvcPrice}>₹{Number((svc.price || 0) * (svc.qty || 1)).toLocaleString('en-IN')}</Text>
              </View>
            ))}
            <View style={styles.approvalTotalRow}>
              <Text style={styles.approvalTotalLabel}>Proposed Total</Text>
              <Text style={styles.approvalTotalVal}>₹{pendingTotal.toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity
              style={[styles.refreshBtn, checkingStatus && {opacity: 0.6}]}
              onPress={() => checkApprovalStatus()}
              disabled={checkingStatus}
              activeOpacity={0.8}>
              {checkingStatus
                ? <ActivityIndicator size="small" color="#C87B1A" />
                : <><Ionicons name="refresh-outline" size={sw(14)} color="#C87B1A" /><Text style={styles.refreshBtnText}>Check Status</Text></>
              }
            </TouchableOpacity>
          </View>
        )}

        {approvalStatus === 'approved' && (
          <View style={[styles.approvalCard, styles.approvalCardGreen]}>
            <View style={styles.approvalHeader}>
              <Ionicons name="checkmark-circle" size={sw(18)} color="#16a34a" />
              <Text style={[styles.approvalTitle, {color: '#16a34a'}]}>Customer Approved!</Text>
            </View>
            <Text style={[styles.approvalSub, {color: '#166534'}]}>The customer approved your service changes.</Text>
            {services.map((svc: any, idx: number) => (
              <View key={idx} style={styles.approvalSvcRow}>
                <Text style={[styles.approvalSvcName, {color: '#14532d'}]} numberOfLines={1}>
                  {svc.name}{svc.qty > 1 ? ` ×${svc.qty}` : ''}
                </Text>
                <Text style={[styles.approvalSvcPrice, {color: '#16a34a'}]}>₹{Number((svc.price || 0) * (svc.qty || 1)).toLocaleString('en-IN')}</Text>
              </View>
            ))}
            <View style={styles.approvalTotalRow}>
              <Text style={styles.approvalTotalLabel}>Approved Total</Text>
              <Text style={[styles.approvalTotalVal, {color: '#16a34a'}]}>₹{totalAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        )}

        {approvalStatus === 'rejected' && (
          <View style={[styles.approvalCard, styles.approvalCardRed]}>
            <View style={styles.approvalHeader}>
              <Ionicons name="close-circle" size={sw(18)} color="#dc2626" />
              <Text style={[styles.approvalTitle, {color: '#dc2626'}]}>Changes Rejected</Text>
            </View>
            <Text style={[styles.approvalSub, {color: '#7f1d1d'}]}>The customer rejected your proposed changes. You can edit and resend.</Text>
          </View>
        )}

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
        {approvalStatus === 'pending' ? (
          <TouchableOpacity style={[styles.btn, styles.btnWarning, {opacity: 0.65}]}
            onPress={() => checkApprovalStatus()} disabled={checkingStatus} activeOpacity={0.88}>
            {checkingStatus ? <ActivityIndicator color="#FFFFFF" /> : (
              <><Ionicons name="time-outline" size={sw(18)} color="#FFFFFF" />
              <Text style={styles.btnText}>Waiting for Customer · Tap to Refresh</Text></>
            )}
          </TouchableOpacity>
        ) : hasChanges && approvalStatus !== 'approved' ? (
          <TouchableOpacity style={[styles.btn, styles.btnWarning, submitting && {opacity: 0.6}]}
            onPress={handleSubmitChanges} disabled={submitting} activeOpacity={0.88}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : (
              <><Ionicons name="send-outline" size={sw(18)} color="#FFFFFF" />
              <Text style={styles.btnText}>
                {approvalStatus === 'rejected' ? 'Resend for Approval' : 'Send for Approval'}
              </Text></>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btn}
            onPress={handleStartService}
            disabled={starting}
            activeOpacity={0.88}>
            <LinearGradient colors={['#0E5843', '#022723']} style={styles.btnGradient}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
              {starting ? <ActivityIndicator color="#FFFFFF" /> : (
                <>
                  <Ionicons name="play-circle-outline" size={sw(22)} color="#FDD77A" />
                  <Text style={styles.btnText}>Start Service</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Add Service Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowModal(false)} />
        <View style={[styles.sheet, {paddingBottom: insets.bottom + sw(16)}]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Add a Service</Text>
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
                return (
                  <TouchableOpacity style={[styles.svcPickRow, isSelected && styles.svcPickRowSel]}
                    onPress={() => setSelectedSvc(item)} activeOpacity={0.8}>
                    <Image source={{uri: imgUri}} style={styles.pickImg} resizeMode="cover" />
                    <View style={{flex: 1}}>
                      <Text style={styles.pickName}>{item.name}</Text>
                      <Text style={styles.pickMeta}>
                        {item.duration ? `${item.duration} min  ·  ` : ''}₹{Number(item.basePrice).toLocaleString('en-IN')}
                      </Text>
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
              <Text style={styles.qtyTotal}>₹{(Number(selectedSvc.basePrice) * addQty).toLocaleString('en-IN')}</Text>
            </View>
          )}
          <TouchableOpacity style={[styles.confirmBtn, (!selectedSvc || adding) && {opacity: 0.5}]}
            disabled={!selectedSvc || adding} onPress={handleAddService} activeOpacity={0.88}>
            {adding ? <ActivityIndicator color="#FFFFFF" /> : (
              <><Ionicons name="add-circle-outline" size={sw(18)} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>
                {selectedSvc ? `Add "${selectedSvc.name}"` : 'Select a service'}
              </Text></>
            )}
          </TouchableOpacity>
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
  svcNameRow: {flexDirection: 'row', alignItems: 'center', gap: sw(6), flexWrap: 'wrap'},
  svcName: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '600'},
  addedBadge: {backgroundColor: '#FEF3C7', borderRadius: sw(4), paddingHorizontal: sw(6), paddingVertical: sw(2)},
  addedBadgeText: {fontFamily: fonts.textFont, fontSize: sw(9), color: '#92400E', fontWeight: '700'},
  freeBadge: {backgroundColor: '#EAF5F0', borderRadius: sw(4), paddingHorizontal: sw(6), paddingVertical: sw(2)},
  freeBadgeText: {fontFamily: fonts.textFont, fontSize: sw(9), color: '#105641', fontWeight: '700'},
  qtyStepper: {flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: sw(20), overflow: 'hidden', alignSelf: 'flex-start', marginTop: sw(6)},
  qtyBtn: {width: sw(28), height: sw(28), alignItems: 'center', justifyContent: 'center'},
  qtyVal: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#105641', minWidth: sw(24), textAlign: 'center'},
  svcPrice: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#105641'},
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

  approvalCard: {
    borderRadius: sw(14), padding: sw(14), gap: sw(8),
    backgroundColor: '#FFFBF0', borderWidth: 1.5, borderColor: '#F5C842',
  },
  approvalCardGreen: {backgroundColor: '#F0FDF4', borderColor: '#86efac'},
  approvalCardRed:   {backgroundColor: '#FFF1F1', borderColor: '#fca5a5'},
  approvalHeader: {flexDirection: 'row', alignItems: 'center', gap: sw(8)},
  approvalTitle: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#C87B1A'},
  approvalSub: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#78350f', lineHeight: sw(17)},
  approvalSvcRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: sw(4), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)'},
  approvalSvcName: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#292524', flex: 1, marginRight: sw(8)},
  approvalSvcPrice: {fontFamily: fonts.title, fontSize: sw(12), fontWeight: '700', color: '#C87B1A'},
  approvalTotalRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: sw(6), marginTop: sw(2), borderTopWidth: 1.5, borderTopColor: 'rgba(0,0,0,0.1)'},
  approvalTotalLabel: {fontFamily: fonts.title, fontSize: sw(12), fontWeight: '700', color: '#292524'},
  approvalTotalVal: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '800', color: '#C87B1A'},
  refreshBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sw(6), borderWidth: 1, borderColor: '#C87B1A', borderRadius: sw(8), paddingVertical: sw(7), marginTop: sw(4)},
  refreshBtnText: {fontFamily: fonts.title, fontSize: sw(12), fontWeight: '700', color: '#C87B1A'},

  footer: {backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EEEDED', paddingHorizontal: sw(16), paddingTop: sw(12)},
  btn: {borderRadius: sw(14), overflow: 'hidden'},
  btnGradient: {height: sw(56), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sw(10)},
  btnWarning: {backgroundColor: '#C87B1A', height: sw(56), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sw(10)},
  btnText: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700', color: '#FFFFFF'},

  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet: {backgroundColor: '#FFFFFF', borderTopLeftRadius: sw(20), borderTopRightRadius: sw(20), paddingHorizontal: sw(16), paddingTop: sw(12), maxHeight: '85%'},
  handle: {width: sw(40), height: sw(4), borderRadius: sw(2), backgroundColor: '#D0D0D0', alignSelf: 'center', marginBottom: sw(14)},
  sheetTitle: {fontFamily: fonts.title, fontSize: sw(17), fontWeight: '700', color: '#171816', marginBottom: sw(14)},
  searchWrap: {flexDirection: 'row', alignItems: 'center', gap: sw(8), backgroundColor: '#F5F5F5', borderRadius: sw(10), paddingHorizontal: sw(12), marginBottom: sw(10), height: sw(42)},
  searchInput: {flex: 1, fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816'},
  svcPickRow: {flexDirection: 'row', alignItems: 'center', gap: sw(10), paddingVertical: sw(10), borderBottomWidth: 1, borderBottomColor: '#F5F5F5'},
  svcPickRowSel: {backgroundColor: '#EAF5F0', borderRadius: sw(8), paddingHorizontal: sw(6)},
  pickImg: {width: sw(44), height: sw(44), borderRadius: sw(8), backgroundColor: '#E5E5E5'},
  pickName: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '600'},
  pickMeta: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#9CA3AF', marginTop: sw(2)},
  emptyPick: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#9CA3AF', textAlign: 'center', padding: sw(24)},
  qtyRow: {flexDirection: 'row', alignItems: 'center', gap: sw(12), backgroundColor: '#F9F9F9', borderRadius: sw(10), padding: sw(12), marginTop: sw(10)},
  qtyLabel: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#5C5C5C', flex: 1},
  qtyTotal: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700', color: '#012823'},
  confirmBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sw(8), backgroundColor: '#105641', borderRadius: sw(12), height: sw(50), marginTop: sw(14)},
  confirmBtnText: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#FFFFFF'},
});

export default JobChecklistScreen;
