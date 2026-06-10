import notifee, {AndroidImportance, AndroidStyle, AndroidVisibility} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

// Channel IDs — one per notification category
const CH_BOOKING   = 'beyomo_booking';
const CH_PAYMENT   = 'beyomo_payment';
const CH_ALERT     = 'beyomo_alert';
const CH_DEFAULT   = 'beyomo_default';

export const createNotificationChannels = async () => {
  // New booking / booking status updates — main chime
  await notifee.createChannel({
    id: CH_BOOKING,
    name: 'Booking Notifications',
    importance: AndroidImportance.HIGH,
    sound: 'notification_chime',
    vibrationPattern: [0, 250, 150, 250],
    visibility: AndroidVisibility.PUBLIC,
    lights: true,
    lightColor: '#065E2C',
  });

  // Payment / transaction alerts — alert sound
  await notifee.createChannel({
    id: CH_PAYMENT,
    name: 'Payment Notifications',
    importance: AndroidImportance.HIGH,
    sound: 'notification_alert',
    vibrationPattern: [0, 400, 100, 200],
    visibility: AndroidVisibility.PUBLIC,
    lights: true,
    lightColor: '#F5C842',
  });

  // Urgent / system alerts
  await notifee.createChannel({
    id: CH_ALERT,
    name: 'Alert Notifications',
    importance: AndroidImportance.HIGH,
    sound: 'notification_alert',
    vibrationPattern: [0, 500, 200, 500],
    visibility: AndroidVisibility.PUBLIC,
    lights: true,
    lightColor: '#DB1919',
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
    return await messaging().getToken();
  } catch (error) {
    console.error('FCM token error:', error);
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
  if (type.includes('payment') || type.includes('transaction')) return CH_PAYMENT;
  if (type.includes('alert') || type.includes('cancel'))         return CH_ALERT;
  if (type.includes('booking') || type.includes('service'))      return CH_BOOKING;
  return CH_DEFAULT;
};

const pickSound = (data = {}) => {
  const type = data?.type ?? '';
  if (type.includes('payment') || type.includes('alert') || type.includes('cancel')) return 'notification_alert';
  return 'notification_chime';
};

const displayNotification = async (notification, data = {}) => {
  try {
    const channelId = pickChannel(data);
    const sound = pickSound(data);
    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      android: {
        channelId,
        sound,
        importance: AndroidImportance.HIGH,
        color: '#065E2C',
        colorized: true,
        style: {type: AndroidStyle.BIGTEXT, text: notification.body},
        pressAction: {id: 'default', launchActivity: 'default'},
        vibrationPattern: [0, 300, 150, 300],
        lights: ['#065E2C', 500, 500],
        showTimestamp: true,
      },
      ios: {
        sound,
        foregroundPresentationOptions: {badge: true, sound: true, banner: true, list: true},
        criticalVolume: 1.0,
      },
    });
  } catch (error) {
    console.error('displayNotification error:', error);
  }
};

export const handleNotificationNavigation = (data, navigationRef) => {
  if (!data || !navigationRef?.current) return;
  const {type, bookingId} = data;
  if (type === 'booking_update' || type === 'test') {
    if (bookingId) navigationRef.current.navigate('BookingDetail', {bookingId});
  }
};
