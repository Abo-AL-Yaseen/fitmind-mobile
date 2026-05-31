import { useQuery } from '@tanstack/react-query';
import { getUnreadNotificationCount } from '../../../services/userNotifications';
import { userNotificationsKeys } from '../keys';

export function useUnreadNotificationCountQuery() {
  return useQuery({
    queryKey: userNotificationsKeys.unreadCount(),
    queryFn: getUnreadNotificationCount,
    staleTime: 1000 * 30,
  });
}
