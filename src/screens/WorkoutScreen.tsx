import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Play, CheckCircle, Info, AlertCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react-native';
import { workoutPlan, levelColors } from '../data/workoutData';
import { AITipCard } from '../components/AITipCard';

export default function WorkoutScreen() {
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [expandedDay, setExpandedDay] = useState<string | null>("Monday");

  const handleMarkComplete = (dayTitle: string, exerciseName: string) => {
    const key = `${dayTitle}-${exerciseName}`;
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      newSet.has(key) ? newSet.delete(key) : newSet.add(key);
      return newSet;
    });
  };

  const isCompleted = (dayTitle: string, exerciseName: string) =>
    completedExercises.has(`${dayTitle}-${exerciseName}`);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Smart Workout Plan</Text>
          <Text style={styles.headerSubtitle}>Your personalized weekly schedule</Text>
        </View>

        {/* AI Tip */}
        <AITipCard
          title="AI Tip"
          text="Great progress! Consider increasing weight on bench press by 5 lbs next week."
        />

        {/* Weekly Schedule */}
        {workoutPlan.map((day, index) => (
          <View
            key={index}
            style={[
              styles.dayCard,
              day.isToday && styles.dayCardToday
            ]}
          >
            <TouchableOpacity
              style={styles.dayHeader}
              onPress={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
              activeOpacity={0.7}
            >
              <View style={styles.dayLeft}>
                {day.isToday && <View style={styles.todayIndicator} />}
                <View>
                  <View style={styles.dayTitleRow}>
                    <Text style={[styles.dayTitle, day.isToday && styles.dayTitleToday]}>
                      {day.day}
                    </Text>
                    {day.isToday && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>Today</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.daySubtitle}>{day.title}</Text>
                </View>
              </View>
              <View style={styles.dayRight}>
                {day.exercises.length > 0 && (
                  <View style={styles.progressBadge}>
                    <Text style={styles.progressBadgeText}>
                      {day.completed}/{day.exercises.length}
                    </Text>
                  </View>
                )}
                {expandedDay === day.day ? (
                  <ChevronUp color="#9CA3AF" size={18} />
                ) : (
                  <ChevronDown color="#9CA3AF" size={18} />
                )}
              </View>
            </TouchableOpacity>

            {expandedDay === day.day && (
              <View style={styles.dayContent}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: day.exercises.length > 0 ? `${(day.completed / day.exercises.length) * 100}%` : '0%' }
                    ]}
                  />
                </View>

                {day.exercises.length === 0 ? (
                  <View style={styles.restDay}>
                    <Text style={styles.restDayEmoji}>🧘</Text>
                    <Text style={styles.restDayText}>Rest day — let your muscles recover!</Text>
                  </View>
                ) : (
                  <View style={styles.exercisesList}>
                    {day.exercises.map((exercise, exIndex) => {
                      const completed = isCompleted(day.title, exercise.name);
                      const levelStyle = levelColors[exercise.level] || levelColors['Beginner'];

                      return (
                        <View
                          key={exIndex}
                          style={[
                            styles.exerciseItem,
                            completed && styles.exerciseItemCompleted
                          ]}
                        >
                          <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
                          <View style={styles.exerciseContent}>
                            <View style={styles.exerciseHeader}>
                              <Text style={styles.exerciseName} numberOfLines={1}>
                                {exercise.name}
                              </Text>
                              <View style={[
                                styles.levelBadge,
                                { backgroundColor: levelStyle.bg, borderColor: levelStyle.border }
                              ]}>
                                <Text style={[styles.levelBadgeText, { color: levelStyle.text }]}>
                                  {exercise.level}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.exerciseSets}>{exercise.sets}</Text>
                          </View>
                          <View style={styles.exerciseActions}>
                            <TouchableOpacity
                              style={styles.playButton}
                              onPress={() => setSelectedExercise(exercise)}
                              activeOpacity={0.7}
                            >
                              <Play color="#0D7D6D" size={14} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.checkButton,
                                completed && styles.checkButtonCompleted
                              ]}
                              onPress={() => handleMarkComplete(day.title, exercise.name)}
                              activeOpacity={0.7}
                            >
                              <CheckCircle
                                color={completed ? "#FFFFFF" : "#D1D5DB"}
                                size={14}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Exercise Detail Modal */}
      <Modal
        visible={selectedExercise !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedExercise(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedExercise(null)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedExercise && (
              <>
                <Text style={styles.modalEmoji}>{selectedExercise.emoji}</Text>
                <Text style={styles.modalTitle}>{selectedExercise.name}</Text>
                <Text style={styles.modalSets}>{selectedExercise.sets}</Text>

                <View style={styles.modalInfo}>
                  <View style={styles.infoSection}>
                    <View style={styles.infoHeader}>
                      <Info color="#0D7D6D" size={16} />
                      <Text style={styles.infoTitle}>Correct Form</Text>
                    </View>
                    <Text style={styles.infoText}>{selectedExercise.instructions}</Text>
                  </View>

                  <View style={styles.warningSection}>
                    <View style={styles.warningHeader}>
                      <AlertCircle color="#F97316" size={16} />
                      <Text style={styles.warningTitle}>Common Mistakes</Text>
                    </View>
                    <Text style={styles.warningText}>{selectedExercise.mistakes}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.gotItButton}
                    onPress={() => setSelectedExercise(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.gotItButtonText}>Got it!</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  },
  header: {
    backgroundColor: '#0D7D6D',
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    marginTop: 16,
  },
  dayCardToday: {
    borderColor: 'rgba(13, 125, 109, 0.25)',
    shadowColor: '#0D7D6D',
    shadowOpacity: 0.1,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  todayIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0D7D6D',
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  dayTitleToday: {
    color: '#0D7D6D',
  },
  todayBadge: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  todayBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0D7D6D',
  },
  daySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  dayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  progressBar: {
    height: 4,
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0D7D6D',
    borderRadius: 2,
  },
  restDay: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  restDayEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  restDayText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  exercisesList: {
    gap: 8,
    paddingTop: 4,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#F9FAFB',
  },
  exerciseItemCompleted: {
    backgroundColor: '#E6F4F1',
    borderColor: 'rgba(13, 125, 109, 0.3)',
  },
  exerciseEmoji: {
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  exerciseSets: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 125, 109, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: '#0D7D6D',
    borderColor: '#0D7D6D',
    shadowColor: '#0D7D6D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalEmoji: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  modalSets: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  modalInfo: {
    marginTop: 16,
    gap: 16,
  },
  infoSection: {
    backgroundColor: '#E6F4F1',
    borderRadius: 16,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D7D6D',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  warningSection: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA580C',
  },
  warningText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  gotItButton: {
    backgroundColor: '#0D7D6D',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D7D6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  gotItButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
