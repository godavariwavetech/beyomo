/**
 * @format
 */

import {AppRegistry} from 'react-native';
import notifee, {EventType} from '@notifee/react-native';
import {queueNotificationPress} from './src/services/NotificationsService';
import App from './App';
import {name as appName} from './app.json';

notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.PRESS) queueNotificationPress(detail.notification?.data, detail.notification?.id);
});

AppRegistry.registerComponent(appName, () => App);
