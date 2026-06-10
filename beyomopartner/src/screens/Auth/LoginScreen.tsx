import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import {requestLoginOtp, clearMessage} from '../../redux/reducers/auth';
import type {AppDispatch, RootState} from '../../redux/store';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const LoginScreen = ({navigation}: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const {loading, message} = useSelector((state: RootState) => state.Auth);
  const [phone, setPhone] = useState('');

  const isValid = phone.length === 10;

  useEffect(() => {
    return () => {
      dispatch(clearMessage());
    };
  }, [dispatch]);

  const handleSendOtp = async () => {
    if (!isValid || loading) return;
    const result = await dispatch(requestLoginOtp(phone));
    if (requestLoginOtp.fulfilled.match(result)) {
      navigation.navigate('OTP', {phone});
    }
  };

  return (
    <LinearGradient
      colors={['#0E5843', '#022723']}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── Logo area ── */}
          <View style={styles.logoSection}>
            <Text style={styles.appName}>BEYOMO</Text>
            <View style={styles.taglineRow}>
              <View style={styles.taglineLine} />
              <Text style={styles.tagline}>SALON COMES HOME</Text>
              <View style={styles.taglineLine} />
            </View>
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back!</Text>
            <Text style={styles.cardSubtitle}>
              Enter your mobile number to continue
            </Text>

            {/* Phone input */}
            <View style={styles.inputWrapper}>
              <View style={styles.prefixBox}>
                <Text style={styles.prefixFlag}>🇮🇳</Text>
                <Text style={styles.prefixCode}>+91</Text>
                <View style={styles.prefixDivider} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter mobile number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                returnKeyType="done"
                onSubmitEditing={handleSendOtp}
              />
            </View>

            {message ? <Text style={styles.errorText}>{message}</Text> : null}

            {/* Send OTP button */}
            <TouchableOpacity
              onPress={handleSendOtp}
              activeOpacity={0.8}
              disabled={!isValid || loading}
              style={[styles.btnWrapper, (!isValid || loading) && styles.btnDisabled]}>
              <LinearGradient
                colors={isValid && !loading ? ['#E4BA69', '#FDD77A', '#E3BB67'] : ['#888', '#888']}
                style={styles.btn}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                {loading ? (
                  <ActivityIndicator color="#1a1a1a" />
                ) : (
                  <Text style={styles.btnText}>Send OTP</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.terms}>
              By continuing you agree to our{' '}
              <Text
                style={styles.termsLink}
                onPress={() => Alert.alert('Terms & Conditions', 'By using Beyomo, you agree to our terms of service, privacy policy, and refund policy. All bookings are subject to availability.')}>
                Terms & Conditions
              </Text>
            </Text>
          </View>

          {/* ── Decorative gold line ── */}
          <View style={styles.bottomDeco}>
            <View style={styles.decoLine} />
            <Ionicons name="leaf-outline" size={sw(16)} color="#C8A84C" />
            <View style={styles.decoLine} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  flex: {flex: 1},
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: sw(24),
    paddingVertical: sw(60),
  },

  /* ── Logo ── */
  logoSection: {
    alignItems: 'center',
    marginBottom: sw(48),
  },
  appName: {
    fontFamily: fonts.title,
    fontSize: sw(42),
    fontWeight: '700',
    color: '#FEFEFE',
    letterSpacing: sw(4),
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    marginTop: sw(4),
  },
  taglineLine: {
    height: 1,
    width: sw(30),
    backgroundColor: '#C8A84C',
  },
  tagline: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#C8A84C',
    letterSpacing: sw(2),
  },

  /* ── Card ── */
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: sw(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: sw(24),
    gap: sw(16),
  },
  cardTitle: {
    fontFamily: fonts.title,
    fontSize: sw(24),
    fontWeight: '700',
    color: '#FEFEFE',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginTop: -sw(8),
  },

  /* ── Phone input ── */
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: sw(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    height: sw(52),
    marginTop: sw(8),
    overflow: 'hidden',
  },
  prefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sw(12),
    gap: sw(6),
  },
  prefixFlag: {fontSize: sw(18)},
  prefixCode: {
    fontFamily: fonts.textFont,
    fontSize: sw(14),
    color: '#FEFEFE',
    fontWeight: '600',
  },
  prefixDivider: {
    width: 1,
    height: sw(22),
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginLeft: sw(4),
  },
  input: {
    flex: 1,
    fontFamily: fonts.textFont,
    fontSize: sw(15),
    color: '#FEFEFE',
    paddingHorizontal: sw(12),
    height: '100%',
  },

  errorText: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: -sw(8),
  },

  /* ── Button ── */
  btnWrapper: {
    borderRadius: sw(12),
    overflow: 'hidden',
    marginTop: sw(4),
  },
  btnDisabled: {opacity: 0.6},
  btn: {
    height: sw(52),
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: sw(0.5),
  },

  /* ── Terms ── */
  terms: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: -sw(4),
  },
  termsLink: {
    color: '#C8A84C',
    fontWeight: '600',
  },

  /* ── Bottom decoration ── */
  bottomDeco: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: sw(40),
    gap: sw(12),
  },
  decoLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(200, 168, 76, 0.4)',
  },
});

export default LoginScreen;
