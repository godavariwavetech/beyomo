import React, {useState, useEffect} from 'react';
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
  AppState,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import {fetchPartnerEarnings, fetchPartnerWallet} from '../../redux/reducers/partner';
import type {AppDispatch, RootState} from '../../redux/store';
import {formatAmount} from '../../utils/utils';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

type Period = 'week' | 'month' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'This Week',
  month: 'This Month',
  all: 'All Time',
};

const EarningsDashboardScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const {earningsByPeriod, earningsLoading, wallet} = useSelector(
    (state: RootState) => state.Partner as any,
  );
  const [period, setPeriod] = useState<Period>('month');
  const [refreshing, setRefreshing] = useState(false);

  const loadEarnings = (p: Period) => {
    dispatch(fetchPartnerEarnings(p));
    dispatch(fetchPartnerWallet({}));
  };

  useEffect(() => {
    loadEarnings(period);
  }, [period]);

  // Keep earnings/wallet live while this screen is focused and the app is foregrounded.
  useFocusEffect(
    React.useCallback(() => {
      let interval: ReturnType<typeof setInterval> | null = setInterval(() => loadEarnings(period), 10000);

      const sub = AppState.addEventListener('change', state => {
        if (state === 'active') {
          if (!interval) {
            loadEarnings(period);
            interval = setInterval(() => loadEarnings(period), 10000);
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
    }, [period]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([dispatch(fetchPartnerEarnings(period)), dispatch(fetchPartnerWallet({}))]);
    setRefreshing(false);
  };

  const balance = wallet?.partner?.walletBalance ?? 0;
  const settlementLabel = balance > 0
    ? `You'll receive ₹${formatAmount(balance)}`
    : balance < 0
      ? `You owe admin ₹${formatAmount(-balance)}`
      : 'All settled — no pending dues';
  const settlementColor = balance > 0 ? '#22C55E' : balance < 0 ? '#EF4444' : '#105641';

  // Read the slice for the period actually being shown. Previously this compared the single
  // cached response's `period` against the selected tab and fell back to null whenever they
  // disagreed — which is every render between tapping a tab and its response landing, so the
  // amounts blanked out to placeholders and the header dropped to the all-time fallback.
  const current = earningsByPeriod?.[period] ?? null;
  // Rating, review count and the all-time total do not vary by period, so read them from
  // whichever period has already loaded — otherwise opening a new tab briefly reports
  // "No ratings yet" for a partner who clearly has ratings.
  const anyLoaded =
    current ?? (Object.values(earningsByPeriod ?? {}).find(Boolean) as any) ?? null;
  const stats = current?.stats ?? null;
  const recentEarnings: any[] = current?.recentEarnings ?? [];
  const avgRating = anyLoaded?.averageRating;
  const totalReviews = anyLoaded?.totalReviews ?? 0;
  const totalEarnings = anyLoaded?.totalEarnings ?? 0;
  // Only block on the spinner the first time a period is opened; a refresh of an
  // already-loaded period keeps the previous figures on screen instead of flashing.
  const firstLoad = earningsLoading && !current;

  const fmtCurrency = (n: number) => {
    const v = Number(n) || 0;
    return v >= 100000
      ? `₹${(v / 100000).toFixed(1)}L`
      : `₹${formatAmount(v)}`;
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FDD77A" />}
        contentContainerStyle={{paddingBottom: sw(24)}}>

        {/* Header */}
        <LinearGradient
          colors={['#0E5843', '#022723']}
          style={[styles.header, {paddingTop: insets.top + sw(12)}]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerLabel}>
                {period === 'all' ? 'Total Earnings (All Time)' : `Earnings — ${PERIOD_LABELS[period]}`}
              </Text>
              {firstLoad ? (
                <ActivityIndicator color="#FDD77A" style={{marginTop: sw(8)}} />
              ) : (
                <Text style={styles.headerAmount}>
                  {fmtCurrency(stats ? stats.earned : totalEarnings)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={sw(22)} color="#FDD77A" />
            </TouchableOpacity>
          </View>

          {/* Period selector */}
          <View style={styles.periodRow}>
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                activeOpacity={0.8}
                onPress={() => setPeriod(p)}>
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                  {PERIOD_LABELS[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatVal}>{stats?.jobs ?? '—'}</Text>
              <Text style={styles.quickStatLabel}>Jobs</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatVal}>
                {stats ? fmtCurrency(stats.earned) : '—'}
              </Text>
              <Text style={styles.quickStatLabel}>Earned</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={sw(13)} color="#FDD77A" />
                <Text style={styles.quickStatVal}>
                  {avgRating != null ? Number(avgRating).toFixed(1) : '—'}
                </Text>
              </View>
              <Text style={styles.quickStatLabel}>Rating</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Rating card */}
        <View style={[styles.ratingCard, styles.mx16, styles.mt16]}>
          <View style={styles.ratingLeft}>
            <View style={styles.ratingStarRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons
                  key={s}
                  name={
                    avgRating != null
                      ? s <= Math.floor(avgRating)
                        ? 'star'
                        : s === Math.ceil(avgRating) && avgRating % 1 >= 0.5
                        ? 'star-half'
                        : 'star-outline'
                      : 'star-outline'
                  }
                  size={sw(18)}
                  color="#F5A623"
                />
              ))}
            </View>
            <Text style={styles.ratingValue}>
              {avgRating != null ? `${Number(avgRating).toFixed(1)} Rating` : 'No ratings yet'}
            </Text>
            <Text style={styles.ratingReviews}>Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}</Text>
          </View>
          <LinearGradient
            colors={['#FDD77A', '#E4BA69']}
            style={styles.earnMoreBadge}>
            <Ionicons name="trending-up" size={sw(14)} color="#012823" />
            <Text style={styles.earnMoreText}>Earn more rewards!</Text>
          </LinearGradient>
        </View>

        {/* Recent earnings */}
        <View style={[styles.mx16, styles.mt16]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Earnings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Jobs')}>
              <Text style={styles.viewAll}>View All Jobs</Text>
            </TouchableOpacity>
          </View>

          {firstLoad ? (
            <ActivityIndicator color="#012823" style={{marginVertical: sw(16)}} />
          ) : recentEarnings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No completed jobs yet for this period.</Text>
            </View>
          ) : (
            <View style={styles.earningsList}>
              {recentEarnings.map((item: any, idx: number) => (
                <View
                  key={item._id ?? idx}
                  style={[styles.earningRow, idx < recentEarnings.length - 1 && styles.earningRowBorder]}>
                  <View style={styles.earningIcon}>
                    <Ionicons name="checkmark-circle" size={sw(20)} color="#105641" />
                  </View>
                  <View style={styles.earningInfo}>
                    <Text style={styles.earningService}>{item.service}</Text>
                    <Text style={styles.earningMeta}>{item.orderId}  •  {item.date}</Text>
                  </View>
                  <Text style={styles.earningNet}>+₹{formatAmount(item.net)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Settlement summary */}
        <View style={[styles.settlementCard, styles.mx16, styles.mt16]}>
          <Text style={styles.settlementTitle}>Settlement</Text>
          <Text style={[styles.settlementAmount, {color: settlementColor}]}>{settlementLabel}</Text>
          <Text style={styles.settlementHint}>
            Cash-on-delivery jobs: you collect payment and owe admin their commission share.
            Online jobs: admin holds payment and owes you your earning share.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F5F5'},
  mx16: {marginHorizontal: sw(16)},
  mt16: {marginTop: sw(16)},

  /* Header */
  header: {
    paddingHorizontal: sw(16),
    paddingBottom: sw(20),
    gap: sw(16),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: 'rgba(255,255,255,0.65)',
    marginBottom: sw(4),
  },
  headerAmount: {
    fontFamily: fonts.title,
    fontSize: sw(32),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: sw(38),
  },

  /* Period */
  periodRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: sw(10),
    padding: sw(4),
    gap: sw(4),
  },
  periodBtn: {
    flex: 1,
    paddingVertical: sw(7),
    borderRadius: sw(8),
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  periodText: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  periodTextActive: {
    color: '#012823',
    fontWeight: '700',
  },

  /* Quick stats */
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: sw(12),
    paddingVertical: sw(12),
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: sw(3),
  },
  quickStatDivider: {
    width: 1,
    height: sw(28),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
  },
  ratingRow: {flexDirection: 'row', alignItems: 'center', gap: sw(3)},
  quickStatVal: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickStatLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(10),
    color: 'rgba(255,255,255,0.6)',
  },

  /* Rating card */
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  ratingLeft: {gap: sw(4)},
  ratingStarRow: {flexDirection: 'row', gap: sw(3)},
  ratingValue: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#171816',
  },
  ratingReviews: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#5C5C5C',
  },
  earnMoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(5),
    borderRadius: sw(20),
    paddingHorizontal: sw(12),
    paddingVertical: sw(8),
  },
  earnMoreText: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#012823',
    fontWeight: '700',
  },

  /* Sections */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sw(10),
  },
  sectionTitle: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#171816',
  },
  viewAll: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#012823',
    fontWeight: '500',
  },

  /* Earnings list */
  earningsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    paddingHorizontal: sw(14),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(12),
    paddingVertical: sw(12),
  },
  earningRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  earningIcon: {
    width: sw(36),
    height: sw(36),
    borderRadius: sw(18),
    backgroundColor: 'rgba(16,86,65,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningInfo: {flex: 1, gap: sw(3)},
  earningService: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#171816',
    fontWeight: '600',
  },
  earningMeta: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#5C5C5C',
  },
  earningNet: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#105641',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(24),
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#888',
    textAlign: 'center',
  },

  /* Settlement */
  settlementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(16),
    gap: sw(6),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  settlementTitle: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#171816',
  },
  settlementAmount: {
    fontFamily: fonts.title,
    fontSize: sw(18),
    fontWeight: '800',
  },
  settlementHint: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#9CA3AF',
    lineHeight: sw(16),
    marginTop: sw(2),
  },
});

export default EarningsDashboardScreen;
