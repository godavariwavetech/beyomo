import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {fonts} from '../../config/theme';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const AUTO_REDIRECT_MS = 2500;

interface Props {
  navigation?: any;
  route?: any;
}

const OrderPlacedScreen = ({navigation, route}: Props) => {
  const bookingCode = route?.params?.bookingCode;
  const bookingId = route?.params?.bookingId;
  const paymentPending = !!route?.params?.paymentPending;

  useEffect(() => {
    if (!bookingId) return;
    const t = setTimeout(() => {
      navigation?.replace('BookingDetail', {bookingId});
    }, AUTO_REDIRECT_MS);
    return () => clearTimeout(t);
  }, [bookingId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.centerContent}>
        <View style={[styles.checkCircle, paymentPending && styles.pendingCircle]}>
          <Ionicons name={paymentPending ? 'time-outline' : 'checkmark'} size={sw(62)} color="#FFFFFF" />
        </View>

        <Text style={styles.orderText}>
          {paymentPending
            ? 'Booking saved — payment not completed yet'
            : 'Order Placed'}
        </Text>

        {paymentPending && (
          <Text style={styles.pendingSubText}>
            Your slot is on hold. Complete the payment from My Bookings to confirm it.
          </Text>
        )}

        {bookingCode ? (
          <Text style={styles.bookingCode}>Booking ID: {bookingCode}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.homeBtn}
          activeOpacity={0.85}
          onPress={() => navigation?.replace('BookingDetail', {bookingId})}>
          <Text style={styles.homeBtnText}>View Booking</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* ── Center block ── */
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sw(42),
    gap: sw(32),
  },

  /* ── Check icon ── */
  checkCircle: {
    width: sw(120),
    height: sw(120),
    borderRadius: sw(60),
    backgroundColor: '#105641',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCircle: {backgroundColor: '#FF9500'},

  /* ── Order text ── */
  orderText: {
    width: sw(310),
    fontFamily: fonts.textFont,
    fontSize: sw(16),
    lineHeight: sw(24),
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  pendingSubText: {
    width: sw(300),
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    lineHeight: sw(19),
    color: '#666666',
    textAlign: 'center',
    marginTop: sw(-16),
  },

  bookingCode: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: '#105641',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: sw(-16),
  },

  /* ── Go to Home button ── */
  homeBtn: {
    backgroundColor: '#105641',
    borderRadius: sw(32),
    paddingVertical: sw(14),
    paddingHorizontal: sw(48),
    marginTop: sw(8),
  },
  homeBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: sw(24),
  },

});

export default OrderPlacedScreen;
