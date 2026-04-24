export const userGoalsKeys = {
  all: ['user-goals'] as const,

  lists: () => [...userGoalsKeys.all, 'list'] as const,
  current: () => [...userGoalsKeys.all, 'current'] as const,
  detail: (id: number | string) => [...userGoalsKeys.all, 'detail', String(id)] as const,
};