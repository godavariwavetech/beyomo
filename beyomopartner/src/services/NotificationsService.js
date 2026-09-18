import notifee, {AndroidImportance, AndroidStyle, AndroidVisibility} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

// Channel IDs
const CH_NEW_BOOKING = 'beyomo_partner_new_booking';
const CH_BOOKING_UPD = 'beyomo_partner_booking_update';
const CH_PAYMENT     = 'beyomo_partner_payment';
const CH_DEFAULT     = 'beyomo_partner_default';

export const createNotificationChannels = async () => {
  await Promise.allSettled([
    notifee.deleteChannel(CH_NEW_BOOKING),
    notifee.deleteChannel(CH_BOOKING_UPD),
    notifee.deleteChannel(CH_PAYMENT),
    notifee.deleteChannel(CH_DEFAULT),
  ]);

  const channels = [
    {
      id: CH_NEW_BOOKING, name: 'New Booking Requests',
      importance: AndroidImportance.HIGH, sound: 'beyomo_notification',
      vibrationPattern: [500, 200, 500, 200, 500, 200, 500, 200, 500, 200],
      visibility: AndroidVisibility.PUBLIC, lights: true, lightColor: '#FDD77A',
    },
    {
      id: CH_BOOKING_UPD, name: 'Booking Updates',
      importance: AndroidImportance.HIGH, sound: 'beyomo_notification',
      vibrationPattern: [300, 150, 300, 150],
      visibility: AndroidVisibility.PUBLIC, lights: true, lightColor: '#065E2C',
    },
    {
      id: CH_PAYMENT, name: 'Earnings & Payments',
      importance: AndroidImportance.HIGH, sound: 'default',
      vibrationPattern: [400, 100, 200, 100],
      visibility: AndroidVisibility.PUBLIC, lights: true, lightColor: '#F5C842',
    },
    {
      id: CH_DEFAULT, name: 'General Notifications',
      importance: AndroidImportance.HIGH, sound: 'default',
      vibrationPattern: [300, 200, 300, 200],
      visibility: AndroidVisibility.PUBLIC,
    },
  ];

  for (const ch of channels) {
    try {
      const created = await notifee.createChannel(ch);
      console.log(`[NOTIF] Channel created: id=${ch.id} → notifee returned "${created}"`);
    } catch (err) {
      console.error(`[NOTIF] createChannel FAILED for ${ch.id}:`, err?.message ?? err);
    }
  }
};

export const getFCMToken = async () => {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error('[FCM] Error getting token:', error.message);
    return null;
  }
};

export const setupForegroundHandler = () => {
  return messaging().onMessage(async remoteMessage => {
    // Fall back to data payload if the standard notification field is missing
    // (data-only messages use `data` for title/body). Either way, Notifee displays
    // the notification — the OS suppresses the built-in heads-up while the app is
    // in the foreground, so we always route through Notifee to guarantee sound +
    // tray + heads-up (via the HIGH-importance channel).
    const notif = remoteMessage.notification ?? {
      title: remoteMessage.data?.title ?? 'Notification',
      body: remoteMessage.data?.body ?? '',
    };
    if (!notif.title && !notif.body) return;
    await displayNotification(notif, remoteMessage.data);
  });
};

const pickChannel = (data = {}) => {
  const type = data?.type ?? '';
  if (type === 'new_booking')                                  return CH_NEW_BOOKING;
  if (type.includes('payment') || type.includes('earning'))   return CH_PAYMENT;
  if (type.includes('booking') || type.includes('service'))   return CH_BOOKING_UPD;
  return CH_DEFAULT;
};

const pickSound = (data = {}) => {
  // Custom sound plays only for order (booking) notifications; everything
  // else uses the device's default notification sound.
  const type = data?.type ?? '';
  if (type === 'new_booking') return 'beyomo_notification';
  if (type.includes('booking') || type.includes('service')) return 'beyomo_notification';
  return 'default';
};

const displayNotification = async (notification, data = {}) => {
  try {
    const channelId = pickChannel(data);
    const sound = pickSound(data);
    const isNewBooking = (data?.type ?? '') === 'new_booking';
    console.log(`[NOTIF] displayNotification called — channel=${channelId} sound=${sound} title="${notification.title}" body="${notification.body}"`);

    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      android: {
        channelId,
        sound,
        importance: AndroidImportance.HIGH,
        color: isNewBooking ? '#FDD77A' : '#065E2C',
        colorized: true,
        style: {type: AndroidStyle.BIGTEXT, text: notification.body},
        pressAction: {id: 'default', launchActivity: 'default'},
        // Vibration is already configured on the channel (see createNotificationChannels).
        // Duplicating it here as a notification-level pattern trips Notifee's validator
        // ("expected an array containing an even number of positive values") because 0
        // isn't positive at the notification level, even though it's the standard first
        // value in Android's channel-level pattern.
        lights: [isNewBooking ? '#FDD77A' : '#065E2C', 500, 500],
        showTimestamp: true,
        ongoing: false,
      },
      ios: {
        sound,
        foregroundPresentationOptions: {badge: true, sound: true, banner: true, list: true},
        criticalVolume: isNewBooking ? 1.0 : 0.8,
      },
    });
  } catch (error) {
    console.error('[NOTIF] displayNotification error:', error);
  }
};

export const handleNotificationNavigation = (data, navigationRef) => {
  if (!data || !navigationRef?.current) return;
  const {type, bookingId} = data;
  if (type === 'new_booking' || type === 'booking_update' || type === 'test') {
    if (bookingId) {
      navigationRef.current.navigate('Main');
      setTimeout(() => {
        navigationRef.current.navigate('IncomingRequest', {bookingId});
      }, 500);
    } else {
      navigationRef.current.navigate('Main');
    }
  }
};
