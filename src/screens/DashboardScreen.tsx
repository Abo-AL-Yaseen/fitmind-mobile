import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Dumbbell, Apple, TrendingUp, MessageCircle, Flame, Trophy, Target, Zap, ChevronRight, Droplets, User } from 'lucide-react-native';
import { quickLinks, todayProgress, quickStats } from '../data/dashboardData';
import { StatCard } from '../components/StatCard';
import { AITipCard } from '../components/AITipCard';
import { ProgressBar } from '../components/ProgressBar';

export default function DashboardScreen({ navigation }: any) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const iconMap: Record<string, any> = {
    User,
    Dumbbell,
    Apple,
    TrendingUp,
    MessageCircle,
    Flame,
    Trophy,
    Zap,
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Welcome Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroDate}>{today}</Text>
          <Text style={styles.heroTitle}>Welcome back, John! 👋</Text>
          <View style={styles.heroGoal}>
            <Target color="#7FD4C9" size={18} />
            <Text style={styles.heroGoalText}>
              Complete your Chest & Triceps workout and hit your calorie target today!
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
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

        {/* Today's Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Progress</Text>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Wednesday</Text>
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

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickLinksGrid}>
            {quickLinks.map((link) => {
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

        {/* AI Insight Card */}
        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Zap color="#FFFFFF" size={18} />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>AI Insight</Text>
            <Text style={styles.insightText}>
              Great progress this week! Consider increasing bench press by 5 lbs next session based on your strength trend.
            </Text>
          </View>
        </View>

        {/* Water Tracker */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.waterHeader}>
              <Droplets color="#60A5FA" size={18} />
              <Text style={styles.cardTitle}>Water Intake</Text>
            </View>
            <Text style={styles.waterCount}>6 / 8 glasses</Text>
          </View>

          <View style={styles.waterGlasses}>
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.waterGlass,
                  { backgroundColor: i < 6 ? '#60A5FA' : '#F3F4F6' }
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.addWaterButton} activeOpacity={0.7}>
            <Text style={styles.addWaterButtonText}>+ Add Glass</Text>
          </TouchableOpacity>
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
    paddingVertical: 4,
    borderRadius: 999,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0D7D6D',
  },
  progressList: {
    gap: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickLinkCard: {
    width: '48%',
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
  },
  quickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickLinkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 125, 109, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(13, 125, 109, 0.15)',
    gap: 12,
    marginTop: 20,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0D7D6D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D7D6D',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  waterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waterCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  waterGlasses: {
    flexDirection: 'row',
    gap: 8,
  },
  waterGlass: {
    flex: 1,
    height: 32,
    borderRadius: 8,
  },
  addWaterButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  addWaterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#60A5FA',
  },
});
