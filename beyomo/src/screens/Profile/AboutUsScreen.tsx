import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

// Wordmark is rendered from its true aspect ratio (512 x 183) rather than a square box.
const LOGO_W = sw(180);

// Copy mirrors the About Us page on beyomo.com so the app and the website tell the same
// story. The previous stats block (50K+ clients / 500+ artists / 12 cities) was invented
// and contradicted the site, which states Beyomo is launching in 2026 across Andhra Pradesh.
const WHO_WE_ARE = {
  eyebrow: 'Who We Are',
  title: 'A salon that comes to your door',
  paragraphs: [
    "Beyomo stands for Beauty at Your Moment because great beauty experiences shouldn't wait for an appointment slot at a crowded salon. Launching in 2026 across Andhra Pradesh, Beyomo is a home salon platform that brings vetted, trained professionals to your doorstep, with premium products and the kind of care you'd expect from the best salon in town.",
    'We serve both men and women, covering everything from everyday grooming to bridal and groom makeup and go further with specialist aesthetic treatments delivered safely at home by certified professionals.',
  ],
};

const PROMISE = [
  {icon: 'home-outline', title: 'Doorstep Convenience', desc: 'A full salon experience without stepping out of your home.'},
  {icon: 'sparkles-outline', title: 'Premium Quality', desc: 'Top-grade products and highly skilled professionals on every visit.'},
  {icon: 'shield-checkmark-outline', title: 'Vetted Professionals', desc: 'Background-checked, trained, and trusted to be in your home.'},
  {icon: 'time-outline', title: 'Your Schedule', desc: 'Book at a time that works for you, not us.'},
];

const AboutUsScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#012823" />

      <LinearGradient colors={['#0E5843', '#022723']} style={[styles.hero, {paddingTop: insets.top + sw(14)}]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={sw(22)} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <Image
            source={require('../../assets/beyomo_logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Beyomo"
          />
          <Text style={styles.heroSub}>Beauty at Your Moment</Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(32)}]}>

        {/* Who We Are */}
        <View style={styles.section}>
          <Text style={styles.eyebrow}>{WHO_WE_ARE.eyebrow}</Text>
          <Text style={styles.sectionTitle}>{WHO_WE_ARE.title}</Text>
          {WHO_WE_ARE.paragraphs.map((para, i) => (
            <Text key={i} style={styles.sectionText}>
              {para}
            </Text>
          ))}
        </View>

        {/* Our Promise */}
        <View style={styles.promiseHeader}>
          <Text style={styles.eyebrow}>Our Promise</Text>
          <Text style={styles.sectionTitle}>What you can always expect</Text>
        </View>
        <View style={styles.valuesGrid}>
          {PROMISE.map(v => (
            <View key={v.title} style={styles.valueCard}>
              <View style={styles.valueIcon}>
                <Ionicons name={v.icon as any} size={sw(22)} color="#105641" />
              </View>
              <Text style={styles.valueTitle}>{v.title}</Text>
              <Text style={styles.valueDesc}>{v.desc}</Text>
            </View>
          ))}
        </View>

        {/* Version info */}
        <View style={styles.versionCard}>
          <Text style={styles.versionText}>Beyomo v1.0.1</Text>
          <Text style={styles.versionSub}>Copyright © 2026 Beyomo — Beauty & Wellness at Home.</Text>
          <Text style={styles.versionSub}>All Rights Reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F5F5'},

  hero: {paddingBottom: sw(18), paddingHorizontal: sw(16)},
  backBtn: {
    width: sw(36),
    height: sw(36),
    borderRadius: sw(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sw(6),
  },
  heroContent: {alignItems: 'center', gap: sw(8)},
  logo: {width: LOGO_W, height: LOGO_W * (183 / 512)},
  heroSub: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: sw(20),
    paddingHorizontal: sw(8),
  },

  scroll: {paddingHorizontal: sw(16), paddingTop: sw(14), gap: sw(12)},

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(14),
    gap: sw(6),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  eyebrow: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#105641',
    letterSpacing: sw(1.5),
    textTransform: 'uppercase',
  },
  promiseHeader: {gap: sw(4)},
  sectionTitle: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700', color: '#171816'},
  sectionText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#5C5C5C', lineHeight: sw(21)},

  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sw(10),
  },
  valueCard: {
    width: (width - sw(32) - sw(10)) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(14),
    gap: sw(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  valueIcon: {
    width: sw(44),
    height: sw(44),
    borderRadius: sw(22),
    backgroundColor: '#EAF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueTitle: {fontFamily: fonts.textFont, fontSize: sw(13), fontWeight: '700', color: '#171816'},
  valueDesc: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#656565', lineHeight: sw(19)},

  versionCard: {alignItems: 'center', gap: sw(2), paddingTop: sw(4)},
  versionText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#A3A3A3'},
  versionSub: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#BBBBBB'},
});

export default AboutUsScreen;
