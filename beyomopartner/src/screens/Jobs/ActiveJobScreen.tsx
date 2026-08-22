import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Linking,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';
import {resolveImageUrl} from '../../utils/utils';
import networkCall from '../../utils/networkCall';
import {endpoints} from '../../config/config';
import {useSelector, useDispatch} from 'react-redux';
import type {RootState} from '../../redux/store';
import {updateBookingStatus} from '../../redux/reducers/partner';
import {useAppAlert} from '../../hooks/useAppAlert';
import AppAlertModal from '../../components/AppAlertModal/AppAlertModal';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const parseServices = (s: any): any[] => {
  if (Array.isArray(s)) return s;
  if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
  return [];
};

type ServiceStatus = 'started' | 'completed';

interface BookingService {
  serviceId?: number;
  name: string;
  price: number;
  qty?: number;
  duration?: number | null;
  addedByPartner?: boolean;
}

interface AvailableSvc {
  id: number;
  name: string;
  basePrice: string;
  duration: number;
}
type CartItem = {svc: AvailableSvc; qty: number};

const ActiveJobScreen = ({navigation, route}: any) => {
  const insets = useSafeAreaInsets();
  const job = route?.params?.job ?? null;
  const dispatch = useDispatch<any>();
  const myPartnerId = useSelector(
    (s: RootState) => s.Auth?.partnerId ?? (s.Auth?.partner as any)?.id,
  );
  const {alertConfig, showAlert, hideAlert} = useAppAlert();

  const [status, setStatus] = useState<ServiceStatus>('started');
  const [services, setServices] = useState<BookingService[]>(() =>
    parseServices(job?.services),
  );
  const [totalAmount, setTotalAmount] = useState<number>(
    job?.totalAmount ? parseFloat(job.totalAmount) : 0,
  );

  // Services scoped to this partner (for multi-partner bookings).
  // Edge case 10: addedByPartner extras also filter by assignedPartnerId — they belong only to
  // the partner who added them (stamped at creation time by addExtraServices endpoint).
  const myServices = useMemo(() => {
    return services.filter(svc => {
      if (!svc.serviceStatus && !svc.assignedPartnerId) return true; // old single-partner format
      if (!svc.assignedPartnerId) return true; // no ownership stamp yet (shouldn't happen in new flow)
      return String(svc.assignedPartnerId) === String(myPartnerId);
    });
  }, [services, myPartnerId]);

  // Earnings = sum of this partner's services only
  const myEarnings = useMemo(
    () => myServices.reduce((sum, s) => sum + s.price * (s.qty || 1), 0),
    [myServices],
  );

  // Group items that were part of a package/combo into a single card instead of
  // listing each of their services as its own line — matching the customer app/website.
  const packageItems = myServices.filter((s: any) => s.addedByPackage);
  const otherMyServices = myServices.filter((s: any) => !s.addedByPackage);
  const otherMyServicesTotal = otherMyServices.reduce((sum, s: any) => sum + (s.price ?? 0) * (s.qty || 1), 0);
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
          price: Math.max(0, (job?.baseAmount ?? totalAmount) - otherMyServicesTotal),
          items: packageItems,
        }]
      : [];

  // Add-service modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableServices, setAvailableServices] = useState<AvailableSvc[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [svcCart, setSvcCart] = useState<CartItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [completing, setCompleting] = useState(false);

  const orderId = job?.bookingCode ?? '—';
  const customerName =
    job?.user?.name ?? job?.userId?.name ?? job?.customerName ?? '—';
  const customerPhone =
    job?.user?.phone ?? job?.userId?.phone ?? job?.userPhone ?? null;
  const addressParts = [
    job?.addressLine1,
    job?.addressLine2,
    job?.addressCity,
    job?.addressState,
  ].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(', ') : '—';

  const fetchAvailableServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      const result = await networkCall(`api/v1/services?limit=500`, 'GET');
      if (result.response?.status) {
        const raw = result.response?.data?.data ?? result.response?.data ?? [];
        setAvailableServices(Array.isArray(raw) ? raw : []);
      }
    } catch {}
    setLoadingServices(false);
  }, []);

  const openAddModal = () => {
    setSvcCart([]);
    setSearchQuery('');
    if (availableServices.length === 0) fetchAvailableServices();
    setShowAddModal(true);
  };

  const handleConfirmAdd = async () => {
    if (!svcCart.length || !job?.id) return;
    setAdding(true);
    try {
      const endpoint = endpoints.PARTNER_EXTRA_SERVICES(String(job.id));
      const result = await networkCall(
        endpoint,
        'PATCH',
        JSON.stringify({services: svcCart.map(item => ({id: item.svc.id, qty: item.qty}))}),
      );
      if (result.response?.status && result.response?.data) {
        const updated = result.response.data;
        setServices(parseServices(updated.services));
        setTotalAmount(parseFloat(updated.totalAmount) || totalAmount);
        const n = svcCart.length;
        setSvcCart([]);
        setShowAddModal(false);
        showAlert(
          'Services Added',
          `${n} service(s) added to this booking. New total: ₹${parseFloat(updated.totalAmount).toLocaleString('en-IN')}`,
        );
      } else {
        showAlert('Error', result.response?.message ?? 'Failed to add service. Please try again.');
      }
    } catch {
      showAlert('Error', 'Failed to add service. Please try again.');
    }
    setAdding(false);
  };

  const handleMarkComplete = () => {
    // Payment may not be settled yet — either it's a COD job, or it was booked online but
    // the payment never went through. Either way, don't block completion: ask whether the
    // partner collected cash on the spot instead, rather than refusing to close the job.
    const needsPaymentConfirmation = job?.paymentStatus !== 'paid';
    const title = needsPaymentConfirmation ? 'Confirm Payment Collected' : 'Mark as Completed?';
    const message = needsPaymentConfirmation
      ? `Have you collected ₹${totalAmount.toLocaleString('en-IN')} from the customer (cash or otherwise)?`
      : 'Confirm that you have completed all services for this booking.';

    showAlert(
      title,
      message,
      [
        {text: 'Not Yet', style: 'cancel'},
        {
          text: needsPaymentConfirmation ? 'Yes, Collected' : 'Confirm',
          onPress: async () => {
            setCompleting(true);
            if (job?.id) {
              const result = await dispatch(updateBookingStatus({
                bookingId: job.id,
                status: 'completed',
                ...(needsPaymentConfirmation ? {cashCollected: true} : {}),
              }));
              if (result.meta.requestStatus === 'fulfilled') {
                setStatus('completed');
              } else {
                showAlert('Could not complete job', result.payload ?? 'Please try again.');
              }
            }
            setCompleting(false);
          },
        },
      ],
    );
  };

  const handleDone = () => {
    navigation.navigate('Main');
  };

  const filteredServices = availableServices.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const cartTotal = svcCart.reduce((sum, item) => sum + parseFloat(item.svc.basePrice) * item.qty, 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#022723" />

      {/* Header */}
      <LinearGradient
        colors={['#0E5843', '#022723']}
        style={[styles.header, {paddingTop: insets.top + sw(12)}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(22)} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {status === 'started' ? 'Service In Progress' : 'Service Completed'}
          </Text>
          <View
            style={[
              styles.statusDot,
              status === 'completed' && styles.statusDotDone,
            ]}
          />
        </View>
        <View style={{width: sw(22)}} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: insets.bottom + sw(100)},
        ]}>

        {/* Status banner */}
        <LinearGradient
          colors={
            status === 'completed'
              ? ['#105641', '#012823']
              : ['#1C46CF', '#0a2680']
          }
          style={styles.statusBanner}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}>
          <View style={styles.statusIconWrap}>
            <Ionicons
              name={status === 'completed' ? 'checkmark-circle' : 'play-circle'}
              size={sw(32)}
              color="#FFFFFF"
            />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.statusTitle}>
              {status === 'completed'
                ? 'Great job! You have completed the service.'
                : 'Service is in progress...'}
            </Text>
            <Text style={styles.statusSub}>Order ID: {orderId}</Text>
          </View>
        </LinearGradient>

        {/* Customer card */}
        <View style={styles.card}>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatarWrap}>
              <Text style={styles.customerInitial}>{customerName[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerLabel}>Customer</Text>
              <Text style={styles.customerName}>{customerName}</Text>
            </View>
            {!!customerPhone && (
              <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}
                onPress={() => Linking.openURL(`tel:${customerPhone}`)}>
                <Ionicons name="call" size={sw(18)} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Services card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>Services</Text>
            {status === 'started' && (
              <TouchableOpacity
                style={styles.addServiceBtn}
                activeOpacity={0.8}
                onPress={openAddModal}>
                <Ionicons
                  name="add-circle-outline"
                  size={sw(14)}
                  color="#105641"
                />
                <Text style={styles.addServiceBtnText}>Add Service</Text>
              </TouchableOpacity>
            )}
          </View>

          {packageGroups.map((group) => (
            <View key={group.key ?? group.title} style={[styles.serviceRow, {alignItems: 'flex-start'}]}>
              <View style={{flex: 1}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: sw(6), flexWrap: 'wrap'}}>
                  <Text style={styles.serviceName}>{group.title}</Text>
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
              <Text style={styles.servicePrice}>₹{Number(group.price).toLocaleString('en-IN')}</Text>
            </View>
          ))}

          {myServices.length > 0 ? (
            myServices.map((svc, idx) => {
              if ((svc as any).addedByPackage) return null;
              const imgUri = resolveImageUrl((svc as any).image ?? job?.service?.image) ?? 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=90&fit=crop';
              const isFree = (svc as any).addedByOffer || svc.price === 0;
              const isRemoved = !!(svc as any).removed;
              const tagCfg = isRemoved
                ? {label: 'Removed',   bg: '#FEE2E2', text: '#B91C1C'}
                : (svc as any).addedByAdmin
                ? {label: 'Admin +',   bg: '#EDE9FE', text: '#7C3AED'}
                : (svc as any).addedByUser
                ? {label: 'User +',    bg: '#FEF3C7', text: '#D97706'}
                : svc.addedByPartner
                ? {label: 'You Added', bg: '#FDD77A', text: '#022723'}
                : null;
              return (
                <View key={idx} style={[styles.serviceRow, idx > 0 && styles.serviceRowBorder, isRemoved && {opacity: 0.5}]}>
                  <Image source={{uri: imgUri}} style={styles.svcImg} resizeMode="cover" />
                  <View style={{flex: 1}}>
                    <View style={styles.serviceNameRow}>
                      <Text style={[styles.serviceName, isRemoved && {textDecorationLine: 'line-through', color: '#9CA3AF'}]} numberOfLines={1}>{svc.name}</Text>
                      {tagCfg && (
                        <View style={[styles.addedTag, {backgroundColor: tagCfg.bg}]}>
                          <Text style={[styles.addedTagText, {color: tagCfg.text}]}>{tagCfg.label}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.svcMetaRow}>
                      {svc.duration ? (
                        <View style={styles.metaChip}>
                          <Ionicons name="time-outline" size={sw(10)} color="#5C5C5C" />
                          <Text style={styles.metaChipText}>{svc.duration} min</Text>
                        </View>
                      ) : null}
                      {svc.qty && svc.qty > 1 ? (
                        <View style={styles.metaChip}><Text style={styles.metaChipText}>×{svc.qty}</Text></View>
                      ) : null}
                    </View>
                  </View>
                  <View style={{alignItems: 'flex-end', gap: sw(4)}}>
                    {isFree ? (
                      <Text style={[styles.serviceMeta, {color: '#9CA3AF'}]}>FREE</Text>
                    ) : (
                      <Text style={[styles.servicePrice, isRemoved && {textDecorationLine: 'line-through', color: '#9CA3AF'}]}>
                        ₹{Number(svc.price * (svc.qty || 1)).toLocaleString('en-IN')}
                      </Text>
                    )}
                    {status === 'completed' && !isRemoved && (
                      <Ionicons name="checkmark-circle" size={sw(18)} color="#105641" />
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.serviceName}>{job?.service?.name ?? '—'}</Text>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {myServices.length < services.length ? 'Your Earnings' : 'Total'}
            </Text>
            <Text style={styles.totalVal}>
              ₹{Number(myServices.length < services.length ? myEarnings : totalAmount).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Footer actions */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + sw(12)}]}>
        {status === 'started' ? (
          <TouchableOpacity
            style={styles.completeBtn}
            activeOpacity={0.85}
            onPress={handleMarkComplete}
            disabled={completing}>
            <LinearGradient
              colors={['#0E5843', '#022723']}
              style={styles.completeBtnGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              {completing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={sw(20)}
                    color="#FFFFFF"
                  />
                  <Text style={styles.completeBtnText}>
                    Mark as Completed
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.85} onPress={handleDone}>
            <LinearGradient
              colors={['#0E5843', '#022723']}
              style={styles.doneBtn}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Ionicons
                name="checkmark-circle-outline"
                size={sw(22)}
                color="#FDD77A"
              />
              <Text style={styles.doneBtnText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Add Service Modal ── */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Extra Services</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Ionicons name="close" size={sw(22)} color="#171816" />
              </TouchableOpacity>
            </View>

            {/* Search */}
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
              <View style={styles.selectedBar}>
                <Text style={styles.selectedBarName}>{svcCart.length} service(s) selected</Text>
                <Text style={styles.selectedBarPrice}>₹{cartTotal.toLocaleString('en-IN')}</Text>
              </View>
            )}

            {/* Service list */}
            {loadingServices ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color="#105641" size="large" />
                <Text style={styles.loadingText}>Loading services…</Text>
              </View>
            ) : (
              <FlatList
                data={filteredServices}
                keyExtractor={item => String(item.id)}
                style={{flex: 1}}
                contentContainerStyle={styles.serviceListContent}
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
                        <Text style={[styles.svcItemName, isSelected && styles.svcItemNameSelected]}>
                          {item.name}
                        </Text>
                        <Text style={styles.svcItemMeta}>
                          {item.duration} min  •  ₹{parseFloat(item.basePrice).toLocaleString('en-IN')}
                        </Text>
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
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No services found</Text>
                }
              />
            )}

            {/* Modal footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalAddBtn,
                  (!svcCart.length || adding) && styles.modalAddBtnDisabled,
                ]}
                disabled={!svcCart.length || adding}
                onPress={handleConfirmAdd}>
                {adding ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalAddText}>Add {svcCart.length || ''} Service{svcCart.length !== 1 ? 's' : ''}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AppAlertModal config={alertConfig} onRequestClose={hideAlert} />
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
    paddingBottom: sw(14),
  },
  headerCenter: {flexDirection: 'row', alignItems: 'center', gap: sw(8)},
  headerTitle: {
    fontFamily: fonts.title,
    fontSize: sw(17),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusDot: {
    width: sw(8),
    height: sw(8),
    borderRadius: sw(4),
    backgroundColor: '#FDD77A',
  },
  statusDotDone: {backgroundColor: '#4CAF50'},

  scroll: {padding: sw(16), gap: sw(14)},

  statusBanner: {
    borderRadius: sw(12),
    padding: sw(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(12),
  },
  statusIconWrap: {
    width: sw(52),
    height: sw(52),
    borderRadius: sw(26),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: sw(19),
  },
  statusSub: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: 'rgba(255,255,255,0.65)',
    marginTop: sw(3),
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(16),
    gap: sw(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#171816',
  },

  addServiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    borderWidth: 1,
    borderColor: '#105641',
    borderRadius: sw(20),
    paddingHorizontal: sw(10),
    paddingVertical: sw(4),
  },
  addServiceBtnText: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#105641',
    fontWeight: '600',
  },

  customerRow: {flexDirection: 'row', alignItems: 'center', gap: sw(12)},
  customerAvatarWrap: {
    width: sw(44), height: sw(44), borderRadius: sw(22),
    backgroundColor: '#012823', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  customerInitial: {fontFamily: fonts.title, fontSize: sw(18), fontWeight: '700', color: '#FDD77A'},
  customerInfo: {flex: 1, gap: sw(2)},
  customerLabel: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#9CA3AF'},
  customerName: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#171816'},
  callBtn: {
    width: sw(40),
    height: sw(40),
    borderRadius: sw(20),
    backgroundColor: '#105641',
    alignItems: 'center',
    justifyContent: 'center',
  },

  serviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: sw(12), paddingVertical: sw(8),
  },
  serviceRowBorder: {borderTopWidth: 1, borderTopColor: '#F5F5F5'},
  svcImg: {width: sw(52), height: sw(52), borderRadius: sw(10), backgroundColor: '#E5E5E5', flexShrink: 0},
  svcMetaRow: {flexDirection: 'row', gap: sw(6), marginTop: sw(4), flexWrap: 'wrap'},
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: sw(3),
    backgroundColor: '#F0F0F0', borderRadius: sw(4), paddingHorizontal: sw(6), paddingVertical: sw(2),
  },
  metaChipText: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#5C5C5C'},
  servicePrice: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#105641'},
  packageBadge: {
    backgroundColor: '#E4E1D8', borderRadius: sw(4),
    paddingHorizontal: sw(5), paddingVertical: sw(1),
  },
  packageBadgeText: {fontFamily: fonts.textFont, fontSize: sw(11), fontWeight: '700', color: '#292524'},
  serviceNameRow: {flexDirection: 'row', alignItems: 'center', gap: sw(6)},
  serviceName: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#171816',
    fontWeight: '500',
  },
  addedTag: {
    backgroundColor: '#FDD77A',
    borderRadius: sw(6),
    paddingHorizontal: sw(5),
    paddingVertical: sw(1),
  },
  addedTagText: {
    fontFamily: fonts.textFont,
    fontSize: sw(9),
    color: '#022723',
    fontWeight: '700',
  },
  serviceMeta: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#5C5C5C',
    marginTop: sw(2),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#EEEDED',
    paddingTop: sw(10),
    marginTop: sw(2),
  },
  totalLabel: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#171816',
  },
  totalVal: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#105641',
  },


  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEDED',
    paddingHorizontal: sw(16),
    paddingTop: sw(12),
    gap: sw(8),
  },
  completeBtn: {borderRadius: sw(12), overflow: 'hidden'},
  completeBtnGradient: {
    height: sw(52),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(8),
  },
  completeBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doneBtn: {
    borderRadius: sw(12),
    height: sw(52),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(8),
  },
  doneBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Modal styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: sw(20),
    borderTopRightRadius: sw(20),
    maxHeight: '82%',
    flex: 1,
    paddingBottom: sw(16),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingVertical: sw(14),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEDED',
  },
  modalTitle: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#171816',
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    marginHorizontal: sw(16),
    marginVertical: sw(10),
    backgroundColor: '#F5F5F5',
    borderRadius: sw(10),
    paddingHorizontal: sw(12),
    height: sw(40),
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#171816',
    padding: 0,
  },

  selectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
    marginHorizontal: sw(16),
    marginBottom: sw(8),
    backgroundColor: 'rgba(16,86,65,0.07)',
    borderRadius: sw(10),
    paddingHorizontal: sw(12),
    paddingVertical: sw(8),
  },
  selectedBarName: {
    flex: 1,
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#105641',
    fontWeight: '600',
  },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    backgroundColor: '#FFFFFF',
    borderRadius: sw(8),
    paddingHorizontal: sw(6),
    paddingVertical: sw(4),
  },
  qtyBtn: {
    width: sw(24),
    height: sw(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#171816',
    minWidth: sw(18),
    textAlign: 'center',
  },
  selectedBarPrice: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#105641',
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sw(40),
    gap: sw(12),
  },
  loadingText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#5C5C5C',
  },

  serviceListContent: {
    paddingHorizontal: sw(16),
    paddingTop: sw(4),
    paddingBottom: sw(8),
    gap: sw(8),
  },
  svcItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: sw(10),
    padding: sw(12),
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  svcItemSelected: {
    borderColor: '#105641',
    backgroundColor: 'rgba(16,86,65,0.05)',
  },
  svcItemName: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#171816',
    fontWeight: '500',
    marginBottom: sw(2),
  },
  svcItemNameSelected: {color: '#105641', fontWeight: '700'},
  svcItemMeta: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#5C5C5C',
  },
  inlineQty: {flexDirection: 'row', alignItems: 'center', gap: sw(6)},
  inlineQtyNum: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#105641', minWidth: sw(20), textAlign: 'center'},
  emptyText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#888',
    textAlign: 'center',
    paddingVertical: sw(32),
  },

  modalFooter: {
    flexDirection: 'row',
    gap: sw(10),
    paddingHorizontal: sw(16),
    paddingTop: sw(12),
    borderTopWidth: 1,
    borderTopColor: '#EEEDED',
  },
  modalCancelBtn: {
    flex: 1,
    height: sw(46),
    borderRadius: sw(10),
    borderWidth: 1.5,
    borderColor: '#EEEDED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    fontWeight: '600',
    color: '#5C5C5C',
  },
  modalAddBtn: {
    flex: 2,
    height: sw(46),
    borderRadius: sw(10),
    backgroundColor: '#105641',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAddBtnDisabled: {backgroundColor: '#AAAAAA'},
  modalAddText: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ActiveJobScreen;
