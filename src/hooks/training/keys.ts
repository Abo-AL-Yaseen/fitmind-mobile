export const trainingKeys = {
  all: ['training'] as const,

  latestPlan: () => [...trainingKeys.all, 'latest-plan'] as const,
};