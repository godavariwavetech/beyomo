import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import {fetchPartnerWallet} from '../../redux/reducers/partner';
import type {AppDispatch, RootState} from '../../redux/store';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

// Same en-IN date+time format the admin dashboard's settlement history uses, so a
// settlement never reads one way there and another way here.
const fmtDateTime = (d: any) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

// The wallet payload pages its ledger entries, and entries are what link a settlement to the
// bookings it covered (entry.settlementId). Asking for a wide page keeps that mapping complete
// for partners with a long history instead of silently dropping the older links.
const ENTRY_PAGE_LIMIT = 200;

// Whole rupees, matching the admin dashboard's Settlement Ledger. Rounding each entry
// and rounding the exact total disagree (11 open entries display as 6664, their exact
// sum 6663.30 rounds to 6663), so every total here is summed from already-rounded
// entries - that is what makes a column of bookings add up to the amount above it.
const rup = (n: any) => Math.round(Number(n) || 0);
const fmtRs = (n: any) => rup(n).toLocaleString('en-IN');

// Commission percent keeps its own precision (26.91%, not 27%) but drops a pointless
// trailing .00 on the whole-number rates.
const fmtPercent = (n: any) => {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

const SettlementHistoryScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const {wallet, loading} = useSelector((state: RootState) => state.Partner as any);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    () => dispatch(fetchPartnerWallet({page: 1, limit: ENTRY_PAGE_LIMIT})),
    [dispatch],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const settlements: any[] = wallet?.settlements ?? [];
  const entries: any[] = wallet?.entries ?? [];
  // Rounded outstanding, summed per entry by the API — the same figure the admin
  // dashboard prints, and what the open bookings below add up to.
  const balance = Number(
    wallet?.partner?.roundedOutstandingBalance ?? rup(wallet?.partner?.walletBalance ?? 0),
  );

  // Bookings covered by each settlement, grouped from the entries already in the payload.
  // Nothing is recomputed — an entry carries the settlementId the admin recorded against it.
  const bookingsFor = (settlementId: any) =>
    entries.filter(e => e.settlementId === settlementId);

  const firstLoad = loading && settlements.length === 0 && !wallet;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + sw(14)}]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(22)} color="#171816" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>Settlement History</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={{width: sw(22)}} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#105641" />
        }>
        {/* Current balance */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Current Balance</Text>
          <Text
            style={[
              styles.summaryValue,
              {color: balance > 0 ? '#22C55E' : balance < 0 ? '#EF4444' : '#105641'},
            ]}>
            {balance === 0
              ? 'All settled'
              : balance > 0
              ? `You'll receive ₹${fmtRs(balance)}`
              : `You owe admin ₹${fmtRs(-balance)}`}
          </Text>
          <Text style={styles.summaryHint}>
            {settlements.length} settlement{settlements.length === 1 ? '' : 's'} recorded
          </Text>
        </View>

        {firstLoad ? (
          <ActivityIndicator color="#105641" style={{marginVertical: sw(24)}} />
        ) : settlements.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={sw(32)} color="#CCCCCC" />
            <Text style={styles.emptyText}>No settlements yet</Text>
            <Text style={styles.emptySub}>
              Settlements appear here once admin records a payout or collection.
            </Text>
          </View>
        ) : (
          settlements.map((s: any) => {
            const isPayout = s.type === 'payout';
            const covered = bookingsFor(s.id);
            return (
              <View key={s.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.cardIcon,
                      {backgroundColor: isPayout ? '#E8F7EF' : '#FDECEC'},
                    ]}>
                    <Ionicons
                      name={isPayout ? 'arrow-down-circle' : 'arrow-up-circle'}
                      size={sw(20)}
                      color={isPayout ? '#22C55E' : '#EF4444'}
                    />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.cardTitle}>
                      {isPayout ? 'Paid to you' : 'Collected from you'}
                    </Text>
                    <Text style={styles.cardDate}>{fmtDateTime(s.createdAt)}</Text>
                  </View>
                  <Text
                    style={[styles.cardAmount, {color: isPayout ? '#22C55E' : '#EF4444'}]}>
                    {isPayout ? '+' : '-'}₹{fmtRs(s.amount)}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  {!!s.method && (
                    <View style={styles.chip}>
                      <Ionicons name="card-outline" size={sw(12)} color="#105641" />
                      <Text style={styles.chipText}>
                        {String(s.method).replace(/_/g, ' ')}
                      </Text>
                    </View>
                  )}
                  <View style={styles.chip}>
                    <Ionicons name="swap-horizontal" size={sw(12)} color="#105641" />
                    <Text style={styles.chipText}>
                      ₹{fmtRs(s.balanceBefore)} → ₹{fmtRs(s.balanceAfter)}
                    </Text>
                  </View>
                </View>

                {!!s.note && <Text style={styles.note}>{s.note}</Text>}

                {covered.length > 0 && (
                  <View style={styles.bookingsBlock}>
                    <Text style={styles.bookingsLabel}>
                      {covered.length === 1
                        ? 'Booking settled'
                        : `${covered.length} bookings settled`}
                    </Text>
                    {covered.map((e: any) => (
                      <View key={e.id} style={styles.bookingRow}>
                        <Text style={styles.bookingCode}>
                          {e.bookingCode ?? `Entry ${e.id}`}
                        </Text>
                        <Text style={styles.bookingMeta}>
                          {e.paymentMode === 'cod' ? 'COD' : 'Online'} ·{' '}
                          {fmtPercent(e.commissionPercent)}% commission
                        </Text>
                        <Text style={styles.bookingAmount}>₹{fmtRs(e.amount)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
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
    paddingBottom: sw(12),
    backgroundColor: '#F5F5F5',
  },
  titleBlock: {alignItems: 'center', gap: sw(6)},
  headerTitle: {
    fontFamily: fonts.primary,
    fontSize: sw(20),
    fontWeight: '400',
    color: '#012823',
  },
  titleUnderline: {width: sw(36), height: 2, backgroundColor: '#C49738'},

  scroll: {padding: sw(16), gap: sw(14), paddingBottom: sw(32)},

  /* Summary */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(14),
    padding: sw(16),
    gap: sw(4),
  },
  summaryLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {fontFamily: fonts.title, fontSize: sw(18), fontWeight: '700'},
  summaryHint: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#888888'},

  /* Empty */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(14),
    paddingVertical: sw(40),
    paddingHorizontal: sw(20),
    alignItems: 'center',
    gap: sw(10),
  },
  emptyText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#888888'},
  emptySub: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#AAAAAA',
    textAlign: 'center',
  },

  /* Settlement card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(14),
    padding: sw(14),
    gap: sw(10),
  },
  cardTop: {flexDirection: 'row', alignItems: 'center', gap: sw(10)},
  cardIcon: {
    width: sw(36),
    height: sw(36),
    borderRadius: sw(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    fontWeight: '600',
    color: '#171816',
  },
  cardDate: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#888888',
    marginTop: sw(2),
  },
  cardAmount: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700'},

  metaRow: {flexDirection: 'row', flexWrap: 'wrap', gap: sw(8)},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    backgroundColor: '#F1F6F3',
    borderRadius: sw(8),
    paddingHorizontal: sw(8),
    paddingVertical: sw(4),
  },
  chipText: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#105641',
    textTransform: 'capitalize',
  },

  note: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#666666'},

  bookingsBlock: {
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    paddingTop: sw(10),
    gap: sw(8),
  },
  bookingsLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    fontWeight: '600',
    color: '#888888',
  },
  bookingRow: {flexDirection: 'row', alignItems: 'center', gap: sw(8)},
  bookingCode: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '600',
    color: '#171816',
  },
  bookingMeta: {flex: 1, fontFamily: fonts.textFont, fontSize: sw(10), color: '#999999'},
  bookingAmount: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '700',
    color: '#171816',
  },
});

export default SettlementHistoryScreen;
