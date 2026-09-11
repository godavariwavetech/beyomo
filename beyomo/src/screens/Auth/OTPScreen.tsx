import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
  Image,
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
import {pollOtpAutofill, cancelOtpAutofill} from '../../utils/otpAutofill';
import {resetTo} from '../../navigation/navigationReset';

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

  // The whole code lives in one string behind a single input — see the row below.
  const [otp, setOtp] = useState('');
  const [focused, setFocused] = useState(false);
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [detecting, setDetecting] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const submittedRef = useRef('');

  const stopAutofillWatch = useRef<() => void>(() => {});

  // Android asks the autofill service for suggestions once, when the field takes
  // focus — seconds before the SMS lands, so the first ask comes back empty and the
  // session closes. Re-asking on a backing-off schedule is what makes the code turn
  // up above the keyboard once the provider has actually seen the message.
  const startAutofillWatch = useCallback(() => {
    stopAutofillWatch.current();
    stopAutofillWatch.current = pollOtpAutofill();
  }, []);

  // RN's autoFocus fires before the view is attached, which is too early for the
  // autofill framework to open a session on it — the field ends up focused with
  // autofill never having been consulted. Deferring gives it a laid-out view.
  useEffect(() => {
    const id = setTimeout(() => {
      inputRef.current?.focus();
      startAutofillWatch();
    }, 350);
    return () => {
      clearTimeout(id);
      stopAutofillWatch.current();
      cancelOtpAutofill();
    };
  }, [startAutofillWatch]);

  // Once there are digits in the field the suggestion has either been taken or the
  // user is typing; either way stop popping the dropdown over them.
  useEffect(() => {
    if (otp.length > 0) stopAutofillWatch.current();
  }, [otp]);

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

  // Verified users go to Main with the history wiped — `replace` only swaps OTP out
  // and leaves Login underneath, so Android back dropped a signed-in user back onto
  // the phone-number page. New users still get Login behind Register, so backing out
  // of sign-up returns somewhere sensible rather than closing the app.
  const goNext = (nextRoute: string) => {
    if (nextRoute === 'Main') {
      resetTo(navigation, 'Main');
    } else {
      navigation.replace(nextRoute);
    }
  };

  const handleChange = (val: string) => {
    setOtp(val.replace(/\D/g, '').slice(0, OTP_LENGTH));
  };

  const handleVerify = async () => {
    if (otp.length < OTP_LENGTH || loading || detecting) return;
    const result = await dispatch(verifyLoginOtp({phone, otp}));
    if (verifyLoginOtp.fulfilled.match(result)) {
      const isNew = result.payload?.data?.isNew ?? false;
      const nextRoute = isNew ? 'Register' : 'Main';

      if (selectedCity) {
        goNext(nextRoute);
        return;
      }

      // No city saved yet — try to auto-detect via GPS, falling back to
      // Nellore (the only serviceable city) instead of a manual picker.
      setDetecting(true);
      let cities: any[] = [];
      try {
        const resp = await fetch(`${BASE_URL}${endpoints.CITIES}`);
        const data = await resp.json();
        cities = Array.isArray(data.data) ? data.data : [];

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
                goNext(nextRoute);
                return;
              }
            } catch { /* GPS timeout */ }
          }
        }
      } catch { /* network error */ }

      // GPS failed, denied, or outside service area — default to Nellore
      const fallbackCity = cities.find((c: any) => c.name === 'Nellore') ?? cities[0] ?? null;
      if (fallbackCity) dispatch(setSelectedCity(fallbackCity));
      goNext(nextRoute);
    }
  };

  // The code is only ever complete because the user finished typing it or the SMS
  // autofill dropped all four digits in at once — either way there is nothing left to
  // decide, so verify without making them reach for the button. Keyed on the code
  // itself so a rejected one can be corrected and retried, but a single fill never
  // fires twice.
  useEffect(() => {
    if (otp.length !== OTP_LENGTH || loading || detecting) return;
    if (submittedRef.current === otp) return;
    submittedRef.current = otp;
    Keyboard.dismiss();
    handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleResend = async () => {
    if (timer > 0 || loading) return;
    setOtp('');
    submittedRef.current = '';
    setTimer(RESEND_SECONDS);
    inputRef.current?.focus();
    // A fresh round of autofill asks for the new code.
    startAutofillWatch();
    dispatch(requestLoginOtp(phone));
  };

  const isComplete = otp.length === OTP_LENGTH;
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
          <Image
            source={require('../../assets/beyomo_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="chatbubble-ellipses-outline" size={sw(28)} color="#FDD77A" />
            </View>
            <Text style={styles.cardTitle}>Verify OTP</Text>
            <Text style={styles.cardSubtitle}>We've sent a 4-digit code to</Text>
            <Text style={styles.phoneDisplay}>+91 {phone}</Text>

            {/* One real input holding the whole code, stretched invisibly across the
                row; the boxes are just its display. Four separate inputs could never
                take an SMS autofill — the keyboard commits the full code into the one
                box that has focus, and everything past its single character is
                dropped on the floor before JS ever sees it. */}
            <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
              <View style={styles.otpRow}>
                {Array.from({length: OTP_LENGTH}).map((_, idx) => {
                  const digit = otp[idx] ?? '';
                  const isCaret = focused && idx === Math.min(otp.length, OTP_LENGTH - 1);
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.otpBox,
                        digit ? styles.otpBoxFilled : null,
                        isCaret ? styles.otpBoxActive : null,
                      ]}>
                      <Text style={styles.otpDigit}>{digit}</Text>
                    </View>
                  );
                })}
                <TextInput
                  ref={inputRef}
                  style={styles.otpHiddenInput}
                  value={otp}
                  onChangeText={handleChange}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  autoComplete="sms-otp"
                  textContentType="oneTimeCode"
                  importantForAutofill="yes"
                  caretHidden
                  selectionColor="transparent"
                  underlineColorAndroid="transparent"
                />
              </View>
            </TouchableWithoutFeedback>

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
  logo: {width: sw(190), height: sw(70), marginBottom: sw(32)},
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpDigit: {
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
  // Marks where the next digit lands, standing in for the hidden caret.
  otpBoxActive: {
    borderColor: '#FDD77A',
  },
  // The only thing actually being typed into, covering the whole row so a tap
  // anywhere on it lands here. Blanked with transparent text rather than
  // `opacity: 0` on purpose: Android treats a zero-alpha view as not visible to
  // the user and then refuses to offer autofill or the keyboard's SMS-code
  // suggestion on it, which is exactly what we need it to receive.
  otpHiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: 'transparent',
    backgroundColor: 'transparent',
    fontSize: sw(20),
    textAlign: 'center',
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
