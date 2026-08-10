import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Share,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const STEPS = [
  {icon: 'share-social-outline', step: '1', title: 'Share your code', desc: 'Share your unique referral code with friends & family.'},
  {icon: 'person-add-outline', step: '2', title: 'They sign up', desc: 'Your friend signs up on Beyomo using your referral code.'},
  {icon: 'wallet-outline', step: '3', title: 'Both earn ₹200', desc: 'You both get ₹200 Beyomo credits on their first booking.'},
];

const ReferEarnScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [referralCode, setReferralCode] = useState('');
  const [credits, setCredits] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(endpoints.REFERRAL)
      .then(res => {
        const data = res.data?.data ?? res.data;
        setReferralCode(data?.referralCode ?? data?.code ?? '');
        setCredits(data?.walletCredits ?? data?.credits ?? 0);
        setFriendsCount(data?.referralCount ?? data?.friendsCount ?? data?.totalReferrals ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shareCode = async () => {
    if (!referralCode) return;
    try {
      await Share.share({
        message: `Get salon services at home with Beyomo! Use my referral code ${referralCode} and get ₹200 off on your first booking. Download now!`,
      });
    } catch {}
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#012823" />

      <LinearGradient colors={['#0E5843', '#022723']} style={[styles.heroBanner, {paddingTop: insets.top + sw(14)}]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={sw(22)} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.heroContent}>
          <View style={styles.giftIconWrap}>
            <Ionicons name="gift" size={sw(40)} color="#FDD77A" />
          </View>
          <Text style={styles.heroTitle}>Refer & Earn</Text>
          <Text style={styles.heroSub}>Share the love, earn ₹200 for every friend who joins!</Text>

          {loading ? (
            <ActivityIndicator color="#FDD77A" style={{marginTop: sw(12)}} />
          ) : (
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Your Referral Code</Text>
              <Text style={styles.code}>{referralCode || '—'}</Text>
            </View>
          )}

          <View style={styles.creditsRow}>
            <View style={styles.creditPill}>
              <Ionicons name="wallet-outline" size={sw(14)} color="#FDD77A" />
              <Text style={styles.creditText}>Your Credits: ₹{credits}</Text>
            </View>
            <View style={styles.creditPill}>
              <Ionicons name="people-outline" size={sw(14)} color="#FDD77A" />
              <Text style={styles.creditText}>Friends Joined: {friendsCount}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(100)}]}>

        <Text style={styles.sectionLabel}>How it works</Text>

        {STEPS.map(s => (
          <View key={s.step} style={styles.stepCard}>
            <View style={styles.stepNumWrap}>
              <Text style={styles.stepNum}>{s.step}</Text>
            </View>
            <View style={styles.stepIconWrap}>
              <Ionicons name={s.icon as any} size={sw(22)} color="#105641" />
            </View>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}

        <View style={styles.termsCard}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          <Text style={styles.termsText}>• Credits are valid for 90 days from the date of earning.</Text>
          <Text style={styles.termsText}>• Minimum booking value of ₹999 required to redeem.</Text>
          <Text style={styles.termsText}>• Beyomo reserves the right to modify the referral program.</Text>
        </View>
      </ScrollView>

      <View style={[styles.shareWrap, {paddingBottom: insets.bottom + sw(16)}]}>
        <TouchableOpacity
          style={[styles.shareBtn, (!referralCode || loading) && {opacity: 0.6}]}
          activeOpacity={0.85}
          onPress={shareCode}
          disabled={!referralCode || loading}>
          <Ionicons name="share-social-outline" size={sw(20)} color="#012823" />
          <Text style={styles.shareBtnText}>Share Referral Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F5F5'},

  heroBanner: {paddingBottom: sw(24), paddingHorizontal: sw(16)},
  backBtn: {
    width: sw(36),
    height: sw(36),
    borderRadius: sw(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sw(8),
  },
  heroContent: {alignItems: 'center', gap: sw(10)},
  giftIconWrap: {
    width: sw(80),
    height: sw(80),
    borderRadius: sw(40),
    backgroundColor: 'rgba(253,215,122,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sw(4),
  },
  heroTitle: {fontFamily: fonts.title, fontSize: sw(24), fontWeight: '700', color: '#FFFFFF'},
  heroSub: {fontFamily: fonts.textFont, fontSize: sw(13), color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: sw(20)},
  codeBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: sw(12),
    borderWidth: 1.5,
    borderColor: '#FDD77A',
    paddingHorizontal: sw(32),
    paddingVertical: sw(10),
    alignItems: 'center',
    gap: sw(4),
    marginTop: sw(4),
  },
  codeLabel: {fontFamily: fonts.textFont, fontSize: sw(13), color: 'rgba(255,255,255,0.65)'},
  code: {fontFamily: fonts.title, fontSize: sw(26), fontWeight: '700', color: '#FDD77A', letterSpacing: 3},
  creditsRow: {flexDirection: 'row', gap: sw(10), marginTop: sw(4)},
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: sw(20),
    paddingHorizontal: sw(12),
    paddingVertical: sw(5),
  },
  creditText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#FFFFFF'},

  scroll: {paddingHorizontal: sw(16), paddingTop: sw(16), gap: sw(12)},
  sectionLabel: {fontFamily: fonts.textFont, fontSize: sw(14), fontWeight: '700', color: '#171816'},

  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(14),
    gap: sw(12),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  stepNumWrap: {
    width: sw(24),
    height: sw(24),
    borderRadius: sw(12),
    backgroundColor: '#EAF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {fontFamily: fonts.title, fontSize: sw(13), fontWeight: '700', color: '#105641'},
  stepIconWrap: {
    width: sw(44),
    height: sw(44),
    borderRadius: sw(22),
    backgroundColor: '#EAF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {flex: 1, gap: sw(3)},
  stepTitle: {fontFamily: fonts.textFont, fontSize: sw(13), fontWeight: '700', color: '#171816'},
  stepDesc: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#656565', lineHeight: sw(18)},

  termsCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: sw(10),
    padding: sw(14),
    gap: sw(5),
  },
  termsTitle: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '700', color: '#C49738', marginBottom: sw(4)},
  termsText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#656565', lineHeight: sw(19)},

  shareWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: sw(16),
    paddingTop: sw(12),
    backgroundColor: '#F5F5F5',
  },
  shareBtn: {
    backgroundColor: '#FDD77A',
    borderRadius: sw(10),
    height: sw(50),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(10),
  },
  shareBtnText: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700', color: '#012823'},
});

export default ReferEarnScreen;
