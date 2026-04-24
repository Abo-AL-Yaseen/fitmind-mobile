export const authKeys = {
  all: ['auth'] as const,

  resetData: () => [...authKeys.all, 'reset-data'] as const,
};