import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authKeys } from '../keys';
import { clearResetData, resetPassword } from '../../../services/auth';

interface ResetPasswordPayload {
  resetToken: string;
  password: string;
  passwordConfirmation: string;
}

export function useResetPasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resetToken,
      password,
      passwordConfirmation,
    }: ResetPasswordPayload) => {
      const response = await resetPassword(
        resetToken,
        password,
        passwordConfirmation
      );

      await clearResetData();

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: authKeys.resetData(),
      });
    },
  });
}