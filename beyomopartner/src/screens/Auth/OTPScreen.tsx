import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  Image,
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
import {fonts} from '../../config/theme';
import {verifyLoginOtp, requestLoginOtp, clearMessage} from '../../redux/reducers/auth';
import {resetToMain} from '../../navigation/navigationRef';
import type {AppDispatch, RootState} from '../../redux/store';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

const OTPScreen = ({navigation, route}: any) => {
  const phone: string = route?.params?.phone ?? '';
  const dispatch = useDispatch<AppDispatch>();
  const {loading, message} = useSelector((state: RootState) => state.Auth);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_SECONDS);
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
    if (otpString.length < OTP_LENGTH || loading) return;
    const result = await dispatch(verifyLoginOtp({phone, otp: otpString}));
    if (verifyLoginOtp.fulfilled.match(result)) {
      const d = result.payload?.data;
      const isNewUser = d?.isNew;
      const partner = d?.partner;
      if (isNewUser || !partner?.name) {
        navigation.replace('Register', {phone});
      } else if (partner?.status === 'approved') {
        // Not replace() — that only swaps this screen, leaving Login/OTP reachable via
        // the hardware back button. Reset so entering the app clears that history.
        resetToMain();
      } else {
        navigation.replace('AccountStatus');
      }
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

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(22)} color="#FDD77A" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Image
            source={require('../../assets/beyomo_logo_icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
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
                  ref={r => {if (r) inputRefs.current[idx] = r;}}
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
              disabled={!isComplete || loading}
              style={[styles.btnWrapper, (!isComplete || loading) && styles.btnDisabled]}>
              <LinearGradient
                colors={isComplete && !loading ? ['#E4BA69', '#FDD77A', '#E3BB67'] : ['#888', '#888']}
                style={styles.btn}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                {loading ? (
                  <ActivityIndicator color="#1a1a1a" />
                ) : (
                  <Text style={styles.btnText}>Verify OTP</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Didn't receive the code? </Text>
              <TouchableOpacity onPress={handleResend} disabled={timer > 0} activeOpacity={0.7}>
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

  logo: {
    width: sw(160),
    height: sw(160),
    marginBottom: sw(8),
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
    fontSize: sw(10),
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
  errorText: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#FF6B6B',
    textAlign: 'center',
  },
});

export default OTPScreen;
