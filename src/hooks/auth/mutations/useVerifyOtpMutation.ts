import { useMutation } from '@tanstack/react-query';
import { saveResetData, verifyOtp } from '../../../services/auth';

interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: async ({ email, otp }: VerifyOtpPayload) => {
      const data = await verifyOtp(email, otp);
      await saveResetData(data.reset_token, email);

      return data;
    },
  });
}