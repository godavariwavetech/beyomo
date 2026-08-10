import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'});
};

const MyReviewsScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(endpoints.USER_REVIEWS)
      .then(res => setReviews(res.data?.data?.reviews ?? res.data?.data ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEDED" />

      <View style={[styles.header, {paddingTop: insets.top + sw(14)}]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(24)} color="#000000" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>My Reviews</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={{width: sw(24)}} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#105641" style={{marginTop: sw(40)}} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(24)}]}>

          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>You haven't submitted any reviews yet.</Text>
          ) : (
            <>
              <Text style={styles.countText}>{reviews.length} Review{reviews.length !== 1 ? 's' : ''} Given</Text>

              {reviews.map((review: any) => {
                const rid = review._id ?? review.id;
                const serviceName = review.serviceName ?? review.service ?? '';
                const expertName = review.partnerName ?? review.expertName ?? review.expert ?? '';
                const expertImg = review.partnerAvatar ?? review.expertImg ?? '';
                const serviceImg = review.serviceImage ?? review.serviceImg ?? '';
                const rating = review.rating ?? 0;
                const dateStr = review.createdAt ? formatDate(review.createdAt) : (review.date ?? '');
                const comment = review.comment ?? review.review ?? '';
                return (
                  <View key={rid} style={styles.reviewCard}>
                    {!!serviceImg && (
                      <Image source={{uri: serviceImg}} style={styles.serviceImg} resizeMode="cover" />
                    )}

                    <View style={styles.cardBody}>
                      <View style={styles.serviceRow}>
                        <Text style={styles.serviceName}>{serviceName}</Text>
                        {!!dateStr && <Text style={styles.reviewDate}>{dateStr}</Text>}
                      </View>

                      {!!expertName && (
                        <View style={styles.expertRow}>
                          {!!expertImg ? (
                            <Image source={{uri: expertImg}} style={styles.expertAvatar} />
                          ) : (
                            <View style={[styles.expertAvatar, styles.expertAvatarFallback]}>
                              <Text style={styles.expertInitial}>{expertName[0]}</Text>
                            </View>
                          )}
                          <Text style={styles.expertName}>{expertName}</Text>
                        </View>
                      )}

                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Ionicons
                            key={s}
                            name={s <= rating ? 'star' : 'star-outline'}
                            size={sw(16)}
                            color="#F5A623"
                          />
                        ))}
                        <Text style={styles.ratingNum}>{rating.toFixed(1)}</Text>
                      </View>

                      {!!comment && <Text style={styles.comment}>"{comment}"</Text>}
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#EEEDED'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingBottom: sw(12),
    backgroundColor: '#EEEDED',
  },
  titleBlock: {alignItems: 'center', gap: sw(6)},
  headerTitle: {fontFamily: fonts.primary, fontSize: sw(20), fontWeight: '400', color: '#012823'},
  titleUnderline: {width: sw(38), height: 1.5, backgroundColor: '#C49738'},

  scroll: {paddingHorizontal: sw(16), paddingTop: sw(4), gap: sw(14)},

  emptyText: {
    textAlign: 'center',
    color: '#A3A3A3',
    marginTop: sw(60),
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    paddingHorizontal: sw(16),
  },
  countText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#5C5C5C',
    fontWeight: '500',
  },

  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  serviceImg: {width: '100%', height: sw(120)},

  cardBody: {padding: sw(14), gap: sw(10)},

  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceName: {
    fontFamily: fonts.title,
    fontSize: sw(14),
    fontWeight: '700',
    color: '#171816',
    flex: 1,
  },
  reviewDate: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#A3A3A3'},

  expertRow: {flexDirection: 'row', alignItems: 'center', gap: sw(8)},
  expertAvatar: {
    width: sw(28),
    height: sw(28),
    borderRadius: sw(14),
    backgroundColor: '#EEEDED',
  },
  expertAvatarFallback: {
    backgroundColor: '#105641',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertInitial: {fontFamily: fonts.title, fontSize: sw(12), color: '#FFFFFF', fontWeight: '700'},
  expertName: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#656565'},

  starsRow: {flexDirection: 'row', alignItems: 'center', gap: sw(3)},
  ratingNum: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#5C5C5C',
    fontWeight: '600',
    marginLeft: sw(4),
  },

  comment: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#5C5C5C',
    lineHeight: sw(19),
    fontStyle: 'italic',
  },
});

export default MyReviewsScreen;
