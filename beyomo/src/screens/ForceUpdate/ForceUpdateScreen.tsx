import React, {useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Linking, BackHandler} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {fonts} from '../../config/theme';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const DEFAULT_STORE_URL = 'https://play.google.com/store/apps/details?id=com.beyomo';

// Non-dismissible — reached only when the installed build is below the
// admin-configured minimum version. Android hardware back is disabled so the
// only way out is actually updating.
const ForceUpdateScreen = ({route}: {route?: any}) => {
  const updateUrl: string = route?.params?.updateUrl || DEFAULT_STORE_URL;
  const message: string | undefined = route?.params?.message;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <LinearGradient colors={['#0E5843', '#022723']} style={styles.container} start={{x: 0, y: 0}} end={{x: 0, y: 1}}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.iconCircle}>
        <Ionicons name="cloud-download-outline" size={sw(44)} color="#FDD77A" />
      </View>
      <Text style={styles.title}>Update Required</Text>
      <Text style={styles.subtitle}>
        {message || 'A new version of the app is available. Please update to continue using Beyomo.'}
      </Text>
      <TouchableOpacity style={styles.updateBtn} activeOpacity={0.85} onPress={() => Linking.openURL(updateUrl)}>
        <Text style={styles.updateBtnText}>Update Now</Text>
        <Ionicons name="arrow-forward" size={sw(16)} color="#012823" />
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: sw(32)},
  iconCircle: {
    width: sw(96),
    height: sw(96),
    borderRadius: sw(48),
    backgroundColor: 'rgba(253,215,122,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sw(24),
  },
  title: {
    fontFamily: fonts.title,
    fontSize: sw(22),
    fontWeight: '700',
    color: '#FEFEFE',
    marginBottom: sw(10),
  },
  subtitle: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: sw(20),
    marginBottom: sw(28),
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    backgroundColor: '#FDD77A',
    borderRadius: sw(14),
    paddingVertical: sw(14),
    paddingHorizontal: sw(32),
  },
  updateBtnText: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '800',
    color: '#012823',
  },
});

export default ForceUpdateScreen;
