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
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import {requestLoginOtp, clearMessage} from '../../redux/reducers/auth';
import type {AppDispatch, RootState} from '../../redux/store';
import {resetTo} from '../../navigation/navigationReset';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const LoginScreen = ({navigation, route}: any) => {
  const insets = useSafeAreaInsets();
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
      navigation.navigate('OTP', {phone, ...(Platform.OS === 'ios' && route?.params?.returnToCheckout ? {returnToCheckout: true} : {})});
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <View style={styles.logoSection}>
            <Image
              source={require('../../assets/beyomo_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back!</Text>
            <Text style={styles.cardSubtitle}>
              Enter your mobile number to continue
            </Text>

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

            <Text style={styles.terms}>
              By continuing you agree to our{' '}
              <Text
                style={styles.termsLink}
                onPress={() =>
                  Alert.alert(
                    'Terms & Conditions',
                    'By using Beyomo, you agree to our terms of service, privacy policy, and refund policy.',
                  )
                }>
                Terms & Conditions
              </Text>
            </Text>
          </View>

          {Platform.OS === 'ios' && (
            <View style={styles.browseSection}>
              <View style={styles.browseDivider}>
                <View style={styles.browseDividerLine} />
                <Text style={styles.browseDividerText}>or</Text>
                <View style={styles.browseDividerLine} />
              </View>
              <TouchableOpacity
                style={styles.browseButton}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Continue browsing without logging in"
                onPress={() => resetTo(navigation, 'Main')}>
                <Text style={styles.browseButtonText}>Continue browsing</Text>
                <Ionicons name="arrow-forward" size={20} color="#FDD77A" />
              </TouchableOpacity>
              <Text style={styles.browseHint}>Explore services. Log in when you're ready to book.</Text>
            </View>
          )}

          <View style={styles.bottomDeco}>
            <View style={styles.decoLine} />
            <Ionicons name="leaf-outline" size={sw(16)} color="#C8A84C" />
            <View style={styles.decoLine} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
      {Platform.OS === 'ios' && navigation.canGoBack() && (
        <TouchableOpacity
          style={[styles.backButton, {top: insets.top + sw(8)}]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={sw(22)} color="#FDD77A" />
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  backButton: {
    position: 'absolute',
    left: sw(16),
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {flex: 1},
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: sw(24),
    paddingVertical: sw(60),
  },
  logoSection: {alignItems: 'center', marginBottom: sw(48)},
  logo: {width: sw(220), height: sw(80)},
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
  btnWrapper: {borderRadius: sw(12), overflow: 'hidden', marginTop: sw(4)},
  btnDisabled: {opacity: 0.6},
  btn: {height: sw(52), justifyContent: 'center', alignItems: 'center'},
  btnText: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: sw(0.5),
  },
  terms: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: -sw(4),
  },
  termsLink: {color: '#C8A84C', fontWeight: '600'},
  browseSection: {marginTop: sw(20), gap: sw(14)},
  browseDivider: {flexDirection: 'row', alignItems: 'center', gap: sw(12)},
  browseDividerLine: {flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.16)'},
  browseDividerText: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: 'rgba(255,255,255,0.65)',
  },
  browseButton: {
    minHeight: 48,
    paddingVertical: sw(14),
    paddingHorizontal: sw(20),
    borderRadius: sw(12),
    borderWidth: 1,
    borderColor: 'rgba(253,215,122,0.55)',
    backgroundColor: 'rgba(253,215,122,0.06)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: sw(10),
  },
  browseButtonText: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '600',
    color: '#FDD77A',
    flexShrink: 1,
    textAlign: 'center',
  },
  browseHint: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    lineHeight: sw(18),
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    paddingHorizontal: sw(8),
  },
  bottomDeco: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: sw(40),
    gap: sw(12),
  },
  decoLine: {flex: 1, height: 1, backgroundColor: 'rgba(200, 168, 76, 0.4)'},
});

export default LoginScreen;
