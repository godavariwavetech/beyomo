import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import {refreshPartnerStatus, actionLogout} from '../../redux/reducers/auth';
import type {AppDispatch, RootState} from '../../redux/store';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

type StatusConfig = {
  icon: string;
  iconColor: string;
  gradientColors: [string, string];
  title: string;
  subtitle: string;
  message: string;
  badgeColor: string;
  badgeLabel: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    icon: 'time-outline',
    iconColor: '#FDD77A',
    gradientColors: ['#0E5843', '#022723'],
    title: 'Application Under Review',
    subtitle: 'Sit tight — our team is reviewing your profile',
    message:
      'We typically review applications within 24–48 hours. You will receive a notification once your account is approved.',
    badgeColor: '#F59E0B',
    badgeLabel: 'Pending Review',
  },
  rejected: {
    icon: 'close-circle-outline',
    iconColor: '#EF4444',
    gradientColors: ['#1a0a0a', '#0a0404'],
    title: 'Application Not Approved',
    subtitle: 'We were unable to approve your partner account',
    message:
      'Your application did not meet our current requirements. Please contact our support team to understand the reason and how to reapply.',
    badgeColor: '#EF4444',
    badgeLabel: 'Not Approved',
  },
  approved: {
    icon: 'checkmark-circle-outline',
    iconColor: '#22C55E',
    gradientColors: ['#0a1f14', '#022723'],
    title: "You're Approved!",
    subtitle: "Welcome to the Beyomo partner family",
    message:
      'Your account is active and ready. You can now accept bookings, manage your schedule, and start earning.',
    badgeColor: '#22C55E',
    badgeLabel: 'Approved',
  },
};

