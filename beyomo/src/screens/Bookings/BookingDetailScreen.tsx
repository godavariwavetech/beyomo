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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';
import {useDispatch, useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import {fetchBookingById, cancelBooking, respondServiceUpdate, addUserServices} from '../../redux/reducers/bookings';
import networkCall from '../../utils/networkCall';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('en-IN', {weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'});
  const time = d.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
  return {date, time};
};

interface AvailableSvc { id: number; name: string; basePrice: string; duration: number; }
type CartItem = {svc: AvailableSvc; qty: number};

const SvcTag = ({type}: {type: 'admin' | 'partner' | 'user' | 'removed'}) => {
  const cfg = {
    admin:   {label: 'Admin +',   bg: '#EDE9FE', text: '#7C3AED'},
    partner: {label: 'Partner +', bg: '#E0F2FE', text: '#0369A1'},
    user:    {label: 'You +',     bg: '#FEF3C7', text: '#D97706'},
    removed: {label: 'Removed',   bg: '#FEE2E2', text: '#B91C1C'},
  }[type];
  return (
    <View style={{backgroundColor: cfg.bg, borderRadius: sw(4), paddingHorizontal: sw(5), paddingVertical: sw(1)}}>
      <Text style={{fontSize: sw(9), fontWeight: '700', color: cfg.text}}>{cfg.label}</Text>
    </View>
  );
};

const BookingDetailScreen = ({navigation, route}: any) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const {selected: booking, loading, actionLoading} = useSelector((s: any) => s.Bookings);

  const passedBookingId = route?.params?.bookingId ?? route?.params?.booking?._id ?? route?.params?.booking?.id;

  const [showAddModal, setShowAddModal] = useState(false);
  const [availableServices, setAvailableServices] = useState<AvailableSvc[]>([]);
  const [loadingSvcs, setLoadingSvcs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [svcCart, setSvcCart] = useState<CartItem[]>([]);

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
        `${n} service(s) added to your booking. New total: ₹${parseFloat(result.payload?.totalAmount ?? 0).toLocaleString('en-IN')}`,
      );
    } else {
      Alert.alert('Error', result.payload ?? 'Failed to add services. Please try again.');
    }
  };

  const filteredSvcs = availableServices.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const cartTotal = svcCart.reduce((sum, item) => sum + parseFloat(item.svc.basePrice) * item.qty, 0);

  useFocusEffect(
    useCallback(() => {
      if (passedBookingId) dispatch(fetchBookingById(passedBookingId));
    }, [passedBookingId]),
  );

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

  const handleRespond = (action: 'approve' | 'reject') => {
    const label = action === 'approve' ? 'Approve' : 'Reject';
    const msg = action === 'approve'
      ? 'Approve the partner\'s service changes? Your total will be updated.'
      : 'Reject the partner\'s proposed changes? The booking will stay as-is.';
    Alert.alert(`${label} Changes`, msg, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: label,
        style: action === 'reject' ? 'destructive' : 'default',
        onPress: async () => {
          const result = await dispatch(respondServiceUpdate({bookingId: booking?.id ?? booking?._id, action}));
          if (result.meta.requestStatus === 'fulfilled') {
            Alert.alert(
              action === 'approve' ? 'Changes Approved' : 'Changes Rejected',
              action === 'approve'
                ? 'The service changes have been approved and your total has been updated.'
                : 'The partner\'s proposed changes have been rejected.',
              [{text: 'OK'}],
            );
          }
        },
      },
    ]);
  };

  if (loading) {
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
  const subtotal = activeServices.reduce((s: number, i: any) => s + (i.price ?? 0), 0);
  const platformFee = booking.platformFee ?? booking.convenienceFee ?? 0;
  const total = booking.totalAmount ?? (subtotal + platformFee);
  const partner = booking.partner ?? {};
  const partnerName = partner.name ?? booking.partnerName ?? '';
  const partnerAvatar = partner.avatar ?? partner.photo ?? '';
  const partnerPhone = partner.phone ?? '';
  const partnerRole = partner.specialty ?? partner.role ?? 'Beauty Expert';
  const partnerRating = partner.averageRating ?? partner.rating ?? '';
  const partnerExp = partner.experience ? `${partner.experience}+ yrs experience` : '';
  const address = booking.address?.formatted ?? booking.address?.line1 ?? booking.address ?? '';

  const dt = booking.scheduledAt ? formatDateTime(booking.scheduledAt) : null;

  const isCancellable = !['completed', 'cancelled'].includes(booking.status?.toLowerCase() ?? '');
  const isCompleted = booking.status?.toLowerCase() === 'completed';

  const hasPendingUpdate = !!booking.serviceUpdatePending;
  const pendingUpdate = (() => {
    const p = booking.pendingServicesUpdate;
    if (!p) return null;
    if (typeof p === 'string') { try { return JSON.parse(p); } catch { return null; } }
    return p;
  })();
  const pendingServices: any[] = pendingUpdate?.services ?? [];
  const pendingTotal: number = pendingUpdate?.totalAmount ?? 0;

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
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(32)}]}>

        <View style={styles.confirmedBanner}>
          <View style={styles.confirmedIconWrap}>
            <Ionicons name="checkmark-circle" size={sw(36)} color="#FFFFFF" />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.confirmedTitle}>Booking Confirmed!</Text>
            <Text style={styles.confirmedCode}>Booking ID: {bookingId}</Text>
          </View>
        </View>

        {hasPendingUpdate && (
          <View style={styles.pendingCard}>
            <View style={styles.pendingHeader}>
              <Ionicons name="alert-circle" size={sw(20)} color="#C87B1A" />
              <Text style={styles.pendingTitle}>Partner Updated Services</Text>
            </View>
            <Text style={styles.pendingSubtitle}>
              Your partner has proposed changes. Review and approve or reject below.
            </Text>

            {pendingServices.map((svc: any, idx: number) => (
              <View key={idx} style={[styles.pendingSvcRow, idx > 0 && {borderTopWidth: 1, borderTopColor: '#FDE9BF'}]}>
                <Text style={styles.pendingSvcName} numberOfLines={1}>{svc.name}{svc.qty > 1 ? ` ×${svc.qty}` : ''}</Text>
                <Text style={styles.pendingSvcPrice}>₹{Number((svc.price || 0) * (svc.qty || 1)).toLocaleString('en-IN')}</Text>
              </View>
            ))}

            <View style={styles.pendingTotalRow}>
              <Text style={styles.pendingTotalLabel}>New Total</Text>
              <Text style={styles.pendingTotalVal}>₹{Number(pendingTotal).toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.pendingActions}>
              <TouchableOpacity
                style={[styles.rejectBtn, actionLoading && {opacity: 0.6}]}
                disabled={actionLoading}
                activeOpacity={0.8}
                onPress={() => handleRespond('reject')}>
                {actionLoading ? <ActivityIndicator size="small" color="#DB1919" /> : (
                  <Text style={styles.rejectBtnText}>Reject</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approveBtn, actionLoading && {opacity: 0.6}]}
                disabled={actionLoading}
                activeOpacity={0.8}
                onPress={() => handleRespond('approve')}>
                {actionLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                  <Text style={styles.approveBtnText}>Approve</Text>
                )}
              </TouchableOpacity>
            </View>
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
              <Text style={styles.infoText}>{address}</Text>
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
              <Text style={styles.cardLabel}>Services Booked</Text>
              {['pending', 'confirmed'].includes(booking.status?.toLowerCase() ?? '') && (
                <TouchableOpacity style={styles.addServiceBtn} activeOpacity={0.8} onPress={openAddModal}>
                  <Ionicons name="add-circle-outline" size={sw(14)} color="#105641" />
                  <Text style={styles.addServiceBtnText}>Add Services</Text>
                </TouchableOpacity>
              )}
            </View>
            {services.map((svc: any, idx: number) => {
              const isRemoved = !!svc.removed;
              const tagType: 'admin' | 'partner' | 'user' | 'removed' | null =
                isRemoved ? 'removed' :
                svc.addedByAdmin ? 'admin' :
                svc.addedByPartner ? 'partner' :
                svc.addedByUser ? 'user' : null;
              return (
                <View key={svc._id ?? svc.id ?? idx} style={[styles.serviceRow, idx > 0 && styles.serviceRowBorder, isRemoved && {opacity: 0.5}]}>
                  <View style={{flex: 1}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: sw(6), flexWrap: 'wrap'}}>
                      <Text style={[styles.serviceName, isRemoved && {textDecorationLine: 'line-through', color: '#9CA3AF'}]}>
                        {svc.name}
                      </Text>
                      {tagType && <SvcTag type={tagType} />}
                    </View>
                    {!!svc.duration && <Text style={styles.serviceDuration}>{svc.duration} min</Text>}
                  </View>
                  {!!svc.price && (
                    <Text style={[styles.servicePrice, isRemoved && {textDecorationLine: 'line-through', color: '#9CA3AF'}]}>
                      ₹{svc.price}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Bill Summary</Text>
          {subtotal > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billKey}>Services Total</Text>
              <Text style={styles.billVal}>₹{subtotal}</Text>
            </View>
          )}
          {platformFee > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billKey}>Platform Fee</Text>
              <Text style={styles.billVal}>₹{platformFee}</Text>
            </View>
          )}
          <View style={[styles.billRow, styles.billTotal]}>
            <Text style={styles.billTotalKey}>Total Paid</Text>
            <Text style={styles.billTotalVal}>₹{total}</Text>
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
            <Text style={styles.reviewBtnText}>Write a Review</Text>
          </TouchableOpacity>
        )}

        {isCancellable && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.rescheduleBtn}
              activeOpacity={0.8}
              onPress={() => Alert.alert('Reschedule', 'Reschedule requests are handled by our support team.', [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Contact Support', onPress: () => navigation?.navigate('HelpSupport')},
              ])}>
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
                <Text style={styles.cartSummaryPrice}>₹{cartTotal.toLocaleString('en-IN')}</Text>
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
                        <Text style={styles.svcItemMeta}>{item.duration} min  •  ₹{parseFloat(item.basePrice).toLocaleString('en-IN')}</Text>
                      </TouchableOpacity>
                      {isSelected ? (
                        <View style={styles.inlineQty}>
                          <TouchableOpacity onPress={() => setSvcCart(prev => prev.map(c => c.svc.id === item.id ? {...c, qty: Math.max(1, c.qty - 1)} : c))}>
                            <Ionicons name="remove-circle" size={sw(22)} color="#105641" />
                          </TouchableOpacity>
                          <Text style={styles.inlineQtyNum}>{cartItem.qty}</Text>
                          <TouchableOpacity onPress={() => setSvcCart(prev => prev.map(c => c.svc.id === item.id ? {...c, qty: c.qty + 1} : c))}>
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
  confirmedCode: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.75)', marginTop: sw(2)},

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
  ratingText: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#171816', fontWeight: '600'},
  expertExp: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#656565'},
  callBtn: {
    width: sw(44),
    height: sw(44),
    borderRadius: sw(22),
    backgroundColor: '#105641',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardHeaderRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  addServiceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: sw(4),
    borderWidth: 1, borderColor: '#105641', borderRadius: sw(20),
    paddingHorizontal: sw(10), paddingVertical: sw(4),
  },
  addServiceBtnText: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#105641', fontWeight: '600'},

  serviceRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: sw(8)},
  serviceRowBorder: {borderTopWidth: 1, borderTopColor: '#F0F0F0'},
  serviceName: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '500'},
  serviceDuration: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#656565', marginTop: sw(2)},
  servicePrice: {fontFamily: fonts.title, fontSize: sw(14), color: '#105641', fontWeight: '700'},

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
  svcItemMeta: {fontFamily:fonts.textFont, fontSize:sw(11), color:'#5C5C5C'},
  inlineQty: {flexDirection:'row', alignItems:'center', gap:sw(6)},
  inlineQtyNum: {fontFamily:fonts.title, fontSize:sw(14), fontWeight:'700', color:'#105641', minWidth:sw(20), textAlign:'center'},
  emptyText: {fontFamily:fonts.textFont, fontSize:sw(13), color:'#888', textAlign:'center', paddingVertical:sw(32)},
  modalFooter: {flexDirection:'row', gap:sw(10), paddingHorizontal:sw(16), paddingTop:sw(12), borderTopWidth:1, borderTopColor:'#EEEDED'},
  modalCancelBtn: {flex:1, height:sw(46), borderRadius:sw(10), borderWidth:1.5, borderColor:'#EEEDED', alignItems:'center', justifyContent:'center'},
  modalCancelText: {fontFamily:fonts.textFont, fontSize:sw(13), fontWeight:'600', color:'#5C5C5C'},
  modalAddBtn: {flex:2, height:sw(46), borderRadius:sw(10), backgroundColor:'#105641', alignItems:'center', justifyContent:'center'},
  modalAddBtnDisabled: {backgroundColor:'#AAAAAA'},
  modalAddText: {fontFamily:fonts.title, fontSize:sw(14), fontWeight:'700', color:'#FFFFFF'},

  billRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  billKey: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#656565'},
  billVal: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816'},
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

  pendingCard: {
    backgroundColor: '#FFFBF0',
    borderRadius: sw(12),
    padding: sw(16),
    borderWidth: 1.5,
    borderColor: '#F5C842',
    gap: sw(10),
    elevation: 2,
    shadowColor: '#C87B1A',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pendingHeader: {flexDirection: 'row', alignItems: 'center', gap: sw(8)},
  pendingTitle: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#C87B1A'},
  pendingSubtitle: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#6B4C0A', lineHeight: sw(17)},
  pendingSvcRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: sw(6)},
  pendingSvcName: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '500', flex: 1, marginRight: sw(8)},
  pendingSvcPrice: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#105641'},
  pendingTotalRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1.5, borderTopColor: '#F5C842', paddingTop: sw(10)},
  pendingTotalLabel: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#171816'},
  pendingTotalVal: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '800', color: '#C87B1A'},
  pendingActions: {flexDirection: 'row', gap: sw(10), marginTop: sw(4)},
  rejectBtn: {
    flex: 1, height: sw(44), borderRadius: sw(10),
    borderWidth: 1.5, borderColor: '#DB1919',
    alignItems: 'center', justifyContent: 'center',
  },
  rejectBtnText: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#DB1919'},
  approveBtn: {
    flex: 1, height: sw(44), borderRadius: sw(10),
    backgroundColor: '#105641',
    alignItems: 'center', justifyContent: 'center',
  },
  approveBtnText: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#FFFFFF'},
});

export default BookingDetailScreen;
