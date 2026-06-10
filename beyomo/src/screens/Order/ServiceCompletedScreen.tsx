import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';
import {useDispatch, useSelector} from 'react-redux';
import {submitReview} from '../../redux/reducers/bookings';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const ServiceCompletedScreen = ({navigation, route}: any) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const {actionLoading} = useSelector((s: any) => s.Bookings);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const booking = route?.params?.booking ?? {};
  const bookingId = booking._id ?? booking.id ?? route?.params?.bookingId;
  const services: any[] = booking.services ?? [];
  const subtotal = services.reduce((s: number, i: any) => s + (i.price ?? 0), 0);
  const platformFee = booking.platformFee ?? 0;
  const total = booking.totalAmount ?? (subtotal + platformFee);

  const partner = booking.partner ?? {};
  const partnerName = partner.name ?? booking.partnerName ?? '';
  const partnerAvatar = partner.avatar ?? partner.photo ?? '';
  const partnerRole = partner.specialty ?? partner.role ?? 'Beauty Expert';
  const partnerRating = partner.averageRating ?? partner.rating ?? '';

  const scheduledAt = booking.scheduledAt;
  const dateStr = scheduledAt
    ? new Date(scheduledAt).toLocaleDateString('en-IN', {weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'}) +
      '  •  ' +
      new Date(scheduledAt).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})
    : '';

  const handleSubmit = async () => {
    if (rating === 0 || !bookingId) return;
    await dispatch(submitReview({bookingId, rating, comment: review}));
    setSubmitted(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#012823" />

      <View style={[styles.header, {paddingTop: insets.top + sw(8)}]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(22)} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Completed</Text>
        <View style={{width: sw(22)}} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(40)}]}>

        <LinearGradient
          colors={['#0E5843', '#022723']}
          style={styles.completedBanner}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <View style={styles.completedIconWrap}>
            <Ionicons name="sparkles" size={sw(32)} color="#FDD77A" />
          </View>
          <Text style={styles.completedTitle}>Service Completed!</Text>
          <Text style={styles.completedSub}>Thank you for choosing Beyomo</Text>
          {!!dateStr && (
            <View style={styles.completedDateRow}>
              <Ionicons name="calendar-outline" size={sw(13)} color="rgba(255,255,255,0.7)" />
              <Text style={styles.completedDate}>{dateStr}</Text>
            </View>
          )}
        </LinearGradient>

        {!!partnerName && (
          <View style={styles.card}>
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
                <Text style={styles.expertRole}>{partnerRole}</Text>
                {!!partnerRating && (
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={sw(11)} color="#F5A623" />
                    <Text style={styles.ratingText}>{partnerRating} avg rating</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {services.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Services Done</Text>
            {services.map((svc: any, idx: number) => (
              <View key={svc._id ?? svc.id ?? idx} style={[styles.serviceRow, idx > 0 && styles.serviceRowBorder]}>
                <View style={styles.serviceDot} />
                <View style={{flex: 1}}>
                  <Text style={styles.serviceName}>{svc.name}</Text>
                  {!!svc.duration && <Text style={styles.serviceDuration}>{svc.duration}</Text>}
                </View>
                {!!svc.price && <Text style={styles.servicePrice}>₹{svc.price}</Text>}
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalValue}>₹{total}</Text>
            </View>
          </View>
        )}

        {!submitted ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>How was your experience?</Text>
            {!!partnerName && (
              <Text style={styles.rateSubtext}>Rate {partnerName}'s service</Text>
            )}

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={sw(36)}
                    color={star <= rating ? '#F5A623' : '#D0D0D0'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {rating > 0 && (
              <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
            )}

            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience (optional)"
              placeholderTextColor="#BBBBBB"
              multiline
              numberOfLines={3}
              value={review}
              onChangeText={setReview}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitBtn, (rating === 0 || actionLoading) && styles.submitBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={rating === 0 || actionLoading}>
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.thankYouCard}>
            <Ionicons name="heart" size={sw(28)} color="#FB1616" />
            <Text style={styles.thankYouTitle}>Thank you for your feedback!</Text>
            <Text style={styles.thankYouSub}>
              Your review helps us maintain the highest standards.
            </Text>
          </View>
        )}

        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.bookAgainBtn}
            activeOpacity={0.85}
            onPress={() => navigation?.navigate('ServiceListing')}>
            <LinearGradient
              colors={['#0E5843', '#022723']}
              style={styles.bookAgainGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Text style={styles.bookAgainText}>Book Again</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            activeOpacity={0.85}
            onPress={() => navigation?.navigate('Main')}>
            <Text style={styles.homeBtnText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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

  completedBanner: {
    borderRadius: sw(14),
    padding: sw(20),
    alignItems: 'center',
    gap: sw(6),
  },
  completedIconWrap: {
    width: sw(64),
    height: sw(64),
    borderRadius: sw(32),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sw(4),
  },
  completedTitle: {fontFamily: fonts.title, fontSize: sw(20), fontWeight: '700', color: '#FFFFFF'},
  completedSub: {fontFamily: fonts.textFont, fontSize: sw(13), color: 'rgba(255,255,255,0.75)'},
  completedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    marginTop: sw(4),
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: sw(12),
    paddingVertical: sw(5),
    borderRadius: sw(20),
  },
  completedDate: {fontFamily: fonts.textFont, fontSize: sw(11), color: 'rgba(255,255,255,0.8)'},

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
  cardLabel: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#171816'},

  expertRow: {flexDirection: 'row', alignItems: 'center', gap: sw(12)},
  expertAvatar: {width: sw(56), height: sw(56), borderRadius: sw(28), backgroundColor: '#EEEDED'},
  expertAvatarFallback: {backgroundColor: '#105641', alignItems: 'center', justifyContent: 'center'},
  expertInitial: {fontFamily: fonts.title, fontSize: sw(20), color: '#FFFFFF', fontWeight: '700'},
  expertInfo: {flex: 1, gap: sw(3)},
  expertName: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700', color: '#171816'},
  expertRole: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#656565'},
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    alignSelf: 'flex-start',
    borderRadius: sw(4),
    paddingHorizontal: sw(6),
    paddingVertical: sw(2),
    gap: sw(3),
  },
  ratingText: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#171816'},

  serviceRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: sw(7), gap: sw(10)},
  serviceRowBorder: {borderTopWidth: 1, borderTopColor: '#F0F0F0'},
  serviceDot: {width: sw(6), height: sw(6), borderRadius: sw(3), backgroundColor: '#105641'},
  serviceName: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '500'},
  serviceDuration: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#656565', marginTop: sw(1)},
  servicePrice: {fontFamily: fonts.title, fontSize: sw(13), color: '#105641', fontWeight: '700'},
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderTopColor: '#EEEDED',
    paddingTop: sw(10),
    marginTop: sw(4),
  },
  totalLabel: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#171816'},
  totalValue: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700', color: '#105641'},

  rateSubtext: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#656565', marginTop: -sw(4)},
  starsRow: {flexDirection: 'row', justifyContent: 'center', gap: sw(6), paddingVertical: sw(4)},
  ratingLabel: {textAlign: 'center', fontFamily: fonts.textFont, fontSize: sw(13), color: '#F5A623', fontWeight: '600'},
  reviewInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: sw(10),
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: sw(12),
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#171816',
    minHeight: sw(80),
  },
  submitBtn: {
    backgroundColor: '#105641',
    borderRadius: sw(10),
    height: sw(46),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sw(4),
  },
  submitBtnDisabled: {opacity: 0.4},
  submitBtnText: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#FFFFFF'},

  thankYouCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(20),
    alignItems: 'center',
    gap: sw(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  thankYouTitle: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700', color: '#171816'},
  thankYouSub: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#656565', textAlign: 'center', lineHeight: sw(18)},

  ctaRow: {flexDirection: 'row', gap: sw(12), marginTop: sw(4)},
  bookAgainBtn: {flex: 1, borderRadius: sw(10), overflow: 'hidden'},
  bookAgainGradient: {height: sw(46), alignItems: 'center', justifyContent: 'center'},
  bookAgainText: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#FFFFFF'},
  homeBtn: {
    flex: 1,
    height: sw(46),
    borderRadius: sw(10),
    borderWidth: 1.5,
    borderColor: '#105641',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtnText: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '600', color: '#105641'},
});

export default ServiceCompletedScreen;