const AccountStatusScreen = ({navigation}: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const partner = useSelector((state: RootState) => state.Auth.partner);
  const [refreshing, setRefreshing] = useState(false);

  const status = (partner?.status as string) ?? 'pending';
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const result = await dispatch(refreshPartnerStatus());
    setRefreshing(false);
    if (refreshPartnerStatus.fulfilled.match(result)) {
      const updated = result.payload;
      if (updated?.status === 'approved') {
        navigation.replace('Main');
      }
    }
  }, [dispatch, navigation]);

  const handleLogout = useCallback(() => {
    dispatch(actionLogout());
    navigation.replace('Login');
  }, [dispatch, navigation]);

  return (
    <LinearGradient
      colors={config.gradientColors}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <View style={styles.content}>

        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.appName}>BEYOMO</Text>
          <View style={styles.taglineRow}>
            <View style={styles.taglineLine} />
            <Text style={styles.tagline}>SALON COMES HOME</Text>
            <View style={styles.taglineLine} />
          </View>
        </View>

        {/* Status card */}
        <View style={styles.card}>

          {/* Icon circle */}
          <View style={[styles.iconCircle, {borderColor: config.iconColor + '40', backgroundColor: config.iconColor + '18'}]}>
            <Ionicons name={config.icon} size={sw(52)} color={config.iconColor} />
          </View>

          {/* Badge */}
          <View style={[styles.badge, {backgroundColor: config.badgeColor + '22', borderColor: config.badgeColor + '55'}]}>
            <View style={[styles.badgeDot, {backgroundColor: config.badgeColor}]} />
            <Text style={[styles.badgeText, {color: config.badgeColor}]}>{config.badgeLabel}</Text>
          </View>

          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>

          <View style={styles.divider} />

          <Text style={styles.message}>{config.message}</Text>

          {/* Partner info */}
          {partner?.name && (
            <View style={styles.partnerRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{(partner.name as string)[0]?.toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.partnerName}>{partner.name as string}</Text>
                {partner.phone && (
                  <Text style={styles.partnerPhone}>+91 {partner.phone as string}</Text>
                )}
              </View>
            </View>
          )}

          {/* Action buttons */}
          {status === 'approved' ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={() => navigation.replace('Main')}>
              <LinearGradient
                colors={['#E4BA69', '#FDD77A', '#E3BB67']}
                style={styles.btnGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                <Text style={styles.primaryBtnText}>Start Working</Text>
                <Ionicons name="arrow-forward" size={sw(16)} color="#1a1a1a" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.refreshBtn, refreshing && styles.refreshBtnDisabled]}
              activeOpacity={0.75}
              onPress={handleRefresh}
              disabled={refreshing}>
              {refreshing ? (
                <ActivityIndicator color="#FDD77A" size="small" />
              ) : (
                <Ionicons name="refresh-outline" size={sw(18)} color="#FDD77A" />
              )}
              <Text style={styles.refreshBtnText}>
                {refreshing ? 'Checking…' : 'Refresh Status'}
              </Text>
            </TouchableOpacity>
          )}

          {status === 'rejected' && (
            <TouchableOpacity style={styles.supportBtn} activeOpacity={0.7}>
              <Ionicons name="chatbubble-ellipses-outline" size={sw(16)} color="rgba(255,255,255,0.6)" />
              <Text style={styles.supportBtnText}>Contact Support</Text>
            </TouchableOpacity>
          )}

          {status === 'pending' && (
            <Text style={styles.noteText}>
              Check back later or wait for an email notification.
            </Text>
          )}
        </View>

        {/* Logout link */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={sw(15)} color="rgba(255,255,255,0.35)" />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {
    flex: 1,
    paddingHorizontal: sw(24),
    paddingTop: sw(64),
    paddingBottom: sw(32),
    justifyContent: 'center',
  },

  logoArea: {alignItems: 'center', marginBottom: sw(32)},
  appName: {
    fontFamily: fonts.title,
    fontSize: sw(32),
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
  taglineLine: {height: 1, width: sw(20), backgroundColor: '#C8A84C'},
  tagline: {
    fontFamily: fonts.textFont,
    fontSize: sw(10),
    color: '#C8A84C',
    letterSpacing: sw(2),
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: sw(24),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: sw(28),
    alignItems: 'center',
    gap: sw(16),
  },

  iconCircle: {
    width: sw(100),
    height: sw(100),
    borderRadius: sw(50),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sw(4),
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    paddingHorizontal: sw(14),
    paddingVertical: sw(5),
    borderRadius: sw(20),
    borderWidth: 1,
  },
  badgeDot: {width: sw(7), height: sw(7), borderRadius: sw(4)},
  badgeText: {fontFamily: fonts.title, fontSize: sw(12), fontWeight: '700', letterSpacing: 0.3},

  title: {
    fontFamily: fonts.title,
    fontSize: sw(22),
    fontWeight: '700',
    color: '#FEFEFE',
    textAlign: 'center',
    marginTop: -sw(4),
  },
  subtitle: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: -sw(8),
  },

  divider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: sw(4),
  },

  message: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: sw(20),
  },

  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(12),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: sw(12),
    padding: sw(12),
    alignSelf: 'stretch',
  },
  avatarCircle: {
    width: sw(40),
    height: sw(40),
    borderRadius: sw(20),
    backgroundColor: '#0E5843',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(253,215,122,0.4)',
  },
  avatarText: {fontFamily: fonts.title, fontSize: sw(16), color: '#FDD77A', fontWeight: '700'},
  partnerName: {fontFamily: fonts.title, fontSize: sw(14), color: '#FEFEFE', fontWeight: '700'},
  partnerPhone: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.5)', marginTop: sw(2)},

  primaryBtn: {width: '100%', borderRadius: sw(12), overflow: 'hidden'},
  btnGradient: {
    height: sw(52),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: sw(8),
  },
  primaryBtnText: {fontFamily: fonts.title, fontSize: sw(15), fontWeight: '700', color: '#1a1a1a'},

  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
    paddingVertical: sw(14),
    paddingHorizontal: sw(28),
    borderRadius: sw(12),
    borderWidth: 1.5,
    borderColor: 'rgba(253,215,122,0.4)',
    backgroundColor: 'rgba(253,215,122,0.06)',
  },
  refreshBtnDisabled: {opacity: 0.6},
  refreshBtnText: {fontFamily: fonts.textFont, fontSize: sw(14), color: '#FDD77A', fontWeight: '600'},

  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    paddingVertical: sw(6),
  },
  supportBtnText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'underline',
  },

  noteText: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: -sw(8),
  },

  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
    justifyContent: 'center',
    marginTop: sw(24),
  },
  logoutText: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    color: 'rgba(255,255,255,0.35)',
  },
});

export default AccountStatusScreen;
