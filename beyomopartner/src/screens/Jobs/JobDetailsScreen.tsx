import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector, useDispatch} from 'react-redux';
import {fonts} from '../../config/theme';
import {resolveImageUrl} from '../../utils/utils';
import {updateBookingStatus} from '../../redux/reducers/partner';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&q=80';

const parseServices = (s: any): any[] => {
  if (Array.isArray(s)) return s;
  if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
  return [];
};

const STATUS_MAP: Record<string, {label: string; bg: string; text: string}> = {
  confirmed:   {label: 'Confirmed',   bg: '#E8F5EF', text: '#1B6B3A'},
  pending:     {label: 'Pending',     bg: '#FEF9EC', text: '#B07A00'},
  in_progress: {label: 'In Progress', bg: '#EEF0FF', text: '#3D5AF1'},
  completed:   {label: 'Completed',   bg: '#F0F0F0', text: '#5C5C5C'},
  cancelled:   {label: 'Cancelled',   bg: '#FEF0F0', text: '#CC2222'},
};

const JobDetailsScreen = ({navigation, route}: any) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const routeJob = route?.params?.job ?? null;
  const bookings = useSelector((s: any) => s.Partner?.bookings ?? []);
  const routeId = routeJob?.id ?? routeJob?._id;
  const liveJob = routeId
    ? bookings.find((b: any) => (b.id ?? b._id) === routeId)
    : null;
  const job = liveJob ?? routeJob;
  const [arriving, setArriving] = useState(false);

  const _parsedServices = parseServices(job?.services);

  const orderId      = job?.bookingCode ?? `#${String(job?.id ?? '').slice(-8).toUpperCase()}`;
  const rawStatus    = (job?.status ?? 'confirmed').toLowerCase();
  const statusCfg    = STATUS_MAP[rawStatus] ?? STATUS_MAP.confirmed;
  const customerName = job?.user?.name ?? job?.userName ?? 'Customer';
  const customerPhone = job?.user?.phone ?? job?.userId?.phone ?? job?.userPhone ?? null;
  const fullAddress  = [job?.addressLine1, job?.addressCity, job?.addressState, job?.addressPincode]
    .filter(Boolean).join(', ')
    || job?.address?.formatted || '—';
  const scheduledAt  = job?.scheduledAt
    ? new Date(job.scheduledAt).toLocaleString('en-IN', {
        weekday: 'short', day: '2-digit', month: 'long',
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
    : '—';
  const earnings     = Number(job?.partnerEarning ?? job?.totalAmount ?? 0);
  const totalAmount  = Number(job?.totalAmount ?? 0);
  const notes        = job?.notes ?? '';

  const servicesList: any[] = _parsedServices.length > 0
    ? _parsedServices
    : job?.service
    ? [{name: job.service?.name ?? job.service, image: job.service?.image,
        duration: job.service?.duration, price: job.service?.basePrice ?? totalAmount}]
    : [];

  const handleCall = () => {
    if (!customerPhone) { Alert.alert('Not Available', 'Customer phone number is not available.'); return; }
    Linking.openURL(`tel:${customerPhone}`);
  };

  const handleNavigate = () => navigation.navigate('GoToCustomer', {job});

  const handleArrived = () =>
    Alert.alert('Arrived at Location', "Confirm you have arrived at the customer's location.", [
      {text: 'Not Yet', style: 'cancel'},
      {
        text: 'Confirm Arrival',
        onPress: async () => {
          setArriving(true);
          await dispatch(updateBookingStatus({bookingId: job.id, status: 'in_progress'}));
          setArriving(false);
          navigation.navigate('JobChecklist', {job});
        },
      },
    ]);

  const handleCancel = () =>
    Alert.alert('Cancel Service', 'Are you sure you want to cancel this service? This may affect your rating.', [
      {text: 'No, Keep Job', style: 'cancel'},
      {text: 'Cancel', style: 'destructive', onPress: () => navigation.navigate('Jobs')},
    ]);

  return (
    <View style={[styles.root, {paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor="#022723" />

      {/* ── Header ── */}
      <LinearGradient colors={['#0E5843', '#022723']}
        style={[styles.header, {paddingTop: insets.top + sw(12)}]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={sw(20)} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{flex: 1, marginLeft: sw(10)}}>
          <Text style={styles.headerTitle}>Job Details</Text>
          <Text style={styles.headerSub}>{orderId}</Text>
        </View>
        <View style={[styles.statusPill, {backgroundColor: statusCfg.bg}]}>
          <Text style={[styles.statusPillText, {color: statusCfg.text}]}>{statusCfg.label}</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: sw(16), gap: sw(14), paddingBottom: sw(32)}}>

        {/* ── Schedule card ── */}
        <View style={styles.card}>
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

        {/* ── Customer card ── */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{customerName[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.cardLabel}>Customer</Text>
              <Text style={styles.cardValue}>{customerName}</Text>
              {customerPhone && (
                <Text style={styles.cardSub}>{customerPhone}</Text>
              )}
            </View>
            {customerPhone && (
              <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
                <Ionicons name="call" size={sw(18)} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Services card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {servicesList.length > 1 ? `Services (${servicesList.length})` : 'Service'}
          </Text>
          {servicesList.map((svc: any, idx: number) => {
            const imgUri = resolveImageUrl(svc.image ?? job?.service?.image) ?? FALLBACK_IMG;
            const isFree = svc.addedByOffer || svc.price === 0;
            return (
              <View key={idx} style={[styles.svcRow, idx > 0 && styles.svcRowBorder]}>
                <Image source={{uri: imgUri}} style={styles.svcImage} resizeMode="cover" />
                <View style={{flex: 1}}>
                  <Text style={styles.svcName} numberOfLines={1}>{svc.name}</Text>
                  <View style={styles.svcMeta}>
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
                    {svc.addedByPartner && (
                      <View style={[styles.metaChip, {backgroundColor: '#FEF3C7'}]}>
                        <Text style={[styles.metaChipText, {color: '#92400E'}]}>Added</Text>
                      </View>
                    )}
                  </View>
                </View>
                {isFree ? (
                  <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>
                ) : svc.price != null ? (
                  <Text style={styles.svcPrice}>₹{Number(svc.price * (svc.qty || 1)).toLocaleString('en-IN')}</Text>
                ) : null}
              </View>
            );
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* ── Earnings card ── */}
        <LinearGradient colors={['#0E5843', '#022723']} style={styles.earningsCard}
          start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
          <View>
            <Text style={styles.earningsLabel}>Your Earnings</Text>
            <Text style={styles.earningsValue}>₹{earnings.toLocaleString('en-IN')}</Text>
          </View>
          <Ionicons name="cash-outline" size={sw(40)} color="rgba(255,255,255,0.2)" />
        </LinearGradient>

        {/* ── Address card ── */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, {backgroundColor: '#FFF3E4'}]}>
              <Ionicons name="location" size={sw(18)} color="#C87B1A" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.cardLabel}>Customer Address</Text>
              <Text style={styles.cardValue}>{fullAddress}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.navigateBtn} onPress={handleNavigate} activeOpacity={0.85}>
            <Ionicons name="navigate-outline" size={sw(16)} color="#3D5AF1" />
            <Text style={styles.navigateBtnText}>Open Route on Map</Text>
            <Ionicons name="arrow-forward" size={sw(14)} color="#3D5AF1" style={{marginLeft: 'auto' as any}} />
          </TouchableOpacity>
        </View>

        {/* ── Notes ── */}
        {!!notes && (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, {backgroundColor: '#F5F5F5'}]}>
                <Ionicons name="document-text-outline" size={sw(18)} color="#5C5C5C" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.cardLabel}>Customer Notes</Text>
                <Text style={styles.cardValue}>{notes}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Action buttons ── */}
        {!['completed', 'cancelled'].includes(rawStatus) && (
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionRow} onPress={handleNavigate} activeOpacity={0.85}>
              <View style={[styles.actionIcon, {backgroundColor: '#EEF0FF'}]}>
                <Ionicons name="navigate" size={sw(20)} color="#3D5AF1" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.actionTitle}>Go to Customer</Text>
                <Text style={styles.actionSub}>Open map with route to customer</Text>
              </View>
              <Ionicons name="chevron-forward" size={sw(18)} color="#CCCCCC" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionRow} onPress={handleCall} activeOpacity={0.85}>
              <View style={[styles.actionIcon, {backgroundColor: 'rgba(37,211,102,0.12)'}]}>
                <Ionicons name="call" size={sw(20)} color="#25D366" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.actionTitle}>Call Customer</Text>
                <Text style={styles.actionSub}>{customerPhone ?? 'Phone not available'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={sw(18)} color="#CCCCCC" />
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionRow} onPress={handleCancel} activeOpacity={0.85}>
              <View style={[styles.actionIcon, {backgroundColor: 'rgba(219,25,25,0.08)'}]}>
                <Ionicons name="close-circle-outline" size={sw(20)} color="#DB1919" />
              </View>
              <View style={{flex: 1}}>
                <Text style={[styles.actionTitle, {color: '#DB1919'}]}>Cancel Service</Text>
                <Text style={styles.actionSub}>This may affect your rating</Text>
              </View>
              <Ionicons name="chevron-forward" size={sw(18)} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Primary CTA ── */}
        {rawStatus === 'confirmed' && (
          <TouchableOpacity onPress={handleArrived} disabled={arriving} activeOpacity={0.88}>
            <LinearGradient colors={arriving ? ['#888','#888'] : ['#0E5843', '#022723']} style={styles.primaryBtn}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
              {arriving ? <ActivityIndicator color="#FFFFFF" /> : (
                <>
                  <Ionicons name="location" size={sw(20)} color="#FDD77A" />
                  <Text style={styles.primaryBtnText}>Arrived at Location</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F4F6F8'},

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: sw(16), paddingBottom: sw(16),
  },
  backBtn: {
    width: sw(36), height: sw(36), borderRadius: sw(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {fontFamily: fonts.title, fontSize: sw(17), fontWeight: '700', color: '#FFFFFF'},
  headerSub: {fontFamily: fonts.textFont, fontSize: sw(11), color: 'rgba(255,255,255,0.6)', marginTop: sw(2)},
  statusPill: {
    borderRadius: sw(20), paddingHorizontal: sw(12), paddingVertical: sw(5),
  },
  statusPillText: {fontFamily: fonts.textFont, fontSize: sw(11), fontWeight: '700'},

  /* Card */
  card: {
    backgroundColor: '#FFFFFF', borderRadius: sw(16), padding: sw(14), gap: sw(10),
    elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  cardRow: {flexDirection: 'row', alignItems: 'center', gap: sw(12)},
  iconBox: {
    width: sw(40), height: sw(40), borderRadius: sw(10),
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardLabel: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#9CA3AF'},
  cardValue: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '500', marginTop: sw(2)},
  cardSub: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#9CA3AF', marginTop: sw(2)},

  /* Avatar */
  avatarCircle: {
    width: sw(44), height: sw(44), borderRadius: sw(22),
    backgroundColor: '#012823', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarInitial: {fontFamily: fonts.title, fontSize: sw(18), fontWeight: '700', color: '#FDD77A'},
  callBtn: {
    width: sw(40), height: sw(40), borderRadius: sw(20),
    backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center',
  },

  /* Section title */
  sectionTitle: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#171816'},

  /* Services */
  svcRow: {flexDirection: 'row', alignItems: 'center', gap: sw(12), paddingVertical: sw(8)},
  svcRowBorder: {borderTopWidth: 1, borderTopColor: '#F5F5F5'},
  svcImage: {
    width: sw(52), height: sw(52), borderRadius: sw(10),
    backgroundColor: '#E5E5E5', flexShrink: 0,
  },
  svcName: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '600'},
  svcMeta: {flexDirection: 'row', gap: sw(6), marginTop: sw(4), flexWrap: 'wrap'},
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: sw(3),
    backgroundColor: '#F0F0F0', borderRadius: sw(4),
    paddingHorizontal: sw(6), paddingVertical: sw(2),
  },
  metaChipText: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#5C5C5C'},
  svcPrice: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#105641'},
  freeBadge: {
    backgroundColor: '#EAF5F0', borderRadius: sw(6),
    paddingHorizontal: sw(8), paddingVertical: sw(3),
  },
  freeBadgeText: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#105641', fontWeight: '700'},
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1.5, borderTopColor: '#F0F0F0', paddingTop: sw(10), marginTop: sw(2),
  },
  totalLabel: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#5C5C5C', fontWeight: '600'},
  totalValue: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '800', color: '#012823'},

  /* Earnings */
  earningsCard: {
    borderRadius: sw(16), padding: sw(16),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  earningsLabel: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.7)', marginBottom: sw(4)},
  earningsValue: {fontFamily: fonts.title, fontSize: sw(28), fontWeight: '800', color: '#FFFFFF'},

  /* Navigate button */
  navigateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: sw(8),
    borderWidth: 1.5, borderColor: '#3D5AF1', borderRadius: sw(10),
    paddingHorizontal: sw(12), paddingVertical: sw(10),
    backgroundColor: '#F0F3FF',
  },
  navigateBtnText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#3D5AF1', fontWeight: '600', flex: 1},

  /* Actions card */
  actionsCard: {
    backgroundColor: '#FFFFFF', borderRadius: sw(16),
    overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: sw(12),
    paddingHorizontal: sw(14), paddingVertical: sw(14),
  },
  actionDivider: {height: 1, backgroundColor: '#F5F5F5', marginHorizontal: sw(14)},
  actionIcon: {
    width: sw(40), height: sw(40), borderRadius: sw(10),
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  actionTitle: {fontFamily: fonts.textFont, fontSize: sw(14), fontWeight: '600', color: '#171816'},
  actionSub: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#9CA3AF', marginTop: sw(2)},

  /* Primary CTA */
  primaryBtn: {
    borderRadius: sw(14), height: sw(56),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sw(10),
  },
  primaryBtnText: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '700', color: '#FFFFFF'},
});

export default JobDetailsScreen;
