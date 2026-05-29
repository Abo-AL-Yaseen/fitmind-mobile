import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      return null;
    }

    let { status } = await Notifications.getPermissionsAsync();

    if (status !== 'granted') {
      const permissionResponse = await Notifications.requestPermissionsAsync();
      status = permissionResponse.status;
    }

    if (status !== 'granted') {
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('Expo push token registration skipped: missing EAS projectId.');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });

    return token.data;
  } catch (error) {
    console.warn('Expo push token registration failed:', error);
    return null;
  }
}
