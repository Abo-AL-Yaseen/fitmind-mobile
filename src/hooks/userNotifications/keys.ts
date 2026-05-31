export const userNotificationsKeys = {
  all: ['user-notifications'] as const,
  list: () => [...userNotificationsKeys.all, 'list'] as const,
  unreadCount: () => [...userNotificationsKeys.all, 'unread-count'] as const,
};
