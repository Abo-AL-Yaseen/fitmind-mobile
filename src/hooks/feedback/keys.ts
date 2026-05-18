export const feedbackKeys = {
  all: ['feedback'] as const,
  my: () => [...feedbackKeys.all, 'my'] as const,
  details: () => [...feedbackKeys.all, 'details'] as const,
  detail: (id: number | string) => [...feedbackKeys.details(), String(id)] as const,
};
