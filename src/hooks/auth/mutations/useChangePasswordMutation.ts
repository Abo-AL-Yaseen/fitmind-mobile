import { useMutation } from '@tanstack/react-query';
import {
  changePassword,
  type ChangePasswordPayload,
} from '../../../services/auth';

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
  });
}
