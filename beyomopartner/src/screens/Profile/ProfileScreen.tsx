import React, {useCallback} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {fonts} from '../../config/theme';
import {useDispatch, useSelector} from 'react-redux';
import {fetchPartnerProfile, fetchPartnerDashboard} from '../../redux/reducers/partner';
import {logoutPartner, actionLogout} from '../../redux/reducers/auth';
import {resolveImageUrl, formatAmount} from '../../utils/utils';
import {useAppAlert} from '../../hooks/useAppAlert';
import AppAlertModal from '../../components/AppAlertModal/AppAlertModal';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const MENU_ITEMS: {id: string; label: string; icon: string; route: string; params?: Record<string, any>}[] = [
  {id: 'reviews', label: 'My Reviews', icon: 'star-outline', route: 'MyReviews'},
  {id: 'city', label: 'Change City', icon: 'location-outline', route: 'CitySelector', params: {goBack: true}},
  {id: 'help', label: 'Help & Support', icon: 'chatbubble-ellipses-outline', route: 'HelpSupport'},
  {id: 'about', label: 'About Us', icon: 'information-circle-outline', route: 'AboutUs'},
];

const ProfileScreen = ({navigation}: {navigation: any}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const profile = useSelector((s: any) => s.Partner?.profile);
  const dashboard = useSelector((s: any) => s.Partner?.dashboard);
  const {alertConfig, showAlert, hideAlert} = useAppAlert();

  // Refetch every time this screen is focused so a rating/earnings change (e.g. a new
  // review submitted by a customer) shows up instead of a stale value from the first load.
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchPartnerProfile());
      dispatch(fetchPartnerDashboard());
    }, [dispatch]),
  );

  const handleLogout = () => {
    showAlert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await dispatch(logoutPartner(undefined));
          dispatch(actionLogout());
          navigation.navigate('Login');
        },
      },
    ]);
  };

  const displayName = profile?.name ?? profile?.fullName ?? '';
  const displayRole = profile?.specialty ?? profile?.role ?? profile?.expertise ?? 'Beauty Expert';
  const displayPhone = profile?.phone ?? profile?.phoneNumber ?? '';
  const displayEmail = profile?.email ?? '';
  const displayLocation = profile?.city ? `${profile.city}${profile.state ? ', ' + profile.state : ''}` : (profile?.address?.city ?? profile?.location ?? '');
  const displayExperience = profile?.experience ? `${profile.experience} years experience` : '';
  const displayAvatar = resolveImageUrl(profile?.profilePicture ?? profile?.avatar ?? profile?.photo ?? profile?.profilePic) ?? '';
  const jobsDone = dashboard?.bookingStats?.totalCompleted ?? 0;
  // Prefer the dashboard's live figure. `profile.totalEarnings` is the raw partners-table
  // column, which only the settlement ledger ever increments and which defaults to 0 — so it
  // is never null, the ?? never fell through, and this stat disagreed with Home and Earnings.
  const earned = dashboard?.totalEarnings ?? profile?.totalEarnings ?? 0;
  const rating = profile?.ratingsAverage ?? dashboard?.ratings?.average;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#022723" />

      <LinearGradient
        colors={['#0E5843', '#022723']}
        style={[styles.header, {paddingTop: insets.top + sw(12)}]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={sw(22)} color="#FDD77A" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatarWrap}>
            {displayAvatar ? (
              <Image source={{uri: displayAvatar}} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{displayName?.[0] ?? '?'}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editBadge}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="camera" size={sw(12)} color="#FEFEFE" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            {!!displayName && <Text style={styles.partnerName}>{displayName}</Text>}
            {!!displayRole && <Text style={styles.partnerRole}>{displayRole}</Text>}
            {!!displayPhone && (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={sw(13)} color="rgba(255,255,255,0.7)" />
                <Text style={styles.contactText}>{displayPhone}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{jobsDone}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>
              ₹{formatAmount(earned)}
            </Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={sw(13)} color="#FDD77A" />
              <Text style={styles.statVal}>{rating != null ? Number(rating).toFixed(1) : '—'}</Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(24)}]}>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>Personal Information</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="pencil-outline" size={sw(16)} color="#105641" />
            </TouchableOpacity>
          </View>
          {!!displayEmail && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={sw(16)} color="#5C5C5C" />
              <Text style={styles.infoText}>{displayEmail}</Text>
            </View>
          )}
          {!!displayLocation && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={sw(16)} color="#5C5C5C" />
              <Text style={styles.infoText}>{displayLocation}</Text>
            </View>
          )}
          {!!displayExperience && (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={sw(16)} color="#5C5C5C" />
              <Text style={styles.infoText}>{displayExperience}</Text>
            </View>
          )}
        </View>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, idx) => {
            const isLast = idx === MENU_ITEMS.length - 1;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuRow, !isLast && styles.menuRowBorder]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(item.route, item.params)}>
                <View style={styles.menuLeft}>
                  <View style={styles.menuIconWrap}>
                    <Ionicons name={item.icon as any} size={sw(18)} color="#012823" />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={sw(16)} color="#AAAAAA" />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={sw(18)} color="#DB1919" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAccountBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('DeleteAccount')}>
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>

      </ScrollView>

      <AppAlertModal config={alertConfig} onRequestClose={hideAlert} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F5F5F5'},

  header: {paddingHorizontal: sw(16), paddingBottom: sw(20)},
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sw(20),
  },
  headerTitle: {fontFamily: fonts.title, fontSize: sw(20), fontWeight: '700', color: '#FFFFFF'},

  profileRow: {flexDirection: 'row', alignItems: 'center', gap: sw(16), marginBottom: sw(20)},
  avatarWrap: {width: sw(76), height: sw(76), borderRadius: sw(38), borderWidth: 2.5, borderColor: '#FDD77A'},
  avatar: {width: '100%', height: '100%', borderRadius: sw(38)},
  avatarFallback: {backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center'},
  avatarInitial: {fontFamily: fonts.title, fontSize: sw(28), fontWeight: '700', color: '#FFFFFF'},
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: sw(24),
    height: sw(24),
    borderRadius: sw(12),
    backgroundColor: '#105641',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profileInfo: {flex: 1, gap: sw(4)},
  partnerName: {fontFamily: fonts.title, fontSize: sw(18), fontWeight: '700', color: '#FFFFFF', lineHeight: sw(23)},
  partnerRole: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#FDD77A', fontWeight: '500'},
  contactRow: {flexDirection: 'row', alignItems: 'center', gap: sw(5)},
  contactText: {fontFamily: fonts.textFont, fontSize: sw(12), color: 'rgba(255,255,255,0.7)'},

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: sw(12),
    paddingVertical: sw(12),
  },
  statItem: {flex: 1, alignItems: 'center', gap: sw(3)},
  statDivider: {width: 1, height: sw(28), backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center'},
  ratingRow: {flexDirection: 'row', alignItems: 'center', gap: sw(3)},
  statVal: {fontFamily: fonts.title, fontSize: sw(16), fontWeight: '700', color: '#FFFFFF'},
  statLabel: {fontFamily: fonts.textFont, fontSize: sw(10), color: 'rgba(255,255,255,0.65)'},

  scroll: {paddingHorizontal: sw(16), paddingTop: sw(16), gap: sw(14)},

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    padding: sw(16),
    gap: sw(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  cardHeaderRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  cardLabel: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#171816'},
  infoRow: {flexDirection: 'row', alignItems: 'center', gap: sw(10)},
  infoText: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#444', flex: 1},

  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: sw(12),
    paddingHorizontal: sw(14),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  menuRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: sw(14)},
  menuRowBorder: {borderBottomWidth: 1, borderBottomColor: '#F0F0F0'},
  menuLeft: {flexDirection: 'row', alignItems: 'center', gap: sw(12)},
  menuIconWrap: {
    width: sw(34),
    height: sw(34),
    borderRadius: sw(17),
    backgroundColor: 'rgba(1,40,35,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {fontFamily: fonts.textFont, fontSize: sw(13), color: '#171816', fontWeight: '500'},

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(10),
    borderWidth: 1.5,
    borderColor: '#DB1919',
    borderRadius: sw(10),
    paddingVertical: sw(12),
    backgroundColor: '#FFFFFF',
  },
  logoutText: {fontFamily: fonts.title, fontSize: sw(14), fontWeight: '700', color: '#DB1919'},

  deleteAccountBtn: {alignItems: 'center', paddingVertical: sw(8)},
  deleteAccountText: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '500', color: '#999999', textDecorationLine: 'underline'},
});

export default ProfileScreen;
