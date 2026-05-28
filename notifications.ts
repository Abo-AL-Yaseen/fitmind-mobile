import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;

  let { status } = await Notifications.getPermissionsAsync();

  if (status !== "granted") {
    const res = await Notifications.requestPermissionsAsync();
    status = res.status;
  }

  if (status !== "granted") return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });

  return token.data;
}