import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

type Review = {
  id: string;
  customerName: string;
  service: string;
  orderId: string;
  rating: number;
  date: string;
  comment: string;
};

const REVIEWS: Review[] = [
  {
    id: '1',
    customerName: 'Priya Nair',
    service: 'Gold Facial',
    orderId: 'BYM102548',
    rating: 5,
    date: '20 May 2026',
    comment: 'Absolutely loved the service! Riya was very professional and gentle. My skin feels amazing!',
  },
  {
    id: '2',
    customerName: 'Ananya Mehta',
    service: 'Hair Spa & Treatment',
    orderId: 'BYM100123',
    rating: 4,
    date: '18 May 2026',
    comment: 'Great experience overall. Very thorough and punctual. Will definitely book again.',
  },
  {
    id: '3',
    customerName: 'Deepika S.',
    service: 'Bridal Makeup',
    orderId: 'BYM100098',
    rating: 5,
    date: '15 May 2026',
    comment: 'The bridal makeup was stunning! Exactly what I wanted. Highly recommend Riya for bridal services.',
  },
  {
    id: '4',
    customerName: 'Kavitha R.',
    service: 'Full Waxing',
    orderId: 'BYM100054',
    rating: 4,
    date: '10 May 2026',
    comment: 'Good service, clean and hygienic. Quick and efficient.',
  },
];

const AVG_RATING = REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length;

const MyReviewsScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(32)}]}>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Text style={styles.avgRating}>{AVG_RATING.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons
                  key={s}
                  name={s <= Math.round(AVG_RATING) ? 'star' : 'star-outline'}
                  size={sw(16)}
                  color="#F5A623"
                />
              ))}
            </View>
            <Text style={styles.reviewCount}>{REVIEWS.length} reviews</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRight}>
            {[5, 4, 3, 2, 1].map(star => {
              const count = REVIEWS.filter(r => r.rating === star).length;
              const pct = (count / REVIEWS.length) * 100;
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
        {REVIEWS.map(review => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <View style={styles.customerInitial}>
                <Text style={styles.initialText}>
                  {review.customerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.reviewMeta}>
                <Text style={styles.customerName}>{review.customerName}</Text>
                <Text style={styles.reviewDate}>{review.date}  •  {review.orderId}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={sw(12)} color="#F5A623" />
                <Text style={styles.ratingBadgeText}>{review.rating}.0</Text>
              </View>
            </View>

            <Text style={styles.serviceTag}>{review.service}</Text>

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

            <Text style={styles.comment}>{review.comment}</Text>
          </View>
        ))}

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
