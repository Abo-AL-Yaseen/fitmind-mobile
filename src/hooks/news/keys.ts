export const newsKeys = {
  all: ['news'] as const,
  public: () => [...newsKeys.all, 'public'] as const,
  publicList: (page: number, perPage: number) =>
    [...newsKeys.public(), 'list', page, perPage] as const,
};