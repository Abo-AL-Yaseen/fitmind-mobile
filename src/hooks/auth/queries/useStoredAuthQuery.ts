import { useQuery } from '@tanstack/react-query';
import { authKeys } from '../keys';
import { getAuth } from '../../../services/auth';

export function useStoredAuthQuery() {
  return useQuery({
    queryKey: [...authKeys.all, 'stored-auth'],
    queryFn: getAuth,
    staleTime: Infinity,
  });
}