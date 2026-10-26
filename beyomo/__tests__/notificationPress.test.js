jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    onForegroundEvent: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    displayNotification: jest.fn(() => Promise.resolve()),
  },
  EventType: {PRESS: 1},
  AndroidImportance: {HIGH: 4}, AndroidStyle: {BIGTEXT: 1}, AndroidVisibility: {},
}));
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: () => ({onMessage: jest.fn(callback => {global.receiveNotification = callback; return jest.fn();})}),
}));

import notifee from '@notifee/react-native';
import {setupForegroundHandler, setupNotificationPressHandler, queueNotificationPress, flushNotificationPress, handleNotificationNavigation} from '../src/services/NotificationsService';

const makeRef = (main = true) => ({current: {
  isReady: jest.fn(() => true),
  getRootState: jest.fn(() => ({routes: [{name: main ? 'Main' : 'Splash'}]})),
  navigate: jest.fn(),
}});

beforeEach(() => jest.clearAllMocks());

test('preserves the existing payload on a locally displayed notification', async () => {
  setupForegroundHandler();
  const data = {type: 'booking', bookingId: '42'};
  await global.receiveNotification({notification: {title: 'Booking', body: 'Updated'}, data});
  expect(notifee.displayNotification).toHaveBeenCalledWith(expect.objectContaining({data}));
});

test('defers a startup tap until Main and consumes it once', async () => {
  const ref = makeRef(false);
  const cleanup = setupNotificationPressHandler(ref);
  queueNotificationPress({type: 'booking', bookingId: '42'});
  expect(ref.current.navigate).not.toHaveBeenCalled();
  ref.current.getRootState.mockReturnValue({routes: [{name: 'Main'}]});
  flushNotificationPress();
  await Promise.resolve();
  flushNotificationPress();
  expect(ref.current.navigate).toHaveBeenCalledTimes(1);
  cleanup();
});

test('handles Notifee press and ignores dismiss events', async () => {
  const ref = makeRef();
  const cleanup = setupNotificationPressHandler(ref);
  const listener = notifee.onForegroundEvent.mock.calls[0][0];
  listener({type: 2, detail: {notification: {data: {type: 'booking', bookingId: '42'}}}});
  expect(ref.current.navigate).not.toHaveBeenCalled();
  listener({type: 1, detail: {notification: {data: {type: 'booking', bookingId: '42'}}}});
  await Promise.resolve();
  expect(ref.current.navigate).toHaveBeenCalledTimes(1);
  cleanup();
});

test('retains a cold-start Notifee tap through Splash', async () => {
  notifee.getInitialNotification.mockResolvedValueOnce({notification: {data: {type: 'booking', bookingId: '42'}}});
  const ref = makeRef(false);
  const cleanup = setupNotificationPressHandler(ref);
  await Promise.resolve();
  expect(ref.current.navigate).not.toHaveBeenCalled();
  ref.current.getRootState.mockReturnValue({routes: [{name: 'Main'}]});
  flushNotificationPress();
  await Promise.resolve();
  expect(ref.current.navigate).toHaveBeenCalledTimes(1);
  cleanup();
});

test('routes the production booking payload to BookingDetail', () => {
  const ref = makeRef();
  handleNotificationNavigation({type: 'booking', bookingId: '42'}, ref);
  expect(ref.current.navigate).toHaveBeenCalledWith('BookingDetail', {bookingId: '42'});
});

test('does not navigate twice for the same background and initial tap', async () => {
  const ref = makeRef();
  const cleanup = setupNotificationPressHandler(ref);
  const data = {type: 'booking', bookingId: '42'};
  queueNotificationPress(data, 'same-notification');
  queueNotificationPress(data, 'same-notification');
  await Promise.resolve();
  expect(ref.current.navigate).toHaveBeenCalledTimes(1);
  cleanup();
});
