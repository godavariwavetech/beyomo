import React, {useEffect} from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector, useDispatch} from 'react-redux';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import {fonts} from '../../config/theme';
import {BASE_URL, endpoints} from '../../config/config';
import {setSelectedCity} from '../../redux/reducers/city';
import {findCityForLocation} from '../../utils/geoUtils';
import {checkForceUpdate} from '../../utils/versionCheck';
import type {RootState} from '../../redux/store';

const {width, height} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;
const sh = (px: number) => (px / 852) * height;

const fetchActiveCities = async () => {
  try {
    const resp = await fetch(`${BASE_URL}${endpoints.CITIES}`);
    const data = await resp.json();
    return Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
};

const getPosition = (): Promise<{lat: number; lng: number}> =>
  new Promise((resolve, reject) =>
    Geolocation.getCurrentPosition(
      pos => resolve({lat: pos.coords.latitude, lng: pos.coords.longitude}),
      reject,
      {enableHighAccuracy: true, timeout: 4000, maximumAge: 60000},
    ),
  );

const resolvePartnerDest = (token: string | null, partner: any): string => {
  if (!token) return 'Login';
  if (!partner?.name) return 'Register';
  if (partner?.status === 'approved') return 'Main';
  return 'AccountStatus';
};

const SplashScreen = ({navigation}: any) => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.Auth.token);
  const partner = useSelector((state: RootState) => state.Auth.partner);
  const savedCity = useSelector((state: RootState) => state.City?.selectedCity);

  useEffect(() => {
    let done = false;
    const go = (dest: string, params?: any) => {
      if (done) return;
      done = true;
      navigation.replace(dest, params);
    };

    const partnerDest = resolvePartnerDest(token, partner);

    const minWait = new Promise<void>(r => setTimeout(r, 2500));
    const versionCheck = checkForceUpdate('partner');

    // Silently detect city in background — never blocks navigation. Falls back
    // to Nellore (the only serviceable city) if GPS fails or is denied.
    (async () => {
      const cities = await fetchActiveCities();
      if (cities.length === 0) return;
      try {
        const permission =
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
            : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
        let status = await check(permission);
        if (status === RESULTS.NOT_DETERMINED || status === RESULTS.DENIED) {
          status = await request(permission);
        }
        if (status === RESULTS.GRANTED) {
          const pos = await getPosition();
          const matched = findCityForLocation(pos.lat, pos.lng, cities);
          if (matched) {
            dispatch(setSelectedCity(matched));
            return;
          }
        }
      } catch {}
      const fallbackCity = cities.find((c: any) => c.name === 'Nellore') ?? cities[0] ?? null;
      if (fallbackCity) dispatch(setSelectedCity(fallbackCity));
    })();

    Promise.all([minWait, versionCheck]).then(([, version]) => {
      if (version.blocked) go('ForceUpdate', {updateUrl: version.updateUrl, message: version.message});
      else go(partnerDest);
    });

    return () => {
      done = true;
    };
  }, []);

  return (
    <LinearGradient
      colors={['#0E5843', '#022723']}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <Image
        source={require('../../assets/leaf_top_right.png')}
        style={styles.leafTopRight}
        resizeMode="contain"
      />
      <Image
        source={require('../../assets/leaf_bottom_left.png')}
        style={styles.leafBottomLeft}
        resizeMode="contain"
      />

      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/beyomo_logo_icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{'Professional Beauty\nServices At Home'}</Text>
        <View style={styles.separator} />
        <Text style={styles.subtitle}>
          {'Experience luxury salon services in the\ncomfort of your own home.'}
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  leafTopRight: {
    position: 'absolute',
    width: sw(287.53),
    height: sh(296.56),
    right: sw(-59.6),
    top: sh(11),
    opacity: 0.1,
  },
  leafBottomLeft: {
    position: 'absolute',
    width: sw(184),
    height: sh(190),
    left: sw(-46),
    top: sh(700),
    opacity: 0.1,
    transform: [{scaleY: -1}],
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: sw(240),
    height: sw(240),
  },
  textContainer: {
    position: 'absolute',
    width: sw(244),
    left: sw(74.5),
    top: sh(617),
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.title,
    fontSize: sw(24),
    fontWeight: '600',
    lineHeight: sw(30),
    textAlign: 'center',
    color: '#FEFEFE',
  },
  separator: {
    width: sw(38),
    height: 2,
    backgroundColor: '#C8A84C',
    marginVertical: sh(12),
  },
  subtitle: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    fontWeight: '400',
    lineHeight: sw(20),
    textAlign: 'center',
    color: '#FEFEFE',
  },
});

export default SplashScreen;
