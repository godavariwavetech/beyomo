import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Switch,
  RefreshControl,
  AppState,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {HomeScreenSkeleton} from '../../components/Skeleton/Skeleton';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import {fonts} from '../../config/theme';
import api from '../../utils/api';
import {endpoints} from '../../config/config';
import type {RootState} from '../../redux/store';
import {resolveImageUrl} from '../../utils/utils';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

// Same formatting the Profile and Earnings screens use, so one number never reads as two.
const fmtAmount = (n: any) =>
  (Number(n) || 0).toLocaleString('en-IN', {maximumFractionDigits: 2});

const STAT_CONFIG = [
  {id: 's1', label: 'Today Jobs', icon: 'people',    iconBg: '#E6F4EC', iconColor: '#2B8A4B', dataKey: 'todayJobs'},
  {id: 's2', label: 'Completed',  icon: 'checkmark-circle', iconBg: '#E8EEFF', iconColor: '#3D5AF1', dataKey: 'totalCompleted'},
  {id: 's3', label: 'Earnings',   icon: 'cash',      iconBg: '#F0EBFF', iconColor: '#7B3FE4', dataKey: 'todayEarnings'},
  {id: 's4', label: 'Rating',     icon: 'star',      iconBg: '#FFF3E4', iconColor: '#F07B1D', dataKey: 'ratingsAverage'},
];

const QUICK_LINKS = [
  {
    id: 'q1',
    title: 'New Booking',
    subtitle: 'See & accept available bookings',
    icon: 'calendar',
    iconBg: '#1B6B3A',
    cardBg: '#E9F5EE',
    arrowBg: '#1B6B3A',
    route: 'AvailableBookings',
  },
  {
    id: 'q2',
    title: 'My Jobs',
    subtitle: 'View upcoming, ongoing & completed',
    icon: 'person',
    iconBg: '#3D5AF1',
    cardBg: '#EEF0FF',
    arrowBg: '#3D5AF1',
    route: 'Jobs',
  },
  {
    id: 'q3',
    title: 'Earnings',
    subtitle: 'View earnings, incentives & history',
    icon: 'cash',
    iconBg: '#C87B1A',
    cardBg: '#FFF5E9',
    arrowBg: '#C87B1A',
    route: 'Earnings',
  },
  {
    id: 'q4',
    title: 'Support',
    subtitle: 'Help, support & emergency',
    icon: 'headset',
    iconBg: '#6B3FD4',
    cardBg: '#F0EBFF',
    arrowBg: '#6B3FD4',
    route: 'HelpSupport',
  },
];

