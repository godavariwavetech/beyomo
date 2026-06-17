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
  AppState,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const MyReviewsScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const partnerId = useSelector((s: any) => s.Auth?.partnerId ?? s.Auth?.partner?.id);

  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<{average: number; total: number; distribution: Record<number, number>} | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReviews = async (isRefresh = false) => {
    if (!partnerId) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get(endpoints.PARTNER_REVIEWS(String(partnerId)), {params: {limit: 50}});
      setReviews(res.data?.data ?? []);
      setStats(res.data?.stats ?? null);
    } catch {
      // silently fail — user can pull to refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReviews();
      let interval: ReturnType<typeof setInterval> | null = setInterval(() => fetchReviews(), 10000);

      const sub = AppState.addEventListener('change', state => {
        if (state === 'active') {
          if (!interval) {
            fetchReviews();
            interval = setInterval(() => fetchReviews(), 10000);
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
    }, [partnerId]),
  );

  const avgRating = stats?.average ?? 0;
  const totalReviews = stats?.total ?? 0;
  const distribution = stats?.distribution ?? {};

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + sw(14)}]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(22)} color="#171816" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>My Reviews</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={{width: sw(22)}} />
      </View>

      {loading && reviews.length === 0 ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color="#105641" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchReviews(true)} tintColor="#105641" />}
          contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(32)}]}>

          {/* Summary card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <Text style={styles.avgRating}>{avgRating.toFixed(1)}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Ionicons
                    key={s}
                    name={s <= Math.round(avgRating) ? 'star' : 'star-outline'}
                    size={sw(16)}
                    color="#F5A623"
                  />
                ))}
              </View>
              <Text style={styles.reviewCount}>{totalReviews} review{totalReviews !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRight}>
              {[5, 4, 3, 2, 1].map(star => {
                const count = distribution[star] ?? 0;
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <View key={star} style={styles.barRow}>
                    <Text style={styles.barLabel}>{star}</Text>
                    <Ionicons name="star" size={sw(10)} color="#F5A623" />
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, {width: `${pct}%`}]} />
                    </View>
                    <Text style={styles.barCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Review list */}
          {reviews.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="star-outline" size={sw(32)} color="#CCCCCC" />
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          ) : (
            reviews.map((review: any) => {
              const customerName = review.user?.name ?? 'Customer';
              const orderId = review.booking?.bookingCode ?? `#${String(review.bookingId ?? '').slice(-8).toUpperCase()}`;
              const date = review.createdAt
                ? new Date(review.createdAt).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})
                : '';
              return (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    <View style={styles.customerInitial}>
                      <Text style={styles.initialText}>
                        {customerName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.reviewMeta}>
                      <Text style={styles.customerName}>{customerName}</Text>
                      <Text style={styles.reviewDate}>{date}  •  {orderId}</Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={sw(12)} color="#F5A623" />
                      <Text style={styles.ratingBadgeText}>{review.rating}.0</Text>
                    </View>
                  </View>

                  {!!review.service?.name && (
                    <Text style={styles.serviceTag}>{review.service.name}</Text>
                  )}

                  <View style={styles.starsSmall}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Ionicons
                        key={s}
                        name={s <= review.rating ? 'star' : 'star-outline'}
                        size={sw(13)}
                        color="#F5A623"
                      />
                    ))}
                  </View>

                  {!!review.comment && (
                    <Text style={styles.comment}>{review.comment}</Text>
                  )}
                </View>
              );
            })
          )}

        </ScrollView>
      )}
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
  titleUnderline: {
    width: sw(36),
    height: 2,
    backgroundColor: '#C49738',
  },

  scroll: {padding: sw(16), gap: sw(14)},

  /* Summary */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(14),
    padding: sw(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  summaryLeft: {
    alignItems: 'center',
    gap: sw(6),
    width: sw(80),
  },
  avgRating: {
    fontFamily: fonts.title,
    fontSize: sw(40),
    fontWeight: '700',
    color: '#171816',
    lineHeight: sw(44),
  },
  starsRow: {flexDirection: 'row', gap: sw(2)},
  reviewCount: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#5C5C5C',
  },
  summaryDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#EEEDED',
  },
  summaryRight: {
    flex: 1,
    gap: sw(6),
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
  },
  barLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#5C5C5C',
    width: sw(10),
    textAlign: 'right',
  },
  barBg: {
    flex: 1,
    height: sw(6),
    backgroundColor: '#F0F0F0',
    borderRadius: sw(3),
  },
  barFill: {
    height: sw(6),
    backgroundColor: '#F5A623',
    borderRadius: sw(3),
  },
  barCount: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#5C5C5C',
    width: sw(12),
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(14),
    paddingVertical: sw(40),
    alignItems: 'center',
    gap: sw(10),
  },
  emptyText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#888888',
  },

  /* Review card */
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(14),
    padding: sw(14),
    gap: sw(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
  },
  customerInitial: {
    width: sw(40),
    height: sw(40),
    borderRadius: sw(20),
    backgroundColor: '#012823',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#FDD77A',
  },
  reviewMeta: {flex: 1, gap: sw(2)},
  customerName: {
    fontFamily: fonts.title,
    fontSize: sw(13),
    fontWeight: '700',
    color: '#171816',
  },
  reviewDate: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#5C5C5C',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(3),
    backgroundColor: '#FFF8E7',
    borderRadius: sw(20),
    paddingHorizontal: sw(8),
    paddingVertical: sw(4),
  },
  ratingBadgeText: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#171816',
    fontWeight: '700',
  },
  serviceTag: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#105641',
    fontWeight: '600',
    backgroundColor: 'rgba(16,86,65,0.08)',
    alignSelf: 'flex-start',
    borderRadius: sw(20),
    paddingHorizontal: sw(10),
    paddingVertical: sw(3),
  },
  starsSmall: {
    flexDirection: 'row',
    gap: sw(2),
  },
  comment: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#444',
    lineHeight: sw(19),
  },
});

export default MyReviewsScreen;
