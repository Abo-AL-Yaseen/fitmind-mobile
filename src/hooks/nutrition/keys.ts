export const nutritionKeys = {
  all: ['nutrition'] as const,

  latestPlan: () => [...nutritionKeys.all, 'latest-plan'] as const,
};