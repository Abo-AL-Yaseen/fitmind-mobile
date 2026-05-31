import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Bell,
  BellRing,
  CheckCheck,
  CircleAlert,
  Clock,
  RefreshCw,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useNotificationsQuery,
} from '../hooks/userNotifications';
import {
  type UserNotification,
  type NotificationData,
} from '../services/userNotifications';
import { routeNotificationData } from '../services/notifications';

const EMPTY_NOTIFICATIONS: UserNotification[] = [];

function formatNotificationTime(value: string | null) {
  if (!value) return 'Just now';

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function buildRouteData(notification: UserNotification): NotificationData {
  return {
    ...notification.data,
    type: notification.type ?? notification.data.type,
    screen: notification.screen ?? notification.data.screen,
    entity_id: notification.entity_id ?? notification.data.entity_id,
    news_id: notification.news_id ?? notification.data.news_id,
    notification_id: notification.id,
  };
}

export default function NotificationsScreen() {
  const notificationsQuery = useNotificationsQuery();
  const refetchNotificationsRef = useRef(notificationsQuery.refetch);
  const {
    mutateAsync: markNotificationAsReadAsync,
  } = useMarkNotificationAsReadMutation();
  const {
    isPending: markingAllRead,
    mutateAsync: markAllNotificationsAsReadAsync,
  } = useMarkAllNotificationsAsReadMutation();
  const {
    data: queriedNotifications,
    error,
    isError,
    isLoading,
    isRefetching,
    refetch,
  } = notificationsQuery;

  const [errorMessage, setErrorMessage] = useState('');
  const notifications = queriedNotifications ?? EMPTY_NOTIFICATIONS;

  refetchNotificationsRef.current = refetch;

  useFocusEffect(
    useCallback(() => {
      void refetchNotificationsRef.current();
    }, [])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refetchNotificationsRef.current();
      }
    });

    return () => subscription.remove();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications]
  );

  const refreshing = isRefetching && !isLoading;

  const handleRefresh = useCallback(() => {
    setErrorMessage('');
    void refetch();
  }, [refetch]);

  const handleNotificationPress = async (notification: UserNotification) => {
    setErrorMessage('');

    if (!notification.read_at) {
      try {
        await markNotificationAsReadAsync(notification.id);
      } catch (error: any) {
        setErrorMessage(error?.message || 'Failed to mark notification as read.');
      }
    }

    routeNotificationData(buildRouteData(notification));
  };

  const handleMarkAllAsRead = async () => {
    if (!unreadCount || markingAllRead) return;

    try {
      setErrorMessage('');
      await markAllNotificationsAsReadAsync();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to mark all notifications as read.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#0D7D6D" />
        <Text style={styles.centerText}>Loading notifications...</Text>
      </View>
    );
  }

  if (isError && notifications.length === 0) {
    return (
      <View style={styles.centerState}>
        <CircleAlert color="#DC2626" size={32} />
        <Text style={styles.centerTitle}>Could not load notifications</Text>
        <Text style={styles.centerText}>
          {error instanceof Error
            ? error.message
            : 'Please try again.'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <RefreshCw color="#FFFFFF" size={16} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0D7D6D"
            colors={['#0D7D6D']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <BellRing color="#FFFFFF" size={22} />
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount
                ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`
                : 'All caught up'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.markAllButton,
              (!unreadCount || markingAllRead) && styles.markAllButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleMarkAllAsRead}
            disabled={!unreadCount || markingAllRead}
          >
            {markingAllRead ? (
              <ActivityIndicator size="small" color="#0D7D6D" />
            ) : (
              <CheckCheck color="#0D7D6D" size={16} />
            )}
            <Text style={styles.markAllText}>Read all</Text>
          </TouchableOpacity>
        </View>

        {!!errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell color="#0D7D6D" size={34} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              Important updates from your gym will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((notification) => {
              const unread = !notification.read_at;

              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[styles.card, unread && styles.cardUnread]}
                  activeOpacity={0.82}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.cardIcon,
                        unread && styles.cardIconUnread,
                      ]}
                    >
                      <BellRing
                        color={unread ? '#FFFFFF' : '#0D7D6D'}
                        size={17}
                      />
                    </View>

                    <View style={styles.cardTextWrap}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.notificationTitle,
                            unread && styles.notificationTitleUnread,
                          ]}
                          numberOfLines={2}
                        >
                          {notification.title}
                        </Text>

                        {unread && <View style={styles.unreadDot} />}
                      </View>

                      {!!notification.body && (
                        <Text style={styles.notificationBody} numberOfLines={3}>
                          {notification.body}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.timeRow}>
                      <Clock color="#9CA3AF" size={13} />
                      <Text style={styles.timeText}>
                        {formatNotificationTime(notification.created_at)}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.readStateText,
                        unread && styles.unreadStateText,
                      ]}
                    >
                      {unread ? 'Unread' : 'Read'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 34,
  },
  centerState: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerTitle: {
    marginTop: 12,
    color: '#111827',
    fontSize: 19,
    fontWeight: '800',
  },
  centerText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#0D7D6D',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  header: {
    minHeight: 92,
    borderRadius: 18,
    backgroundColor: '#0D7D6D',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
  },
  markAllButton: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  markAllButtonDisabled: {
    opacity: 0.55,
  },
  markAllText: {
    color: '#0D7D6D',
    fontSize: 12,
    fontWeight: '800',
  },
  errorBox: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    padding: 13,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    padding: 26,
  },
  emptyTitle: {
    marginTop: 12,
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  list: {
    marginTop: 14,
    gap: 12,
  },
  card: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUnread: {
    borderColor: 'rgba(13,125,109,0.38)',
    backgroundColor: '#ECFDF5',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconUnread: {
    backgroundColor: '#0D7D6D',
  },
  cardTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  notificationTitleUnread: {
    color: '#064E3B',
    fontWeight: '900',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: '#0D7D6D',
    marginTop: 6,
  },
  notificationBody: {
    marginTop: 5,
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 19,
  },
  metaRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  readStateText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '800',
  },
  unreadStateText: {
    color: '#0D7D6D',
  },
});
