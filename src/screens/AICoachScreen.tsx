import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Sparkles, User, TrendingUp, Calendar, Target, AlertTriangle, ChevronRight, ChevronDown, Dumbbell, Clock, Zap, RefreshCw, Heart } from 'lucide-react-native';
import { userData, workoutPlan, goalColors } from '../data/aiCoachData';

export default function AICoachScreen() {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const toggleDay = (dayId: number) => {
    setExpandedDay(expandedDay === dayId ? null : dayId);
  };

  const goalStyle = goalColors[userData.stats.goal] || goalColors['Maintenance'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{userData.avatar}</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>AI Coach</Text>
                <Text style={styles.headerSubtitle}>Personalized training for you</Text>
              </View>
            </View>
            <View style={styles.sparklesContainer}>
              <Sparkles color="#FFFFFF" size={20} />
            </View>
          </View>
        </View>

        {/* User Stats Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <User color="#0D7D6D" size={20} />
            <Text style={styles.cardTitle}>Your Profile</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statItemHeader}>
                <TrendingUp color="#0D7D6D" size={16} />
                <Text style={styles.statLabel}>Weight</Text>
              </View>
              <Text style={styles.statValue}>{userData.stats.weight} kg</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statItemHeader}>
                <Target color="#0D7D6D" size={16} />
                <Text style={styles.statLabel}>Height</Text>
              </View>
              <Text style={styles.statValue}>{userData.stats.height} cm</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statItemHeader}>
                <Calendar color="#0D7D6D" size={16} />
                <Text style={styles.statLabel}>Age</Text>
              </View>
              <Text style={styles.statValue}>{userData.stats.age} years</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statItemHeader}>
                <Zap color="#0D7D6D" size={16} />
                <Text style={styles.statLabel}>Level</Text>
              </View>
              <Text style={styles.statValueMedium}>{userData.stats.level}</Text>
            </View>
          </View>

          <View style={[styles.goalContainer, { backgroundColor: goalStyle.bg + '33', borderColor: goalStyle.border + '4D' }]}>
            <View>
              <Text style={styles.goalLabel}>Current Goal</Text>
              <Text style={[styles.goalValue, { color: goalStyle.text }]}>{userData.stats.goal}</Text>
            </View>
            <Target color={goalStyle.text} size={24} />
          </View>
        </View>

        {/* Injury Alert */}
        {userData.injury.hasInjury && (
          <View style={styles.injuryAlert}>
            <View style={styles.injuryIconContainer}>
              <AlertTriangle color="#D97706" size={20} />
            </View>
            <View style={styles.injuryContent}>
              <Text style={styles.injuryTitle}>⚠️ {userData.injury.type} Detected</Text>
              <Text style={styles.injuryText}>
                Your program has been adjusted to protect your {userData.injury.affectedArea}
              </Text>
              <View style={styles.injuryTags}>
                <View style={styles.injuryTag}>
                  <Text style={styles.injuryTagText}>Low-impact alternatives</Text>
                </View>
                <View style={styles.injuryTag}>
                  <Text style={styles.injuryTagText}>Modified exercises</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Current Program Section */}
        <View style={styles.card}>
          <View style={styles.programHeader}>
            <View>
              <View style={styles.programTitleRow}>
                <Dumbbell color="#0D7D6D" size={20} />
                <Text style={styles.cardTitle}>Your Program</Text>
              </View>
              <Text style={styles.programName}>{userData.program.name}</Text>
              <View style={styles.programMeta}>
                <View style={styles.programMetaItem}>
                  <Clock color="#6B7280" size={12} />
                  <Text style={styles.programMetaText}>{userData.program.duration}</Text>
                </View>
                <View style={styles.programMetaItem}>
                  <Calendar color="#6B7280" size={12} />
                  <Text style={styles.programMetaText}>{userData.program.daysPerWeek} days/week</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Workout Days */}
          <View style={styles.workoutDays}>
            {workoutPlan.map((workout) => (
              <View
                key={workout.id}
                style={[
                  styles.workoutDay,
                  workout.completed ? styles.workoutDayCompleted :
                  workout.modified ? styles.workoutDayModified : styles.workoutDayNormal
                ]}
              >
                <TouchableOpacity
                  style={styles.workoutDayHeader}
                  onPress={() => toggleDay(workout.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.workoutDayLeft}>
                    <View style={[
                      styles.workoutDayIcon,
                      workout.completed ? styles.workoutDayIconCompleted :
                      workout.modified ? styles.workoutDayIconModified : styles.workoutDayIconNormal
                    ]}>
                      {workout.completed ? (
                        <Heart color="#FFFFFF" size={20} fill="#FFFFFF" />
                      ) : (
                        <Dumbbell color={workout.modified ? "#FFFFFF" : "#6B7280"} size={20} />
                      )}
                    </View>
                    <View>
                      <Text style={styles.workoutDayTitle}>{workout.day}</Text>
                      <Text style={styles.workoutDaySubtitle}>
                        {workout.focus}
                        {workout.modified && ' (Modified)'}
                      </Text>
                    </View>
                  </View>
                  <ChevronDown
                    color="#9CA3AF"
                    size={20}
                    style={{
                      transform: [{ rotate: expandedDay === workout.id ? '180deg' : '0deg' }]
                    }}
                  />
                </TouchableOpacity>

                {expandedDay === workout.id && (
                  <View style={styles.exercisesList}>
                    {workout.exercises.map((exercise, idx) => (
                      <View key={idx} style={styles.exerciseItem}>
                        <View style={styles.exerciseHeader}>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                          {exercise.note && (
                            <View style={styles.exerciseNote}>
                              <Text style={styles.exerciseNoteText}>{exercise.note}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.exerciseMeta}>
                          <Text style={styles.exerciseMetaText}>
                            <Text style={styles.exerciseMetaBold}>{exercise.sets}</Text> sets
                          </Text>
                          <Text style={styles.exerciseMetaText}>
                            <Text style={styles.exerciseMetaBold}>{exercise.reps}</Text> reps
                          </Text>
                          <View style={styles.exerciseMetaItem}>
                            <Clock color="#6B7280" size={12} />
                            <Text style={styles.exerciseMetaText}>{exercise.rest} rest</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Progress Status */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>Next AI Update</Text>
              <Text style={styles.progressValue}>{userData.program.nextUpdate}</Text>
            </View>
            <View style={styles.progressIcon}>
              <Sparkles color="#FFFFFF" size={28} />
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.progressText}>1 week completed of current cycle</Text>
        </View>

        {/* AI Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
            <Sparkles color="#FFFFFF" size={20} />
            <Text style={styles.primaryButtonText}>Generate New Program</Text>
            <ChevronRight color="#FFFFFF" size={20} />
          </TouchableOpacity>

          {userData.injury.hasInjury && (
            <TouchableOpacity style={styles.warningButton} activeOpacity={0.8}>
              <RefreshCw color="#FFFFFF" size={20} />
              <Text style={styles.warningButtonText}>Update Based on Injury</Text>
              <ChevronRight color="#FFFFFF" size={20} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.outlineButton} activeOpacity={0.8}>
            <Calendar color="#374151" size={20} />
            <Text style={styles.outlineButtonText}>View Full Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsIconContainer}>
            <Zap color="#2563EB" size={20} />
          </View>
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>💡 AI Coach Tip</Text>
            <Text style={styles.tipsText}>
              Your strength is improving! Consider increasing weight by 2.5kg on your next chest day to continue progressing.
            </Text>
          </View>
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
    gap: 16,
  },
  header: {
    backgroundColor: '#0D7D6D',
    borderRadius: 16,
    padding: 24,
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  sparklesContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#E6F4F1',
    borderRadius: 12,
    padding: 12,
  },
  statItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statValueMedium: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  goalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  goalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  injuryAlert: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FED7AA',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginTop: 16,
  },
  injuryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  injuryContent: {
    flex: 1,
  },
  injuryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  injuryText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  injuryTags: {
    flexDirection: 'row',
    gap: 8,
  },
  injuryTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  injuryTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
  },
  programHeader: {
    marginBottom: 16,
  },
  programTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  programName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  programMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  programMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  programMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  workoutDays: {
    gap: 12,
  },
  workoutDay: {
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  workoutDayCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  workoutDayModified: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  workoutDayNormal: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  workoutDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  workoutDayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workoutDayIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutDayIconCompleted: {
    backgroundColor: '#10B981',
  },
  workoutDayIconModified: {
    backgroundColor: '#F59E0B',
  },
  workoutDayIconNormal: {
    backgroundColor: '#E5E7EB',
  },
  workoutDayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  workoutDaySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  exercisesList: {
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  exerciseItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  exerciseNote: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  exerciseNoteText: {
    fontSize: 12,
    color: '#92400E',
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  exerciseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exerciseMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  exerciseMetaBold: {
    fontWeight: '700',
    color: '#111827',
  },
  progressCard: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    width: '25%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  actionButtons: {
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D7D6D',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: '#0D7D6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  warningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  warningButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginTop: 16,
  },
  tipsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
