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

const STATS = [
  {label: 'Happy Clients', value: '50K+'},
  {label: 'Expert Artists', value: '500+'},
  {label: 'Cities', value: '12'},
  {label: 'Services', value: '80+'},
];

const VALUES = [
  {icon: 'shield-checkmark-outline', title: 'Trust & Safety', desc: 'Every expert is verified, trained and background-checked.'},
  {icon: 'sparkles-outline', title: 'Premium Quality', desc: 'We use only salon-grade, dermatologist-approved products.'},
  {icon: 'home-outline', title: 'Doorstep Comfort', desc: 'Your favourite salon experience, delivered at home.'},
  {icon: 'leaf-outline', title: 'Eco-Conscious', desc: 'Committed to sustainable and eco-friendly beauty practices.'},
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
          <Text style={styles.brandName}>BEYOMO</Text>
          <Text style={styles.tagline}>SALON COMES HOME</Text>
          <Text style={styles.heroSub}>
            Bringing luxury beauty services to your doorstep — because you deserve the best, always.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(32)}]}>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map(stat => (
            <View key={stat.label} style={styles.statBox}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            At Beyomo, we believe beauty is a form of self-care that should be accessible, comfortable, and joyful. We connect you with skilled beauty professionals who bring the full salon experience — right to your home.
          </Text>
        </View>

        {/* Values */}
        <Text style={styles.sectionTitle}>Our Values</Text>
        <View style={styles.valuesGrid}>
          {VALUES.map(v => (
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
          <Text style={styles.versionText}>Beyomo v1.0.0</Text>
          <Text style={styles.versionSub}>© 2026 Beyomo Technologies Pvt Ltd</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F5F5'},

  hero: {paddingBottom: sw(28), paddingHorizontal: sw(16)},
  backBtn: {
    width: sw(36),
    height: sw(36),
    borderRadius: sw(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sw(12),
  },
  heroContent: {alignItems: 'center', gap: sw(6)},
  brandName: {fontFamily: fonts.title, fontSize: sw(32), fontWeight: '700', color: '#FFFFFF', letterSpacing: sw(4)},
  tagline: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#C8A84C', letterSpacing: sw(2)},
  heroSub: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: sw(20),
    marginTop: sw(6),
    paddingHorizontal: sw(8),
  },

  scroll: {paddingHorizontal: sw(16), paddingTop: sw(16), gap: sw(16)},

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(16),
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  statBox: {alignItems: 'center', flex: 1},
  statValue: {fontFamily: fonts.title, fontSize: sw(18), fontWeight: '700', color: '#105641'},
  statLabel: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#656565', textAlign: 'center', marginTop: sw(2)},

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(16),
    gap: sw(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
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

  versionCard: {alignItems: 'center', gap: sw(4), paddingTop: sw(8)},
  versionText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#A3A3A3'},
  versionSub: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#BBBBBB'},
});

export default AboutUsScreen;
