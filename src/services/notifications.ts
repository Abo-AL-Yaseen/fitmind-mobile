import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
  navigate,
  navigateToMainTab,
} from '../navigation/rootNavigation';

type NotificationData = Record<string, unknown>;

const handledNotificationResponseIds = new Set<string>();
let pendingNotificationResponse: Notifications.NotificationResponse | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function getString(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    const normalized = String(value).trim();
    return normalized || undefined;
  }

  return undefined;
}

function getNotificationResponseId(response: Notifications.NotificationResponse) {
  const notificationId = getString(
    response.notification.request.content.data?.notification_id
  );

  return notificationId ?? response.notification.request.identifier;
}

export function routeNotificationData(data: NotificationData) {
  const screen = getString(data.screen);
  const type = getString(data.type);

  if (screen === 'NewsDetails' || screen === 'News' || type === 'news_published') {
    const newsId =
      getString(data.news_id) ??
      getString(data.newsId) ??
      getString(data.entity_id) ??
      getString(data.entityId);

    return navigate('News', {
      newsId,
      news_id: newsId,
      entityId: getString(data.entity_id),
      notificationId: getString(data.notification_id),
    });
  }

  if (screen === 'Sessions') return navigateToMainTab('Sessions');
  if (screen === 'Schedule' || screen === 'MySchedule') {
    return navigateToMainTab('Schedule');
  }
  if (screen === 'Workout' || screen === 'TrainingPlan') {
    return navigateToMainTab('Workout');
  }
  if (screen === 'Nutrition' || screen === 'NutritionPlan') {
    return navigateToMainTab('Nutrition');
  }
  if (screen === 'Progress') return navigateToMainTab('Dashboard');
  if (screen === 'Dashboard') return navigateToMainTab('Dashboard');
  if (screen === 'ManageInjuries' || type === 'injury_update') {
    return navigate('ManageInjuries');
  }
  if (screen === 'Settings' || type === 'subscription_expiring') {
    return navigate('Settings');
  }

  return false;
}

function handleNotificationResponse(response: Notifications.NotificationResponse) {
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return;
  }

  const responseId = getNotificationResponseId(response);

  if (handledNotificationResponseIds.has(responseId)) {
    return;
  }

  const routed = routeNotificationData(
    response.notification.request.content.data ?? {}
  );

  if (routed) {
    handledNotificationResponseIds.add(responseId);
    pendingNotificationResponse = null;
    return;
  }

  pendingNotificationResponse = response;
}

export function addNotificationResponseListener() {
  return Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse
  );
}

export async function handleLastNotificationResponseAsync() {
  try {
    const response =
      pendingNotificationResponse ??
      (await Notifications.getLastNotificationResponseAsync());

    if (response) {
      handleNotificationResponse(response);
    }
  } catch (error) {
    console.warn('Failed to handle initial notification response:', error);
  }
}

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
