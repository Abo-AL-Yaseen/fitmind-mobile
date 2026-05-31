import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../../../services/userNotifications';
import { userNotificationsKeys } from '../keys';

export function useNotificationsQuery() {
  return useQuery({
    queryKey: userNotificationsKeys.list(),
    queryFn: getNotifications,
    staleTime: 1000 * 30,
  });
}
