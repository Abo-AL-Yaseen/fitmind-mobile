import { useQuery } from '@tanstack/react-query';
import { profileKeys } from '../keys';
import { getMyProfile } from '../../../services/profile';

export function useMyProfileQuery() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: getMyProfile,
    staleTime: 1000 * 60,
  });
}