const HomeScreen = ({navigation}: {navigation: any}) => {
  const insets = useSafeAreaInsets();
  const partner = useSelector((state: RootState) => state.Auth?.partner);
  const [isOnline, setIsOnline] = useState(true);
  const [ready, setReady] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [availableCount, setAvailableCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const refreshAll = async () => {
    await Promise.all([fetchDashboardData(), fetchAvailableCount()]);
  };

  useEffect(() => {
    refreshAll();
    const t = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Re-sync with the backend every time the screen comes into focus, and
  // periodically while it stays focused so counts/earnings stay live.
  useFocusEffect(
    React.useCallback(() => {
      refreshAll();
      let interval: ReturnType<typeof setInterval> | null = setInterval(refreshAll, 10000);

      const sub = AppState.addEventListener('change', state => {
        if (state === 'active') {
          if (!interval) {
            refreshAll();
            interval = setInterval(refreshAll, 10000);
          }
        } else if (interval) {
          clearInterval(interval);
          interval = null;
        }
      });

      return () => {
        if (interval) clearInterval(interval);
        sub.remove();
      };
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const fetchDashboardData = async () => {
    try {
      const response = await api.get(endpoints.PARTNER_DASHBOARD);
      setDashboardData(response.data?.data);
    } catch (error) {
      console.log('Failed to fetch dashboard data:', error);
    }
  };

  const fetchAvailableCount = async () => {
    try {
      const res = await api.get(endpoints.PARTNER_AVAILABLE_BOOKINGS);
      setAvailableCount((res.data?.data ?? []).length);
    } catch {}
  };

  if (!ready) {
    return (
      <View style={styles.root}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <HomeScreenSkeleton insetTop={insets.top} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FDD77A" />}
        contentContainerStyle={{paddingBottom: sw(28)}}>

        {/* ── Header ── */}
        <LinearGradient
          colors={['#145C40', '#022723']}
          style={[styles.header, {paddingTop: insets.top + sw(16)}]}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              {resolveImageUrl(partner?.profilePicture) ? (
                <Image
                  source={{uri: resolveImageUrl(partner?.profilePicture) as string}}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={sw(26)} color="rgba(255,255,255,0.85)" />
                </View>
              )}
            </View>
            <View style={styles.nameBlock}>
              <Text style={styles.helloText} numberOfLines={1} ellipsizeMode="tail">
                Hello, {partner?.name || 'Partner'}
              </Text>
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={sw(12)} color="#F5A623" />
                <Text style={styles.ratingText}>{dashboardData?.ratings?.average || 0} Rating</Text>
              </View>
            </View>
            <View style={styles.earningBlock}>
              <Text style={styles.earningLabel}>Total Earning</Text>
              <Text style={styles.earningValue}>₹{fmtAmount(dashboardData?.totalEarnings)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Online toggle card ── */}
        <View style={styles.onlineCard}>
          <View style={styles.onlineTextBlock}>
            <Text style={styles.onlineTitle}>
              {isOnline ? 'You are Online' : 'You are Offline'}
            </Text>
            <Text style={styles.onlineSubtitle}>
              {isOnline ? 'Ready to receive bookings' : 'Go online to receive bookings'}
            </Text>
          </View>
          <View style={styles.toggleWrap}>
            <Text style={[styles.toggleLabel, !isOnline && styles.toggleLabelOff]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{false: '#D0D0D0', true: '#1B6B3A'}}
              thumbColor="#FFFFFF"
              style={{transform: [{scaleX: 0.9}, {scaleY: 0.9}]}}
            />
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsCard}>
          {STAT_CONFIG.map((stat, idx) => {
            let value = '0';
            if (stat.dataKey === 'todayJobs') {
              value = String(dashboardData?.bookingStats?.todayJobs || 0);
            } else if (stat.dataKey === 'totalCompleted') {
              value = String(dashboardData?.bookingStats?.totalCompleted || 0);
            } else if (stat.dataKey === 'todayEarnings') {
              value = `₹${fmtAmount(dashboardData?.totalEarnings)}`;
            } else if (stat.dataKey === 'ratingsAverage') {
              value = String((dashboardData?.ratings?.average || 0).toFixed(1));
            }

            return (
              <React.Fragment key={stat.id}>
                <View style={styles.statItem}>
                  <View style={[styles.statIconCircle, {backgroundColor: stat.iconBg}]}>
                    <Ionicons name={stat.icon as any} size={sw(20)} color={stat.iconColor} />
                  </View>
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                {idx < STAT_CONFIG.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* ── Quick Links ── */}
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.quickGrid}>
          {/* Row 1 */}
          <View style={styles.quickRow}>
            {QUICK_LINKS.slice(0, 2).map(link => (
              <TouchableOpacity
                key={link.id}
                style={[styles.quickCard, {backgroundColor: link.cardBg}]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate(link.route)}>
                <View style={styles.quickIconRow}>
                  <View style={[styles.quickIconCircle, {backgroundColor: link.iconBg}]}>
                    <Ionicons name={link.icon as any} size={sw(22)} color="#FFFFFF" />
                  </View>
                  {link.id === 'q1' && availableCount > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{availableCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.quickTitle}>{link.title}</Text>
                <Text style={styles.quickSubtitle}>{link.subtitle}</Text>
                <View style={[styles.quickArrow, {backgroundColor: link.arrowBg}]}>
                  <Ionicons name="arrow-forward" size={sw(14)} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {/* Row 2 */}
          <View style={styles.quickRow}>
            {QUICK_LINKS.slice(2, 4).map(link => (
              <TouchableOpacity
                key={link.id}
                style={[styles.quickCard, {backgroundColor: link.cardBg}]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate(link.route)}>
                <View style={[styles.quickIconCircle, {backgroundColor: link.iconBg}]}>
                  <Ionicons name={link.icon as any} size={sw(22)} color="#FFFFFF" />
                </View>
                <Text style={styles.quickTitle}>{link.title}</Text>
                <Text style={styles.quickSubtitle}>{link.subtitle}</Text>
                <View style={[styles.quickArrow, {backgroundColor: link.arrowBg}]}>
                  <Ionicons name="arrow-forward" size={sw(14)} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F4F6F8'},

  header: {
    paddingHorizontal: sw(16),
    paddingBottom: sw(40),
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sw(12),
  },
  avatarWrap: {
    width: sw(58),
    height: sw(58),
    borderRadius: sw(29),
    borderWidth: 2.5,
    borderColor: '#FDD77A',
    overflow: 'hidden',
  },
  avatar: {width: '100%', height: '100%'},
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBlock: {flex: 1, gap: sw(3)},
  helloText: {
    fontFamily: fonts.title,
    fontSize: sw(18),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: sw(24),
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: sw(20),
    paddingHorizontal: sw(10),
    paddingVertical: sw(3),
    marginTop: sw(4),
  },
  ratingText: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  earningBlock: {alignItems: 'flex-end', gap: sw(2)},
  earningLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: 'rgba(255,255,255,0.7)',
  },
  earningValue: {
    fontFamily: fonts.title,
    fontSize: sw(22),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Online card */
  onlineCard: {
    marginHorizontal: sw(16),
    marginTop: -sw(22),
    backgroundColor: '#FFFFFF',
    borderRadius: sw(16),
    paddingHorizontal: sw(16),
    paddingVertical: sw(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  onlineTextBlock: {gap: sw(3)},
  onlineTitle: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#171816',
  },
  onlineSubtitle: {
    fontFamily: fonts.textFont,
    fontSize: sw(12),
    color: '#888888',
  },
  toggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
  },
  toggleLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(13),
    fontWeight: '600',
    color: '#1B6B3A',
  },
  toggleLabelOff: {color: '#888888'},

  /* Stats */
  statsCard: {
    marginHorizontal: sw(16),
    marginTop: sw(14),
    backgroundColor: '#FFFFFF',
    borderRadius: sw(16),
    paddingVertical: sw(16),
    paddingHorizontal: sw(8),
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: sw(6),
  },
  statIconCircle: {
    width: sw(46),
    height: sw(46),
    borderRadius: sw(23),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#171816',
  },
  statLabel: {
    fontFamily: fonts.textFont,
    fontSize: sw(10),
    color: '#888888',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: sw(50),
    backgroundColor: '#EBEBEB',
  },

  /* Quick Links */
  sectionTitle: {
    fontFamily: fonts.title,
    fontSize: sw(16),
    fontWeight: '700',
    color: '#171816',
    marginHorizontal: sw(16),
    marginTop: sw(22),
    marginBottom: sw(12),
  },
  quickGrid: {
    marginHorizontal: sw(16),
    gap: sw(12),
  },
  quickRow: {
    flexDirection: 'row',
    gap: sw(12),
  },
  quickCard: {
    flex: 1,
    borderRadius: sw(16),
    padding: sw(14),
    minHeight: sw(148),
  },
  quickIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: sw(8),
  },
  quickIconCircle: {
    width: sw(48),
    height: sw(48),
    borderRadius: sw(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    backgroundColor: '#DB1919',
    borderRadius: sw(10),
    minWidth: sw(20),
    height: sw(20),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sw(5),
    marginLeft: -sw(10),
    marginTop: -sw(4),
  },
  countBadgeText: {
    fontFamily: fonts.title,
    fontSize: sw(10),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickTitle: {
    fontFamily: fonts.title,
    fontSize: sw(15),
    fontWeight: '700',
    color: '#171816',
    marginBottom: sw(4),
  },
  quickSubtitle: {
    fontFamily: fonts.textFont,
    fontSize: sw(11),
    color: '#555555',
    lineHeight: sw(16),
    flex: 1,
  },
  quickArrow: {
    width: sw(30),
    height: sw(30),
    borderRadius: sw(15),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginTop: sw(8),
  },
});

export default HomeScreen;
