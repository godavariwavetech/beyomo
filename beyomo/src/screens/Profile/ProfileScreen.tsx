import React, {useEffect} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';
import {useDispatch, useSelector} from 'react-redux';
import {fetchProfile} from '../../redux/reducers/user';
import {fetchUserBookings} from '../../redux/reducers/bookings';
import {logoutUser, actionLogout} from '../../redux/reducers/auth';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const MENU_ITEMS = [
  {id: 'addresses',  label: 'My Addresses',    icon: 'location-outline',              route: 'MyAddresses'},
  // {id: 'coupons',    label: 'Coupons & Offers', icon: 'pricetag-outline',             route: 'Coupons'}, // hidden for now — screen/route stay intact, just not linked.
  // {id: 'refer',      label: 'Refer & Earn',     icon: 'people-outline',               route: 'ReferEarn'}, // hidden for now — screen/route stay intact, just not linked.
  {id: 'reviews',    label: 'My Reviews',       icon: 'star-outline',                 route: 'MyReviews'},
  {id: 'help',       label: 'Help & Support',   icon: 'chatbubble-ellipses-outline',  route: 'HelpSupport'},
  {id: 'about',      label: 'About Us',         icon: 'information-circle-outline',   route: 'AboutUs'},
];

interface Props {
  navigation?: any;
}

