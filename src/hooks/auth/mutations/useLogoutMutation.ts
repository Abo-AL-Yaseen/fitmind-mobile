import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '../../../services/auth';

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
    },
    onError: () => {
      queryClient.clear();
    },
  });
}