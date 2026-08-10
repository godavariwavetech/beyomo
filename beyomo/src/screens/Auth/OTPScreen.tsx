import React, {useState, useRef, useEffect} from 'react';
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
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import {fonts} from '../../config/theme';
import {BASE_URL, endpoints} from '../../config/config';
import {verifyLoginOtp, requestLoginOtp, clearMessage} from '../../redux/reducers/auth';
import {setSelectedCity} from '../../redux/reducers/city';
import {findCityForLocation} from '../../utils/geoUtils';
import type {AppDispatch, RootState} from '../../redux/store';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

const getPosition = (): Promise<{lat: number; lng: number}> =>
  new Promise((resolve, reject) =>
    Geolocation.getCurrentPosition(
      pos => resolve({lat: pos.coords.latitude, lng: pos.coords.longitude}),
      reject,
      {enableHighAccuracy: true, timeout: 4000, maximumAge: 60000},
    ),
  );

const OTPScreen = ({navigation, route}: any) => {
  const phone: string = route?.params?.phone ?? '';
  const dispatch = useDispatch<AppDispatch>();
  const {loading, message} = useSelector((state: RootState) => state.Auth);
  const selectedCity = useSelector((state: RootState) => state.City?.selectedCity);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [detecting, setDetecting] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  useEffect(() => {
    return () => {
      dispatch(clearMessage());
    };
  }, [dispatch]);

  const handleChange = (val: string, idx: number) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length < OTP_LENGTH || loading || detecting) return;
    const result = await dispatch(verifyLoginOtp({phone, otp: otpString}));
    if (verifyLoginOtp.fulfilled.match(result)) {
      const isNew = result.payload?.data?.isNew ?? false;
      const nextRoute = isNew ? 'Register' : 'Main';

      if (selectedCity) {
        navigation.replace(nextRoute);
        return;
      }

      // No city saved yet — try to auto-detect via GPS
      setDetecting(true);
      try {
        const resp = await fetch(`${BASE_URL}${endpoints.CITIES}`);
        const data = await resp.json();
        const cities = Array.isArray(data.data) ? data.data : [];

        if (cities.length > 0) {
          const permission =
            Platform.OS === 'ios'
              ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
              : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

          let status = await check(permission);
          if (status === RESULTS.NOT_DETERMINED || status === RESULTS.DENIED) {
            status = await request(permission);
          }

          if (status === RESULTS.GRANTED) {
            try {
              const pos = await getPosition();
              const matched = findCityForLocation(pos.lat, pos.lng, cities);
              if (matched) {
                dispatch(setSelectedCity(matched));
                navigation.replace(nextRoute);
                return;
              }
            } catch { /* GPS timeout */ }
          }
        }
      } catch { /* network error */ }

      // GPS failed or outside service area — let user pick manually
      navigation.replace('CitySelector', {nextRoute});
    }
  };

  const handleResend = async () => {
    if (timer > 0 || loading) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setTimer(RESEND_SECONDS);
    inputRefs.current[0]?.focus();
    dispatch(requestLoginOtp(phone));
  };

  const isComplete = otp.every(d => d !== '');
  const isBusy = loading || detecting;

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

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(22)} color="#FDD77A" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.appName}>BEYOMO</Text>
          <View style={styles.taglineRow}>
            <View style={styles.taglineLine} />
            <Text style={styles.tagline}>SALON COMES HOME</Text>
            <View style={styles.taglineLine} />
          </View>

          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="chatbubble-ellipses-outline" size={sw(28)} color="#FDD77A" />
            </View>
            <Text style={styles.cardTitle}>Verify OTP</Text>
            <Text style={styles.cardSubtitle}>We've sent a 4-digit code to</Text>
            <Text style={styles.phoneDisplay}>+91 {phone}</Text>

            <View style={styles.otpRow}>
              {otp.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={r => {
                    if (r) inputRefs.current[idx] = r;
                  }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={val => handleChange(val, idx)}
                  onKeyPress={e => handleKeyPress(e, idx)}
                  caretHidden
                  selectTextOnFocus
                />
              ))}
            </View>

            {message ? <Text style={styles.errorText}>{message}</Text> : null}

            <TouchableOpacity
              onPress={handleVerify}
              activeOpacity={0.8}
              disabled={!isComplete || isBusy}
              style={[styles.btnWrapper, (!isComplete || isBusy) && styles.btnDisabled]}>
              <LinearGradient
                colors={isComplete && !isBusy ? ['#E4BA69', '#FDD77A', '#E3BB67'] : ['#888', '#888']}
                style={styles.btn}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                {isBusy ? (
                  <ActivityIndicator color="#1a1a1a" />
                ) : (
                  <Text style={styles.btnText}>Verify OTP</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            {detecting && (
              <Text style={styles.detectingText}>Detecting your location…</Text>
            )}

            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Didn't receive the code? </Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={timer > 0}
                activeOpacity={0.7}>
                <Text style={[styles.resendLink, timer > 0 && styles.resendDisabled]}>
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  flex: {flex: 1},
  backBtn: {
    position: 'absolute',
    top: sw(56),
    left: sw(20),
    width: sw(40),
    height: sw(40),
    borderRadius: sw(20),
    backgroundColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: sw(24),
    paddingVertical: sw(60),
    alignItems: 'center',
  },
  appName: {
    fontFamily: fonts.title,
    fontSize: sw(36),
    fontWeight: '700',
    color: '#FEFEFE',
    letterSpacing: sw(4),
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    marginTop: sw(4),
    marginBottom: sw(36),
  },
  taglineLine: {height: 1, width: sw(24), backgroundColor: '#C8A84C'},
  tagline: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#C8A84C',
    letterSpacing: sw(2),
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: sw(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: sw(24),
    alignItems: 'center',
    gap: sw(12),
  },
  iconCircle: {
    width: sw(56),
    height: sw(56),
    borderRadius: sw(28),
    backgroundColor: 'rgba(253,215,122,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253,215,122,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: fonts.title,
    fontSize: sw(22),
    fontWeight: '700',
    color: '#FEFEFE',
  },
  cardSubtitle: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: -sw(4),
  },
  phoneDisplay: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#FDD77A',
    marginTop: -sw(6),
  },
  otpRow: {flexDirection: 'row', gap: sw(10), marginTop: sw(8)},
  otpBox: {
    width: sw(44),
    height: sw(52),
    borderRadius: sw(10),
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#FEFEFE',
    fontSize: sw(20),
    fontFamily: fonts.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: '#FDD77A',
    backgroundColor: 'rgba(253,215,122,0.10)',
  },
  errorText: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#FF6B6B',
    textAlign: 'center',
  },
  btnWrapper: {width: '100%', borderRadius: sw(12), overflow: 'hidden', marginTop: sw(4)},
  btnDisabled: {opacity: 0.6},
  btn: {height: sw(52), justifyContent: 'center', alignItems: 'center'},
  btnText: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: sw(0.5),
  },
  resendRow: {flexDirection: 'row', alignItems: 'center', marginTop: -sw(4)},
  resendLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: 'rgba(255,255,255,0.45)',
  },
  resendLink: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#FDD77A',
    fontWeight: '600',
  },
  resendDisabled: {color: 'rgba(200,168,76,0.45)'},
  detectingText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: -sw(4),
  },
});

export default OTPScreen;
