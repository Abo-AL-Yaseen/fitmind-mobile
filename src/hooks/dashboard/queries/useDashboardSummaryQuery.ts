import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '../keys';
import { getDashboardSummary } from '../../../services/dashboard';

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: getDashboardSummary,
    staleTime: 1000 * 60,
  });
}