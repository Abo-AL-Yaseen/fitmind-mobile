import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Dumbbell,
  Apple,
  MessageCircle,
  Flame,
  Trophy,
  Target,
  ChevronRight,
  ShieldCheck,
  User,
  CalendarDays,
  ClipboardList,
  UserCircle,
  Bot,
  Sparkles,
} from 'lucide-react-native';
import { CommonActions } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { quickLinks } from '../data/dashboardData';
import { StatCard } from '../components/StatCard';
import { ProgressBar } from '../components/ProgressBar';
import { useDashboardSummaryQuery } from '../hooks/dashboard/queries/useDashboardSummaryQuery';
import { clearAuth } from '../services/auth';
import { ApiError } from '../services/api';
import { useTranslation } from '../i18n';

function getErrorStatus(error: unknown) {
  return error instanceof ApiError ? error.status : undefined;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '';
}

function isProfileMissingError(error: unknown) {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error).toLowerCase();

  return (
    status === 404 ||
    message.includes('profile not found') ||
    (message.includes('profile') && message.includes('not found'))
  );
}

function isSubscriptionInactiveError(error: unknown) {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error).toLowerCase();

  return (
    status === 401 ||
    status === 403 ||
    message.includes('subscription') ||
    message.includes('inactive') ||
    message.includes('expired') ||
    message.includes('not active') ||
    message.includes('renew')
  );
}