const ProfileScreen = ({navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const profile = useSelector((s: any) => s.User?.profile);
  const bookings: any[] = useSelector((s: any) => s.Bookings?.list ?? []);

  useEffect(() => {
    if (!profile) dispatch(fetchProfile());
    if (bookings.length === 0) dispatch(fetchUserBookings());
  }, []);

  const upcomingCount = bookings.filter(
    (b: any) => b.status === 'confirmed' || b.status === 'pending' || b.status === 'in_progress',
  ).length;
  const completedCount = bookings.filter((b: any) => b.status === 'completed').length;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await dispatch(logoutUser(undefined));
          dispatch(actionLogout());
          navigation?.navigate('Login');
        },
      },
    ]);
  };

  const displayName = profile?.name ?? profile?.fullName ?? '';
  const displayPhone = profile?.phone ?? profile?.phoneNumber ?? '';
  const displayEmail = profile?.email ?? '';
  const displayAvatar = profile?.avatar ?? profile?.photo ?? profile?.profilePic ?? '';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEDED" />

      <View style={[styles.header, {paddingTop: insets.top + sw(14)}]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(24)} color="#000000" />
        </TouchableOpacity>

        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.titleUnderline} />
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation?.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={sw(20)} color="#5C5C5C" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => Alert.alert('Settings', 'App settings coming soon!')}>
            <Ionicons name="settings-outline" size={sw(20)} color="#5C5C5C" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(24)}]}>

        <Text style={styles.subtitle}>Manage your account and preferences</Text>

        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.85}
          onPress={() => navigation?.navigate('EditProfile')}>
          <View style={styles.profileLeft}>
            <View style={styles.avatarWrap}>
              {displayAvatar ? (
                <Image source={{uri: displayAvatar}} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{displayName?.[0] ?? '?'}</Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={sw(12)} color="#FEFEFE" />
              </View>
            </View>

            <View style={styles.profileInfo}>
              {!!displayName && <Text style={styles.profileName}>{displayName}</Text>}
              {!!displayPhone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={sw(14)} color="#292D32" />
                  <Text style={styles.infoText}>{displayPhone}</Text>
                </View>
              )}
              {!!displayEmail && (
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={sw(14)} color="#292D32" />
                  <Text style={styles.infoText}>{displayEmail}</Text>
                </View>
              )}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={sw(20)} color="#292D32" />
        </TouchableOpacity>

        <View style={styles.bookingsSection}>
          <View style={styles.bookingsTitleRow}>
            <Text style={styles.bookingsTitleText}>My Bookings</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation?.navigate('Bookings')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bookingsCard}>
            <TouchableOpacity
              style={styles.bookingItem}
              activeOpacity={0.7}
              onPress={() => navigation?.navigate('Bookings')}>
              <View style={styles.bookingIconWrap}>
                <Ionicons name="calendar-outline" size={sw(20)} color="#012823" />
              </View>
              <View style={styles.bookingItemText}>
                <Text style={styles.bookingItemTitle}>Upcoming</Text>
                <Text style={styles.bookingItemCount}>{upcomingCount} Booking{upcomingCount !== 1 ? 's' : ''}</Text>
              </View>
              <Ionicons name="chevron-forward" size={sw(16)} color="#292D32" />
            </TouchableOpacity>

            <View style={styles.bookingDivider} />

            <TouchableOpacity
              style={styles.bookingItem}
              activeOpacity={0.7}
              onPress={() => navigation?.navigate('Bookings')}>
              <View style={styles.bookingIconWrap}>
                <Ionicons name="checkmark-circle-outline" size={sw(20)} color="#012823" />
              </View>
              <View style={styles.bookingItemText}>
                <Text style={styles.bookingItemTitle}>Completed</Text>
                <Text style={styles.bookingItemCount}>{completedCount} Booking{completedCount !== 1 ? 's' : ''}</Text>
              </View>
              <Ionicons name="chevron-forward" size={sw(16)} color="#292D32" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, idx) => {
            const isLast = idx === MENU_ITEMS.length - 1;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuRow, !isLast && styles.menuRowBorder]}
                activeOpacity={0.7}
                onPress={() => navigation?.navigate(item.route)}>
                <View style={styles.menuLeft}>
                  <Ionicons name={item.icon as any} size={sw(20)} color="#012823" />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={sw(16)} color="#292D32" />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={sw(20)} color="#DB1919" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAccountBtn}
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('DeleteAccount')}>
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#EEEDED'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sw(16),
    paddingBottom: sw(10),
    backgroundColor: '#EEEDED',
  },
  titleBlock: {alignItems: 'center', gap: sw(6)},
  headerTitle: {fontFamily: fonts.primary, fontSize: sw(20), fontWeight: '400', color: '#012823', lineHeight: sw(23)},
  titleUnderline: {width: sw(38), height: 1.5, backgroundColor: '#C49738'},
  headerIcons: {flexDirection: 'row', alignItems: 'center', gap: sw(16)},

  scroll: {paddingHorizontal: sw(16), paddingTop: sw(4), gap: sw(16)},

  subtitle: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#373737', lineHeight: sw(18)},

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEFEFE',
    borderWidth: 1,
    borderColor: '#DFDFDF',
    borderRadius: sw(12),
    padding: sw(12),
    paddingRight: sw(20),
  },
  profileLeft: {flexDirection: 'row', alignItems: 'center', gap: sw(14), flex: 1},
  avatarWrap: {width: sw(78), height: sw(78), borderRadius: sw(64), borderWidth: 2, borderColor: '#C49738'},
  avatar: {width: '100%', height: '100%', borderRadius: sw(64)},
  avatarFallback: {backgroundColor: '#105641', alignItems: 'center', justifyContent: 'center'},
  avatarInitial: {fontFamily: fonts.title, fontSize: sw(28), fontWeight: '700', color: '#FFFFFF'},
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: sw(24),
    height: sw(24),
    borderRadius: sw(32),
    backgroundColor: '#105641',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {flex: 1, gap: sw(8)},
  profileName: {fontFamily: fonts.textFont, fontSize: sw(14), fontWeight: '700', color: '#373737', lineHeight: sw(21)},
  infoRow: {flexDirection: 'row', alignItems: 'center', gap: sw(6)},
  infoText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#373737', lineHeight: sw(18)},

  bookingsSection: {gap: sw(12)},
  bookingsTitleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  bookingsTitleText: {fontFamily: fonts.textFont, fontSize: sw(14), fontWeight: '600', color: '#373737', lineHeight: sw(21)},
  viewAllText: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '500', color: '#012823', lineHeight: sw(18)},
  bookingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFEFE',
    borderWidth: 1,
    borderColor: '#DFDFDF',
    borderRadius: sw(12),
    paddingVertical: sw(10),
    paddingHorizontal: sw(10),
  },
  bookingItem: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: sw(10), paddingHorizontal: sw(4)},
  bookingIconWrap: {
    width: sw(36),
    height: sw(36),
    borderRadius: sw(32),
    backgroundColor: 'rgba(16, 86, 65, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingItemText: {flex: 1, gap: sw(2)},
  bookingItemTitle: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '600', color: '#373737', lineHeight: sw(18)},
  bookingItemCount: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '400', color: '#373737', lineHeight: sw(18)},
  bookingDivider: {width: 0.5, height: sw(38), backgroundColor: '#828282', marginHorizontal: sw(4)},

  menuCard: {
    backgroundColor: '#FEFEFE',
    borderRadius: sw(12),
    paddingHorizontal: sw(12),
    paddingVertical: sw(12),
  },
  menuRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: sw(12)},
  menuRowBorder: {borderBottomWidth: 1, borderBottomColor: '#DBDBDB'},
  menuLeft: {flexDirection: 'row', alignItems: 'center', gap: sw(12)},
  menuLabel: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '500', color: '#373737', lineHeight: sw(18)},

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(12),
    borderWidth: 1,
    borderColor: '#DB1919',
    borderRadius: sw(8),
    paddingVertical: sw(10),
  },
  logoutText: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '500', color: '#DB1919', lineHeight: sw(18)},

  deleteAccountBtn: {alignItems: 'center', paddingVertical: sw(6)},
  deleteAccountText: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '500', color: '#828282', textDecorationLine: 'underline'},
});

export default ProfileScreen;
