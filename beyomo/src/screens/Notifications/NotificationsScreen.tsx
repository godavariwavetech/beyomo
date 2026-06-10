import React, {useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {fonts} from '../../config/theme';
import {useDispatch, useSelector} from 'react-redux';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../redux/reducers/notifications';

const {width} = Dimensions.get('window');
const sw = (px: number) => (px / 393) * width;

const ICON_MAP: Record<string, {icon: string; iconColor: string; iconBg: string}> = {
  booking_confirmed:  {icon: 'checkmark-circle', iconColor: '#105641', iconBg: '#EAF5F0'},
  booking_completed:  {icon: 'checkmark-circle', iconColor: '#105641', iconBg: '#EAF5F0'},
  booking_cancelled:  {icon: 'close-circle',     iconColor: '#FB1616', iconBg: '#FFF0F0'},
  offer:              {icon: 'pricetag',          iconColor: '#C49738', iconBg: '#FFF8E7'},
  review:             {icon: 'star',              iconColor: '#F5A623', iconBg: '#FFF8E7'},
  partner_assigned:   {icon: 'person',            iconColor: '#1C46CF', iconBg: '#EEF2FF'},
  referral:           {icon: 'gift',              iconColor: '#FB1616', iconBg: '#FFF0F0'},
  default:            {icon: 'notifications',     iconColor: '#105641', iconBg: '#EAF5F0'},
};

const getIconStyle = (type: string) => ICON_MAP[type] ?? ICON_MAP.default;

const formatTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'});
};

const NotificationsScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const {list: notifications, unreadCount, loading} = useSelector((s: any) => s.Notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, []);

  const handleMarkRead = (id: string) => dispatch(markNotificationRead(id));
  const handleMarkAllRead = () => dispatch(markAllNotificationsRead());

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEDED" />

      <View style={[styles.header, {paddingTop: insets.top + sw(14)}]}>
        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={sw(24)} color="#000000" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.titleUnderline} />
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{width: sw(70)}} />
        )}
      </View>

      {loading && notifications.length === 0 ? (
        <ActivityIndicator size="large" color="#105641" style={{marginTop: sw(40)}} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + sw(24)}]}>

          {unreadCount > 0 && (
            <Text style={styles.sectionLabel}>New ({unreadCount})</Text>
          )}

          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={sw(48)} color="#C5C5C5" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          ) : (
            notifications.map((notif: any, idx: number) => {
              const iconStyle = getIconStyle(notif.type);
              const isUnread = !notif.isRead;
              return (
                <React.Fragment key={notif._id ?? notif.id}>
                  {idx > 0 && !notifications[idx - 1].isRead && notif.isRead && (
                    <Text style={[styles.sectionLabel, {marginTop: sw(8)}]}>Earlier</Text>
                  )}
                  <TouchableOpacity
                    style={[styles.notifCard, isUnread && styles.notifCardUnread]}
                    activeOpacity={0.7}
                    onPress={() => isUnread && handleMarkRead(notif._id ?? notif.id)}>
                    <View style={[styles.iconWrap, {backgroundColor: iconStyle.iconBg}]}>
                      <Ionicons name={iconStyle.icon as any} size={sw(22)} color={iconStyle.iconColor} />
                    </View>
                    <View style={styles.notifBody}>
                      <View style={styles.notifTitleRow}>
                        <Text style={styles.notifTitle}>{notif.title}</Text>
                        {isUnread && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notifText} numberOfLines={2}>{notif.body}</Text>
                      <Text style={styles.notifTime}>{formatTime(notif.createdAt ?? notif.sentAt)}</Text>
                    </View>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#EEEDED'},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: sw(16), paddingBottom: sw(12), backgroundColor: '#EEEDED',
  },
  titleBlock: {alignItems: 'center', gap: sw(6)},
  headerTitle: {fontFamily: fonts.primary, fontSize: sw(20), fontWeight: '400', color: '#012823'},
  titleUnderline: {width: sw(38), height: 1.5, backgroundColor: '#C49738'},
  markAllText: {fontFamily: fonts.textFont, fontSize: sw(11), color: '#105641', fontWeight: '600', width: sw(70), textAlign: 'right'},
  scroll: {paddingHorizontal: sw(16), paddingTop: sw(8), gap: sw(8)},
  sectionLabel: {fontFamily: fonts.textFont, fontSize: sw(12), fontWeight: '600', color: '#5C5C5C', marginBottom: sw(4)},
  notifCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: sw(12),
    padding: sw(12), gap: sw(12), alignItems: 'flex-start',
    elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 4,
  },
  notifCardUnread: {backgroundColor: '#F0FAF6', borderLeftWidth: 3, borderLeftColor: '#105641'},
  iconWrap: {width: sw(44), height: sw(44), borderRadius: sw(22), alignItems: 'center', justifyContent: 'center'},
  notifBody: {flex: 1, gap: sw(3)},
  notifTitleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  notifTitle: {fontFamily: fonts.textFont, fontSize: sw(13), fontWeight: '700', color: '#171816', flex: 1},
  unreadDot: {width: sw(8), height: sw(8), borderRadius: sw(4), backgroundColor: '#105641', marginLeft: sw(8)},
  notifText: {fontFamily: fonts.textFont, fontSize: sw(12), color: '#5C5C5C', lineHeight: sw(18)},
  notifTime: {fontFamily: fonts.textFont, fontSize: sw(10), color: '#A3A3A3', marginTop: sw(2)},
  emptyState: {alignItems: 'center', justifyContent: 'center', paddingTop: sw(80), gap: sw(12)},
  emptyText: {fontFamily: fonts.textFont, fontSize: sw(14), color: '#A3A3A3'},
});

export default NotificationsScreen;
