import React from 'react';
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

interface Props {
  navigation?: any;
  route?: any;
}

const OrderPlacedScreen = ({navigation, route}: Props) => {
  const bookingCode = route?.params?.bookingCode;
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.centerContent}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={sw(62)} color="#FFFFFF" />
        </View>

        <Text style={styles.orderText}>
          Order Placed for Home{'\n'}123, Palm Residency, Madhapur Main Road, Hyderabad – 500081
        </Text>

        {bookingCode ? (
          <Text style={styles.bookingCode}>Booking ID: {bookingCode}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.homeBtn}
          activeOpacity={0.85}
          onPress={() => navigation?.navigate('Main')}>
          <Text style={styles.homeBtnText}>Go to Home</Text>
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
