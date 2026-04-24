import { useQuery } from '@tanstack/react-query';
import { authKeys } from '../keys';
import { getResetData } from '../../../services/auth';

export function useResetDataQuery() {
  return useQuery({
    queryKey: authKeys.resetData(),
    queryFn: getResetData,
    staleTime: Infinity,
  });
}