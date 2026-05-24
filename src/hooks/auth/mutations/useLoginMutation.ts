import { useMutation } from '@tanstack/react-query';
import { login, saveAuth, type LoginPayload } from '../../../services/auth';

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await login(payload);

      if (response.role !== 'user') {
        throw new Error('Only user accounts can log in to the mobile app.');
      }

      await saveAuth(response);

      return response;
    },
  });
}