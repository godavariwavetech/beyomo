import notifee, {AndroidImportance, AndroidStyle, AndroidVisibility} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

// Channel IDs
const CH_NEW_BOOKING = 'beyomo_partner_new_booking';
const CH_BOOKING_UPD = 'beyomo_partner_booking_update';
const CH_PAYMENT     = 'beyomo_partner_payment';
const CH_DEFAULT     = 'beyomo_partner_default';

export const createNotificationChannels = async () => {
  // New booking request — long alarm sound (4s), heavy vibration, highest importance
  await notifee.createChannel({
    id: CH_NEW_BOOKING,
    name: 'New Booking Requests',
    importance: AndroidImportance.HIGH,
    sound: 'booking_alarm',
    vibrationPattern: [0, 500, 200, 500, 200, 500, 200, 500, 200, 500],
    visibility: AndroidVisibility.PUBLIC,
    lights: true,
    lightColor: '#FDD77A',
  });

  // Booking updates (confirmed, cancelled, etc.) — chime
  await notifee.createChannel({
    id: CH_BOOKING_UPD,
    name: 'Booking Updates',
    importance: AndroidImportance.HIGH,
    sound: 'notification_chime',
    vibrationPattern: [0, 300, 150, 300],
    visibility: AndroidVisibility.PUBLIC,
    lights: true,
    lightColor: '#065E2C',
  });

  // Payment / earnings — alert
  await notifee.createChannel({
    id: CH_PAYMENT,
    name: 'Earnings & Payments',
    importance: AndroidImportance.HIGH,
    sound: 'notification_alert',
    vibrationPattern: [0, 400, 100, 200],
    visibility: AndroidVisibility.PUBLIC,
    lights: true,
    lightColor: '#F5C842',
  });

  // General fallback
  await notifee.createChannel({
    id: CH_DEFAULT,
    name: 'General Notifications',
    importance: AndroidImportance.DEFAULT,
    sound: 'notification_chime',
    vibrationPattern: [0, 200],
    visibility: AndroidVisibility.PUBLIC,
  });
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
    if (remoteMessage.notification) {
      await displayNotification(remoteMessage.notification, remoteMessage.data);
    }
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
  const type = data?.type ?? '';
  if (type === 'new_booking')                                  return 'booking_alarm';
  if (type.includes('payment') || type.includes('earning'))   return 'notification_alert';
  return 'notification_chime';
};

const displayNotification = async (notification, data = {}) => {
  try {
    const channelId = pickChannel(data);
    const sound = pickSound(data);
    const isNewBooking = (data?.type ?? '') === 'new_booking';

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
        vibrationPattern: isNewBooking ? [0, 500, 200, 500, 200, 500, 200, 500, 200, 500] : [0, 300, 150, 300],
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
