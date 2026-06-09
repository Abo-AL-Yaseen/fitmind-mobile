import { apiFetch } from './api';

export interface AssistantSource {
  source_id: number | string;
  source_table?: string | null;
  source_name?: string | null;
  score?: number | string | null;
  reason_used?: string | null;
}

export interface AssistantChatResponse {
  status: string;
  answer: string;
  warnings?: string[];
  sources?: AssistantSource[];
  generation_mode?: string | null;
  fallback_reason?: string | null;
}

export async function sendAssistantMessage(
  message: string
): Promise<AssistantChatResponse> {
  return apiFetch<AssistantChatResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
    }),
  });
}
