import { request, check, checkNotifications, requestNotifications, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';

export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const cameraPermission = Platform.select({
      ios: PERMISSIONS.IOS.CAMERA,
      android: PERMISSIONS.ANDROID.CAMERA,
    });

    if (!cameraPermission) {
      console.error('Camera permission not available for this platform');
      return false; 
    }

    const permissionStatus = await check(cameraPermission);

    if (permissionStatus === RESULTS.GRANTED) {
      return true;
    }

    const requestStatus = await request(cameraPermission);
    return requestStatus === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};


// Push notification permission — on Android 13+ this requests the POST_NOTIFICATIONS
// runtime permission (declared in AndroidManifest.xml); on iOS it requests
// UNUserNotificationCenter authorization (alert/sound/badge). Pre-Android 13 there's
// no runtime permission to request, so `requestNotifications` resolves granted immediately.
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const {status} = await checkNotifications();
    if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
      return true;
    }
    const {status: requestedStatus} = await requestNotifications(['alert', 'sound', 'badge']);
    return requestedStatus === RESULTS.GRANTED || requestedStatus === RESULTS.LIMITED;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const microphonePermission = Platform.select({
      ios: PERMISSIONS.IOS.MICROPHONE,
      android: PERMISSIONS.ANDROID.RECORD_AUDIO,
    });

    if (!microphonePermission) {
      console.error('Microphone permission not available for this platform');
      return false; 
    }

    const permissionStatus = await check(microphonePermission);

    if (permissionStatus === RESULTS.GRANTED) {
      return true;
    }

    const requestStatus = await request(microphonePermission);
    return requestStatus === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
};
