import React, {useState, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  RefreshControl,
  AppState,
  ActivityIndicator,
  Share,
  Modal,
} from 'react-native';
import {BookingsScreenSkeleton} from '../../components/Skeleton/Skeleton';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useDispatch, useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import {fetchUserBookings, cancelBooking} from '../../redux/reducers/bookings';
import type {AppDispatch, RootState} from '../../redux/store';
import {formatAmount} from '../../utils/utils';
import {downloadBookingInvoice, openInvoiceFile} from '../../utils/invoicePdf';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

type TabType = 'upcoming' | 'completed';

const UPCOMING_STATUSES = ['pending', 'confirmed', 'in_progress'];
const COMPLETED_STATUSES = ['completed', 'cancelled'];

interface Props {
  navigation?: any;
}

const BookingsScreen = ({navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const {list, loading, actionLoading} = useSelector((state: RootState) => state.Bookings);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  // In-app styled confirmation modal for cancelling a booking, replacing the OS Alert.
  const [cancelModal, setCancelModal] = useState<{bookingId: string; bookingCode: string} | null>(null);

  // Refresh on focus, then keep polling while focused — but only while the app is
  // actually in the foreground (AppState), since useFocusEffect alone doesn't pause
  // when the app is backgrounded.
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchUserBookings());
      let interval: ReturnType<typeof setInterval> | null = setInterval(() => dispatch(fetchUserBookings()), 10000);

      const sub = AppState.addEventListener('change', state => {
        if (state === 'active') {
          if (!interval) {
            dispatch(fetchUserBookings());
            interval = setInterval(() => dispatch(fetchUserBookings()), 10000);
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
    }, [dispatch]),
  );

  const bookings = list.filter((b: any) => {
    const status = (b.status ?? '').toLowerCase();
    return activeTab === 'upcoming'
      ? UPCOMING_STATUSES.includes(status)
      : COMPLETED_STATUSES.includes(status);
  });

  const handleCancel = (bookingId: string, bookingCode: string) => {
    setCancelModal({bookingId, bookingCode});
  };

  const confirmCancel = () => {
    if (cancelModal) {
      dispatch(cancelBooking(cancelModal.bookingId));
    }
    setCancelModal(null);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEDED" />

      {/* ── Header ── */}
      <View style={[styles.header, {paddingTop: insets.top + sw(14)}]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(24)} color="#000000" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Booking</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={{width: sw(24)}} />
      </View>

      {/* ── Tab switcher ── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
          activeOpacity={0.85}
          onPress={() => setActiveTab('upcoming')}>
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]}
          activeOpacity={0.85}
          onPress={() => setActiveTab('completed')}>
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Section title ── */}
      <Text style={styles.sectionTitle}>
        {activeTab === 'upcoming' ? 'Upcoming Bookings' : 'Completed Bookings'}
      </Text>

      {/* ── Booking list ── */}
      {loading && list.length === 0 ? (
        <BookingsScreenSkeleton />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, {paddingBottom: insets.bottom + sw(24)}]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => dispatch(fetchUserBookings())}
              colors={['#0E5843']}
            />
          }>
          {bookings.length === 0 ? (
            <Text style={styles.emptyText}>No {activeTab} bookings</Text>
          ) : (
            bookings.map((booking: any) => (
              <BookingCard
                key={booking._id ?? booking.id}
                booking={booking}
                isCompleted={activeTab === 'completed'}
                onViewDetails={() =>
                  navigation?.navigate('BookingDetail', {bookingId: booking.id ?? booking._id})
                }
                onBookAgain={() => navigation?.navigate('ServiceListing')}
                onCancel={() => handleCancel(booking.id ?? booking._id, booking.bookingCode)}
                onReschedule={() => navigation?.navigate('BookingDetail', {bookingId: booking.id ?? booking._id, openReschedule: true})}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* ── Cancel booking confirmation — in-app styled modal, not the OS Alert ── */}
      <Modal
        visible={!!cancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModal(null)}>
        <View style={styles.invoiceModalOverlay}>
          <View style={styles.invoiceModalCard}>
            <View style={[styles.invoiceModalIconWrap, styles.invoiceModalIconWrapError]}>
              <Ionicons name="alert-circle" size={sw(32)} color="#D64545" />
            </View>
            <Text style={styles.invoiceModalTitle}>Cancel Booking</Text>
            <Text style={styles.invoiceModalMessage}>
              Cancel booking {cancelModal?.bookingCode}?
            </Text>
            <View style={styles.cancelModalBtnRow}>
              <TouchableOpacity
                style={styles.cancelModalNoBtn}
                activeOpacity={0.85}
                onPress={() => setCancelModal(null)}>
                <Text style={styles.cancelModalNoBtnText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelModalYesBtn}
                activeOpacity={0.85}
                onPress={confirmCancel}>
                <Text style={styles.invoiceModalBtnText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const BookingCard = ({
  booking,
  isCompleted,
  onViewDetails,
  onBookAgain,
  onCancel,
  onReschedule,
}: {
  booking: any;
  isCompleted: boolean;
  onViewDetails: () => void;
  onBookAgain: () => void;
  onCancel: () => void;
  onReschedule: () => void;
}) => {
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  // In-app styled result modal for the invoice download, replacing the OS Alert.
  const [invoiceModal, setInvoiceModal] = useState<{success: boolean; title: string; message: string; path?: string} | null>(null);
  const bookingCode = booking.bookingCode ?? booking._id?.slice(-8).toUpperCase();
  const scheduledAt = booking.scheduledAt
    ? new Date(booking.scheduledAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : booking.date ?? '';
  const timeStr = booking.scheduledAt
    ? new Date(booking.scheduledAt).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: true})
    : booking.time ?? '';
  const serviceCount = booking.services?.length ?? booking.serviceCount ?? 0;
  const totalAmount = booking.totalAmount ?? booking.price ?? 0;
  const rawStatus = booking.status ?? 'Confirmed';
  const status = rawStatus
    .split('_')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  // Backend only allows cancel/reschedule while pending or confirmed — not once a partner
  // has started the job (in_progress).
  const isReschedulable = ['pending', 'confirmed'].includes((booking.status ?? '').toLowerCase());
  const createdAt = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})
    : '';

  const handleTrack = () =>
    Alert.alert('Track Expert', 'Your expert Riya Sharma is on the way! ETA: ~15 minutes.', [{text: 'OK'}]);

  // Opens the OS share sheet (WhatsApp/SMS/email/etc. — including a "Copy" option most
  // share sheets offer on their own) with the booking's details. There's no web page a
  // booking can be viewed at, so this shares a readable summary rather than a link that
  // wouldn't actually go anywhere — the previous "Booking link copied!" alert didn't call
  // any share/clipboard API at all, so nothing was ever actually copied.
  const handleShareBooking = async () => {
    const lines = [
      `Beyomo Booking ${bookingCode}`,
      status ? `Status: ${status}` : null,
      scheduledAt ? `Scheduled: ${scheduledAt}${timeStr ? ` at ${timeStr}` : ''}` : null,
      serviceCount ? `${serviceCount} service${serviceCount !== 1 ? 's' : ''}` : null,
      totalAmount ? `Total: ₹${formatAmount(totalAmount)}` : null,
    ].filter(Boolean);
    try {
      await Share.share({message: lines.join('\n')});
    } catch {
      // Share.share only rejects on a genuine platform error (not a user-dismissed
      // sheet, which resolves normally) — safe to ignore.
    }
  };

  const handleDownloadInvoice = async () => {
    if (downloadingInvoice) return;
    setDownloadingInvoice(true);
    const result = await downloadBookingInvoice(booking);
    setDownloadingInvoice(false);
    if (result.success) {
      setInvoiceModal({
        success: true,
        title: 'Downloaded successfully',
        message: 'Your invoice has been saved to Downloads.',
        path: result.path,
      });
    } else {
      setInvoiceModal({
        success: false,
        title: 'Download failed',
        message: result.message ?? 'Could not download the invoice. Please try again.',
      });
    }
  };

  return (
  <View style={styles.card}>
    {/* ── Card top ── */}
    <View style={styles.cardTop}>
      <View style={styles.cardMain}>
        {/* Row 1: created-at + dots menu */}
        <View style={styles.cardRow1}>
          <Text style={styles.createdAt}>{createdAt}</Text>
          {/* Dots menu — hidden per request, keep for potential future re-enable.
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.dotsBtn}
            onPress={() => Alert.alert(bookingCode, 'What would you like to do?', [
              {text: 'View Details', onPress: onViewDetails},
              {text: 'Share Booking', onPress: handleShareBooking},
              {text: 'Close', style: 'cancel'},
            ])}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </TouchableOpacity>
          */}
        </View>

        {/* Row 2: booking code + status badge */}
        <View style={styles.codeRow}>
          <Text style={styles.bookingCode}>{bookingCode}</Text>
          <View style={styles.statusBadgeRow}>
            {Number(booking.rescheduledCount ?? 0) > 0 && (
              <View style={styles.rescheduledBadge}>
                <Ionicons name="repeat" size={sw(11)} color="#B45309" />
                <Text style={styles.rescheduledBadgeText}>Rescheduled</Text>
              </View>
            )}
            <View style={[styles.statusBadge, isCompleted && styles.statusBadgeCompleted]}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>
        </View>

        {/* Row 3: date | time | services */}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={sw(14)} color="#105641" />
          <Text style={styles.metaText}>{scheduledAt}</Text>
          <View style={styles.metaSep} />
          <Ionicons name="time-outline" size={sw(14)} color="#105641" />
          <Text style={styles.metaText}>{timeStr}</Text>
          <View style={styles.metaSep} />
          <MaterialIcons name="spa" size={sw(14)} color="#105641" />
          <Text style={styles.metaText}>{serviceCount} Services</Text>
        </View>

        {/* Completed: rating section */}
        {isCompleted && booking.review && (
          <View style={styles.youRatedRow}>
            <Text style={styles.youRatedLabel}>You Rated</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons
                  key={s}
                  name={s <= (booking.review?.rating ?? 0) ? 'star' : 'star-outline'}
                  size={sw(14)}
                  color="#F5A623"
                />
              ))}
            </View>
          </View>
        )}

        {/* Row 4: price + view details */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{formatAmount(totalAmount)}</Text>
          <TouchableOpacity style={styles.viewDetailsBtn} activeOpacity={0.7} onPress={onViewDetails}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="arrow-forward" size={sw(12)} color="#292D32" />
          </TouchableOpacity>
        </View>
      </View>
    </View>

    {/* ── Card actions ── */}
    {isCompleted ? (
      <View style={styles.actionStrip}>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={onBookAgain}>
          <Ionicons name="refresh-outline" size={sw(16)} color="#105641" />
          <Text style={styles.actionTextGreen}>Book Again</Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          disabled={downloadingInvoice}
          onPress={handleDownloadInvoice}>
          {downloadingInvoice ? (
            <ActivityIndicator size="small" color="#5C5C5C" />
          ) : (
            <Ionicons name="document-text-outline" size={sw(16)} color="#5C5C5C" />
          )}
          <Text style={styles.actionTextGray}>Invoice</Text>
        </TouchableOpacity>
      </View>
    ) : isReschedulable ? (
      <View style={styles.actionStrip}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={onReschedule}>
          <Ionicons name="calendar-outline" size={sw(16)} color="#105641" />
          <Text style={styles.actionTextGreen}>Reschedule</Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={onCancel}>
          <Ionicons name="close-circle-outline" size={sw(16)} color="#FB1616" />
          <Text style={styles.actionTextRed}>Cancel Order</Text>
        </TouchableOpacity>

        {/* Track Expert — hidden per request, keep for potential future re-enable.
        <View style={styles.actionDivider} />

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Track Expert', 'Tracking feature coming soon.')}>
          <Ionicons name="person-outline" size={sw(14)} color="#1C46CF" />
          <Text style={styles.actionTextBlue}>Track Expert</Text>
        </TouchableOpacity>
        */}
      </View>
    ) : null}

    {/* ── Invoice download result — in-app styled modal, not the OS Alert ── */}
    <Modal
      visible={!!invoiceModal}
      transparent
      animationType="fade"
      onRequestClose={() => setInvoiceModal(null)}>
      <View style={styles.invoiceModalOverlay}>
        <View style={styles.invoiceModalCard}>
          <View
            style={[
              styles.invoiceModalIconWrap,
              !invoiceModal?.success && styles.invoiceModalIconWrapError,
            ]}>
            <Ionicons
              name={invoiceModal?.success ? 'checkmark-circle' : 'alert-circle'}
              size={sw(32)}
              color={invoiceModal?.success ? '#105641' : '#D64545'}
            />
          </View>
          <Text style={styles.invoiceModalTitle}>{invoiceModal?.title}</Text>
          <Text style={styles.invoiceModalMessage}>{invoiceModal?.message}</Text>
          <TouchableOpacity
            style={styles.invoiceModalBtn}
            activeOpacity={0.85}
            onPress={() => {
              const path = invoiceModal?.path;
              setInvoiceModal(null);
              if (path) {
                openInvoiceFile(path).catch(() => {
                  // No PDF viewer installed on the device, or the intent otherwise
                  // couldn't be resolved — the file itself is still safely saved.
                  Alert.alert('Could not open the invoice', 'The PDF was saved, but no app on this device could open it.');
                });
              }
            }}>
            <Text style={styles.invoiceModalBtnText}>{invoiceModal?.success ? 'View Invoice' : 'OK'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EEEDED',
  },
  emptyText: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: '#888',
    textAlign: 'center',
    marginTop: sw(40),
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingBottom: sw(14),
    backgroundColor: '#EEEDED',
  },
  titleBlock: {
    alignItems: 'center',
    gap: sw(8),
  },
  title: {
    fontFamily: fonts.primary,
    fontSize: sw(20),
    fontWeight: '400',
    color: '#012823',
    lineHeight: sw(23),
  },
  titleUnderline: {
    width: sw(38),
    height: 1.5,
    backgroundColor: '#C49738',
  },

  /* ── Tabs ── */
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: sw(16),
    gap: sw(10),
    marginBottom: sw(16),
  },
  tabBtn: {
    flex: 1,
    height: sw(34),
    borderRadius: sw(8),
    borderWidth: 0.5,
    borderColor: '#373737',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#012823',
    borderColor: '#012823',
  },
  tabText: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '400',
    color: '#373737',
    lineHeight: sw(18),
  },
  tabTextActive: {
    fontWeight: '500',
    color: '#FEFEFE',
  },

  /* ── Section title ── */
  sectionTitle: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    fontWeight: '600',
    color: '#373737',
    marginHorizontal: sw(16),
    marginBottom: sw(12),
    lineHeight: sw(21),
  },

  /* ── Scroll ── */
  scroll: {flex: 1},
  scrollContent: {
    paddingHorizontal: sw(16),
    gap: sw(16),
  },

  /* ── Booking card ── */
  card: {
    backgroundColor: '#FEFEFE',
    borderRadius: sw(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  cardTop: {
    paddingHorizontal: sw(12),
    paddingTop: sw(12),
    paddingBottom: sw(8),
  },
  cardMain: {
    gap: sw(12),
  },

  /* Row 1 */
  cardRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createdAt: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '500',
    color: '#5C5C5C',
    lineHeight: sw(12),
  },
  dotsBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: sw(3.3),
    padding: sw(4),
  },
  dot: {
    width: sw(2.5),
    height: sw(2.5),
    borderRadius: sw(1.25),
    backgroundColor: '#171816',
  },

  /* Row 2 */
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
  },
  bookingCode: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#105641',
    lineHeight: sw(17),
  },
  statusBadgeRow: {flexDirection: 'row', alignItems: 'center', gap: sw(6)},
  rescheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(3),
    backgroundColor: '#FEF3C7',
    borderRadius: sw(16),
    paddingHorizontal: sw(8),
    paddingVertical: sw(4),
  },
  rescheduledBadgeText: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#B45309',
    lineHeight: sw(12),
  },
  statusBadge: {
    backgroundColor: '#105641',
    borderRadius: sw(16),
    paddingHorizontal: sw(8),
    paddingVertical: sw(4),
  },
  statusBadgeCompleted: {
    backgroundColor: '#5C5C5C',
  },
  statusText: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#FFFFFF',
    lineHeight: sw(12),
  },

  /* You Rated */
  youRatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    backgroundColor: '#FFF8E7',
    borderRadius: sw(8),
    paddingHorizontal: sw(10),
    paddingVertical: sw(6),
  },
  youRatedLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#5C5C5C',
  },
  starsRow: {
    flexDirection: 'row',
    gap: sw(2),
  },
  editReview: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#105641',
    textDecorationLine: 'underline',
    marginLeft: sw(4),
  },

  /* Row 3 */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    flexWrap: 'wrap',
  },
  metaText: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '500',
    color: '#5C5C5C',
    lineHeight: sw(14),
  },
  metaSep: {
    width: 0,
    height: sw(13),
    borderLeftWidth: 0.5,
    borderLeftColor: '#828282',
    marginHorizontal: sw(4),
  },

  /* Row 4 */
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontFamily: fonts.textFont,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#000000',
    lineHeight: sw(19),
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    borderWidth: 0.5,
    borderColor: '#4F934C',
    borderRadius: sw(32),
    backgroundColor: '#F5FFF4',
    paddingHorizontal: sw(8),
    paddingVertical: sw(4),
  },
  viewDetailsText: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#012823',
    lineHeight: sw(12),
  },

  /* ── Action strip ── */
  actionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#D4D4D4',
    paddingHorizontal: sw(16),
    paddingVertical: sw(8),
    paddingBottom: sw(12),
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(6),
    flex: 1,
  },
  actionDivider: {
    width: 0,
    height: sw(16),
    borderLeftWidth: 0.5,
    borderLeftColor: '#D4D4D4',
    marginHorizontal: sw(4),
  },
  actionTextGreen: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '500',
    color: '#105641',
    lineHeight: sw(15),
  },
  actionTextRed: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '500',
    color: '#FB1616',
    lineHeight: sw(15),
  },
  actionTextBlue: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '500',
    color: '#1C46CF',
    lineHeight: sw(15),
  },
  actionTextGray: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '500',
    color: '#5C5C5C',
    lineHeight: sw(15),
  },
  invoiceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sw(32),
  },
  invoiceModalCard: {
    width: '100%',
    maxWidth: sw(340),
    backgroundColor: '#FFFFFF',
    borderRadius: sw(20),
    paddingVertical: sw(24),
    paddingHorizontal: sw(22),
    alignItems: 'center',
  },
  invoiceModalIconWrap: {
    width: sw(60),
    height: sw(60),
    borderRadius: sw(30),
    backgroundColor: '#EAF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sw(14),
  },
  invoiceModalIconWrapError: {
    backgroundColor: '#FEF0F0',
  },
  invoiceModalTitle: {
    fontFamily: fonts.title,
    fontSize: sw(17),
    fontWeight: '800',
    color: '#171816',
    textAlign: 'center',
    marginBottom: sw(8),
  },
  invoiceModalMessage: {
    fontFamily: fonts.textFont,
    fontSize: sw(13.5),
    color: '#5C5F5B',
    textAlign: 'center',
    lineHeight: sw(19),
    marginBottom: sw(20),
  },
  invoiceModalBtn: {
    width: '100%',
    height: sw(48),
    borderRadius: sw(14),
    backgroundColor: '#105641',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceModalBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(14.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelModalBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: sw(12),
  },
  cancelModalNoBtn: {
    flex: 1,
    height: sw(48),
    borderRadius: sw(14),
    borderWidth: 1,
    borderColor: '#D4D4D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalNoBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(14.5),
    fontWeight: '700',
    color: '#373737',
  },
  cancelModalYesBtn: {
    flex: 1,
    height: sw(48),
    borderRadius: sw(14),
    backgroundColor: '#FB1616',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BookingsScreen;