export default function DashboardScreen({ navigation }: any) {
  const { t, isRtl, language } = useTranslation();
  const queryClient = useQueryClient();
  const subscriptionAlertShownRef = useRef(false);
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

  const navigateToLogin = useCallback(async () => {
    await clearAuth();
    queryClient.clear();

    const rootNavigation = navigation.getParent?.() ?? navigation;

    rootNavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  }, [navigation, queryClient]);

  const handleCompleteProfile = useCallback(() => {
    const rootNavigation = navigation.getParent?.() ?? navigation;
    rootNavigation.navigate('Profile');
  }, [navigation]);

  const hasSubscriptionError = !!error && isSubscriptionInactiveError(error);
  const hasMissingProfileError = !!error && isProfileMissingError(error);

  useEffect(() => {
    if (!hasSubscriptionError || subscriptionAlertShownRef.current) {
      return;
    }

    subscriptionAlertShownRef.current = true;

    Alert.alert(
      t('common.subscriptionRequired'),
      t('common.subscriptionMessage'),
      [
        {
          text: 'OK',
          onPress: () => {
            void navigateToLogin();
          },
        },
      ],
      { cancelable: false }
    );
  }, [hasSubscriptionError, navigateToLogin, t]);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString(language === 'ar' ? 'ar' : 'en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [language]
  );

  const dayName = useMemo(
    () =>
      new Date().toLocaleDateString(language === 'ar' ? 'ar' : 'en-US', {
        weekday: 'long',
      }),
    [language]
  );

  const iconMap: Record<string, any> = {
    User,
    Dumbbell,
    Apple,
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
          link.path !== 'Progress' &&
          link.label?.toLowerCase() !== 'ai coach' &&
          link.label?.toLowerCase() !== 'progress' &&
          link.icon !== 'MessageCircle'
      ),
    []
  );

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#0D7D6D" />
        <Text style={styles.centerStateText}>{t('dashboard.loading')}</Text>
      </View>
    );
  }

  if (hasSubscriptionError && !summary) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorTitle}>{t('dashboard.subscriptionTitle')}</Text>
        <Text style={styles.errorText}>
          {t('common.subscriptionMessage')}
        </Text>
      </View>
    );
  }

  if (hasMissingProfileError && !summary) {
    return (
      <View style={styles.centerState}>
        <View style={styles.onboardingIcon}>
          <UserCircle color="#0D7D6D" size={34} />
        </View>
        <Text style={styles.errorTitle}>{t('dashboard.profileMissingTitle')}</Text>
        <Text style={styles.errorText}>
          {t('dashboard.profileMissingText')}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleCompleteProfile}>
          <Text style={styles.retryButtonText}>{t('dashboard.completeProfile')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error && !summary) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorTitle}>{t('dashboard.couldNotLoad')}</Text>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : t('dashboard.failedLoad')}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>{t('common.tryAgain')}</Text>
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
          <Text style={[styles.heroTitle, isRtl && styles.textRight]}>
            {summary?.heroTitle ?? t('dashboard.welcome')}
          </Text>

          <View style={[styles.heroGoal, isRtl && styles.rowReverse]}>
            <Target color="#7FD4C9" size={18} />
            <Text style={[styles.heroGoalText, isRtl && styles.textRight]}>
              {summary?.heroGoalText ?? t('dashboard.stayConsistent')}
            </Text>
          </View>

          <View style={[styles.heroMetaRow, isRtl && styles.rowReverse]}>
            <TouchableOpacity
              style={styles.heroMetaBadge}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.heroMetaBadgeText}>
                {t('dashboard.goal')}: {goalChipLabel}
              </Text>
            </TouchableOpacity>

            <View style={styles.heroMetaBadge}>
              <Text style={styles.heroMetaBadgeText}>
                {t('dashboard.nutrition')}:{' '}
                {summary?.activeNutritionPlanName ?? t('dashboard.noPlan')}
              </Text>
            </View>
          </View>

          <View style={[styles.heroInfoGrid, isRtl && styles.rowReverse]}>
            <View style={styles.heroInfoCard}>
              <Text style={[styles.heroInfoLabel, isRtl && styles.textRight]}>
                {t('dashboard.age')}
              </Text>
              <Text style={styles.heroInfoValue}>
                {summary?.profile.age != null ? summary.profile.age : '--'}
              </Text>
            </View>

            <View style={styles.heroInfoCard}>
              <Text style={[styles.heroInfoLabel, isRtl && styles.textRight]}>
                {t('dashboard.height')}
              </Text>
              <Text style={styles.heroInfoValue}>
                {summary?.profile.height != null ? `${summary.profile.height} cm` : '--'}
              </Text>
            </View>

            <View style={styles.heroInfoCard}>
              <Text style={[styles.heroInfoLabel, isRtl && styles.textRight]}>
                {t('dashboard.weight')}
              </Text>
              <Text style={styles.heroInfoValue}>
                {summary?.profile.weight != null ? `${summary.profile.weight} kg` : '--'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.assistantCardTouchable}
          activeOpacity={0.86}
          onPress={() => navigation.navigate('Assistant')}
        >
          <LinearGradient
            colors={['#063D36', '#0D7D6D', '#115E59']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.assistantCard}
          >
            <View style={styles.assistantGlassPanelTop} />
            <View style={styles.assistantGlassPanelBottom} />

            <View style={[styles.assistantHeaderRow, isRtl && styles.rowReverse]}>
              <View style={styles.assistantBadge}>
                <Sparkles color="#BFF6EC" size={12} />
                <Text style={styles.assistantBadgeText}>{t('dashboard.aiBadge')}</Text>
              </View>

              <View style={styles.assistantIcon}>
                <Bot color="#FFFFFF" size={23} />
              </View>
            </View>

            <Text style={[styles.assistantTitle, isRtl && styles.textRight]}>
              {t('dashboard.assistantTitle')}
            </Text>
            <Text style={[styles.assistantSubtitle, isRtl && styles.textRight]}>
              {t('dashboard.assistantSubtitle')}
            </Text>

            <View style={[styles.assistantFooterRow, isRtl && styles.rowReverse]}>
              <View style={[styles.assistantChipRow, isRtl && styles.rowReverse]}>
                {[
                  t('dashboard.chipWorkout'),
                  t('dashboard.chipFood'),
                  t('dashboard.chipPain'),
                ].map((chip) => (
                  <View key={chip} style={styles.assistantChip}>
                    <Text style={styles.assistantChipText}>{chip}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.assistantCtaPill, isRtl && styles.rowReverse]}>
                <Text style={styles.assistantCtaText}>{t('dashboard.askAi')}</Text>
                <ChevronRight color="#063D36" size={14} strokeWidth={2.8} />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

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
            <Text style={[styles.cardTitle, isRtl && styles.textRight]}>
              {t('dashboard.todayProgress')}
            </Text>
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
          <Text style={[styles.sectionTitle, isRtl && styles.textRight]}>
            {t('dashboard.quickAccess')}
          </Text>
          <View style={styles.quickLinksGrid}>
            {filteredQuickLinks.map((link) => {
              const LinkIcon = iconMap[link.icon];

              return (
                <TouchableOpacity
                  key={link.path}
                  style={[styles.quickLinkCard, isRtl && styles.rowReverse]}
                  onPress={() => navigation.navigate(link.path)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickLinkIcon, { backgroundColor: link.bg }]}>
                    <LinkIcon color={link.color} size={22} />
                  </View>

                  <View style={[styles.quickLinkContent, isRtl && styles.rowReverse]}>
                    <Text style={[styles.quickLinkLabel, isRtl && styles.textRight]}>
                      {t(`dashboard.quick.${link.path}`)}
                    </Text>
                    <ChevronRight color="#D1D5DB" size={14} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.generalCard}>
          <View style={[styles.generalHeader, isRtl && styles.rowReverse]}>
            <View style={styles.generalIcon}>
              <ShieldCheck color="#FFFFFF" size={18} />
            </View>

            <View style={styles.generalHeaderText}>
              <Text style={[styles.generalEyebrow, isRtl && styles.textRight]}>
                {t('dashboard.experienceEyebrow')}
              </Text>
              <Text style={[styles.generalTitle, isRtl && styles.textRight]}>
                {t('dashboard.experienceTitle')}
              </Text>
            </View>
          </View>

          <Text style={[styles.generalDescription, isRtl && styles.textRight]}>
            {t('dashboard.experienceText')}
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
  onboardingIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  assistantCardTouchable: {
    borderRadius: 26,
    shadowColor: '#0D7D6D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 22,
    elevation: 7,
  },
  assistantCard: {
    minHeight: 174,
    borderRadius: 26,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  assistantGlassPanelTop: {
    position: 'absolute',
    top: -34,
    right: -28,
    width: 190,
    height: 104,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ rotate: '13deg' }],
  },
  assistantGlassPanelBottom: {
    position: 'absolute',
    left: 64,
    bottom: -42,
    width: 230,
    height: 94,
    borderRadius: 28,
    backgroundColor: 'rgba(127,212,201,0.14)',
    transform: [{ rotate: '-7deg' }],
  },
  assistantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  assistantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  assistantBadgeText: {
    color: '#D8FFF7',
    fontSize: 11,
    fontWeight: '900',
  },
  assistantIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 29,
  },
  assistantSubtitle: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: 5,
    maxWidth: '82%',
  },
  assistantFooterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 18,
  },
  assistantChipRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  assistantChip: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  assistantChipText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11,
    fontWeight: '800',
  },
  assistantCtaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D8FFF7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  assistantCtaText: {
    color: '#063D36',
    fontSize: 12,
    fontWeight: '900',
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
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
});
