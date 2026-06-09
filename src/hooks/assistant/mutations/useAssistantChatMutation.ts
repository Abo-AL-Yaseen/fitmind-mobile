import { useMutation } from '@tanstack/react-query';
import { sendAssistantMessage } from '../../../services/assistant';

export function useAssistantChatMutation() {
  return useMutation({
    mutationFn: sendAssistantMessage,
  });
}
