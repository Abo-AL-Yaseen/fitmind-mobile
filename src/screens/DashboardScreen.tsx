import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Dumbbell,
  Apple,
  TrendingUp,
  MessageCircle,
  Flame,
  Trophy,
  Target,
  ChevronRight,
  ShieldCheck,
  User,
  CalendarDays,
  ClipboardList,
} from 'lucide-react-native';
import { quickLinks } from '../data/dashboardData';
import { StatCard } from '../components/StatCard';
import { ProgressBar } from '../components/ProgressBar';
import { useDashboardSummaryQuery } from '../hooks/dashboard/queries/useDashboardSummaryQuery';

export default function DashboardScreen({ navigation }: any) {
  const {
    data: summary,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDashboardSummaryQuery();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    []
  );

  const dayName = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
      }),
    []
  );

  const iconMap: Record<string, any> = {
    User,
    Dumbbell,
    Apple,
    TrendingUp,
    MessageCircle,
    Flame,
    Trophy,
    CalendarDays,
    ClipboardList,
  };

  const filteredQuickLinks = useMemo(
    () =>
      quickLinks.filter(
        (link) =>
          link.path !== 'AICoach' &&
          link.label?.toLowerCase() !== 'ai coach' &&
          link.icon !== 'MessageCircle'
      ),
    []
  );

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#0D7D6D" />
        <Text style={styles.centerStateText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error && !summary) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorTitle}>Couldn’t load dashboard</Text>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : 'Failed to load dashboard.'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const quickStats = summary?.quickStats ?? [];
  const todayProgress = summary?.todayProgress ?? [];
  const goalChipLabel = summary?.activeNutritionGoal ?? 'Set Goal';

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroDate}>{today}</Text>
          <Text style={styles.heroTitle}>{summary?.heroTitle ?? 'Welcome back! 👋'}</Text>

          <View style={styles.heroGoal}>
            <Target color="#7FD4C9" size={18} />
            <Text style={styles.heroGoalText}>
              {summary?.heroGoalText ?? 'Stay consistent and keep moving today.'}
            </Text>
          </View>

          <View style={styles.heroMetaRow}>
            <TouchableOpacity
              style={styles.heroMetaBadge}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.heroMetaBadgeText}>
                Goal: {goalChipLabel}
              </Text>
            </TouchableOpacity>

            <View style={styles.heroMetaBadge}>
              <Text style={styles.heroMetaBadgeText}>
                Nutrition: {summary?.activeNutritionPlanName ?? 'No Plan'}
              </Text>
            </View>
          </View>

          <View style={styles.heroInfoGrid}>
            <View style={styles.heroInfoCard}>
              <Text style={styles.heroInfoLabel}>Age</Text>
              <Text style={styles.heroInfoValue}>
                {summary?.profile.age != null ? summary.profile.age : '--'}
              </Text>
            </View>

            <View style={styles.heroInfoCard}>
              <Text style={styles.heroInfoLabel}>Height</Text>
              <Text style={styles.heroInfoValue}>
                {summary?.profile.height != null ? `${summary.profile.height} cm` : '--'}
              </Text>
            </View>

            <View style={styles.heroInfoCard}>
              <Text style={styles.heroInfoLabel}>Weight</Text>
              <Text style={styles.heroInfoValue}>
                {summary?.profile.weight != null ? `${summary.profile.weight} kg` : '--'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {quickStats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon as any}
              label={stat.label}
              value={stat.value}
              bg={stat.bg}
              iconColor={stat.iconColor}
            />
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today&apos;s Progress</Text>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>{dayName}</Text>
            </View>
          </View>

          <View style={styles.progressList}>
            {todayProgress.map((item, i) => (
              <ProgressBar
                key={i}
                label={item.label}
                value={item.value}
                progress={item.progress}
                color={item.color}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickLinksGrid}>
            {filteredQuickLinks.map((link) => {
              const LinkIcon = iconMap[link.icon];

              return (
                <TouchableOpacity
                  key={link.path}
                  style={styles.quickLinkCard}
                  onPress={() => navigation.navigate(link.path)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickLinkIcon, { backgroundColor: link.bg }]}>
                    <LinkIcon color={link.color} size={22} />
                  </View>

                  <View style={styles.quickLinkContent}>
                    <Text style={styles.quickLinkLabel}>{link.label}</Text>
                    <ChevronRight color="#D1D5DB" size={14} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.generalCard}>
          <View style={styles.generalHeader}>
            <View style={styles.generalIcon}>
              <ShieldCheck color="#FFFFFF" size={18} />
            </View>

            <View style={styles.generalHeaderText}>
              <Text style={styles.generalEyebrow}>FitMind Experience</Text>
              <Text style={styles.generalTitle}>Stay Consistent, Stay Strong</Text>
            </View>
          </View>

          <Text style={styles.generalDescription}>
            Your dashboard is now built from your live profile, goals, workout plans,
            and nutrition plans so you can track the most relevant parts of your
            journey in one place.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    gap: 20,
  },
  centerState: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerStateText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0D7D6D',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#0D7D6D',
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    shadowColor: '#0D7D6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  heroGoal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroGoalText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  heroMetaBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroMetaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroInfoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  heroInfoCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroInfoLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 6,
  },
  heroInfoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dayBadge: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dayBadgeText: {
    color: '#0D7D6D',
    fontSize: 12,
    fontWeight: '600',
  },
  progressList: {
    gap: 16,
  },
  section: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  quickLinksGrid: {
    gap: 12,
  },
  quickLinkCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  quickLinkIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickLinkContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickLinkLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  generalCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 24,
  },
  generalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  generalIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0D7D6D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  generalHeaderText: {
    flex: 1,
  },
  generalEyebrow: {
    fontSize: 12,
    color: '#0D7D6D',
    fontWeight: '700',
    marginBottom: 2,
  },
  generalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  generalDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
});
