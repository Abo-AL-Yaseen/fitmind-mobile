export const coachSessionKeys = {
  all: ['coachSessions'] as const,
  available: () => [...coachSessionKeys.all, 'available'] as const,
  my: () => [...coachSessionKeys.all, 'my'] as const,
};
