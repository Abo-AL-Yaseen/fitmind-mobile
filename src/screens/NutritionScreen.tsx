import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Coffee, Sun, Moon, Cookie, Pencil, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react-native';
import { mealPlan } from '../data/nutritionData';
import { AITipCard } from '../components/AITipCard';

export default function NutritionScreen() {
  const [expandedMeal, setExpandedMeal] = useState<string | null>("Breakfast");
  const [editingMeal, setEditingMeal] = useState<string | null>(null);

  const iconMap: Record<string, any> = {
    Coffee,
    Sun,
    Moon,
    Cookie,
  };

  const totalConsumed = {
    calories: mealPlan.meals.reduce((acc, meal) => acc + meal.items.reduce((sum, item) => sum + item.calories, 0), 0),
    protein: mealPlan.meals.reduce((acc, meal) => acc + meal.items.reduce((sum, item) => sum + item.protein, 0), 0),
    carbs: mealPlan.meals.reduce((acc, meal) => acc + meal.items.reduce((sum, item) => sum + item.carbs, 0), 0),
    fat: mealPlan.meals.reduce((acc, meal) => acc + meal.items.reduce((sum, item) => sum + item.fat, 0), 0),
  };

  const calPercent = Math.round((totalConsumed.calories / mealPlan.targetCalories) * 100);

  const macros = [
    { label: "Protein", value: totalConsumed.protein, target: mealPlan.targetProtein, color: "#3B82F6", unit: "g" },
    { label: "Carbs", value: totalConsumed.carbs, target: mealPlan.targetCarbs, color: "#FBBF24", unit: "g" },
    { label: "Fat", value: totalConsumed.fat, target: mealPlan.targetFat, color: "#FB7185", unit: "g" },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Smart Nutrition</Text>
          <Text style={styles.headerSubtitle}>Your personalized meal plan</Text>
        </View>

        {/* Calorie Ring Card */}
        <View style={styles.card}>
          <View style={styles.calorieRow}>
            {/* Ring */}
            <View style={styles.ringContainer}>
              <View style={styles.ring}>
                <Text style={styles.ringPercent}>{calPercent}%</Text>
              </View>
            </View>
            <View style={styles.calorieInfo}>
              <Text style={styles.calorieLabel}>Daily Calories</Text>
              <Text style={styles.calorieValue}>{totalConsumed.calories}</Text>
              <Text style={styles.calorieTarget}>of {mealPlan.targetCalories} kcal</Text>
            </View>
          </View>

          {/* Macros */}
          <View style={styles.macrosGrid}>
            {macros.map((macro) => (
              <View key={macro.label} style={styles.macroCard}>
                <Text style={styles.macroLabel}>{macro.label}</Text>
                <View style={styles.macroBar}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        width: `${Math.min((macro.value / macro.target) * 100, 100)}%`,
                        backgroundColor: macro.color
                      }
                    ]}
                  />
                </View>
                <Text style={styles.macroValue}>{macro.value}{macro.unit}</Text>
                <Text style={styles.macroTarget}>/ {macro.target}{macro.unit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Tip */}
        <AITipCard
          title="AI Nutrition Tip"
          text="Your protein intake is excellent! Consider adding more leafy greens to boost micronutrient intake."
        />

        {/* Meal Plans */}
        {mealPlan.meals.map((meal, index) => {
          const MealIcon = iconMap[meal.icon];
          const mealCalories = meal.items.reduce((sum, item) => sum + item.calories, 0);
          const isExpanded = expandedMeal === meal.type;

          return (
            <View key={index} style={styles.mealCard}>
              <TouchableOpacity
                style={styles.mealHeader}
                onPress={() => setExpandedMeal(isExpanded ? null : meal.type)}
                activeOpacity={0.7}
              >
                <View style={styles.mealLeft}>
                  <View style={[styles.mealIcon, { backgroundColor: meal.bg }]}>
                    <MealIcon color={meal.iconColor} size={20} />
                  </View>
                  <View>
                    <Text style={styles.mealType}>{meal.type}</Text>
                    <Text style={styles.mealTime}>{meal.time}</Text>
                  </View>
                </View>
                <View style={styles.mealRight}>
                  <View style={styles.mealCalories}>
                    <Text style={styles.mealCaloriesText}>{mealCalories} kcal</Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp color="#9CA3AF" size={16} />
                  ) : (
                    <ChevronDown color="#9CA3AF" size={16} />
                  )}
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.mealContent}>
                  <View style={styles.mealItems}>
                    {meal.items.map((item, itemIndex) => (
                      <View key={itemIndex} style={styles.mealItem}>
                        <View style={styles.mealItemContent}>
                          <Text style={styles.mealItemName}>{item.name}</Text>
                          <View style={styles.mealItemMacros}>
                            <Text style={styles.macroProtein}>P: {item.protein}g</Text>
                            <Text style={styles.macroCarbs}>C: {item.carbs}g</Text>
                            <Text style={styles.macroFat}>F: {item.fat}g</Text>
                          </View>
                        </View>
                        <Text style={styles.mealItemCalories}>{item.calories} kcal</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.mealActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => setEditingMeal(meal.type)}
                      activeOpacity={0.7}
                    >
                      <Pencil color="#0D7D6D" size={14} />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.swapButton} activeOpacity={0.7}>
                      <RefreshCw color="#6B7280" size={14} />
                      <Text style={styles.swapButtonText}>Swap</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
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
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  ringContainer: {
    width: 96,
    height: 96,
  },
  ring: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 10,
    borderColor: '#0D7D6D',
    backgroundColor: '#F0FAF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  calorieInfo: {
    flex: 1,
  },
  calorieLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  calorieValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D7D6D',
  },
  calorieTarget: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  macroLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  macroBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  macroTarget: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  mealCard: {
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
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  mealLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  mealTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  mealRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealCalories: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  mealCaloriesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D7D6D',
  },
  mealContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  mealItems: {
    gap: 8,
    marginTop: 12,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  mealItemContent: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  mealItemMacros: {
    flexDirection: 'row',
    gap: 12,
  },
  macroProtein: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  macroCarbs: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
  },
  macroFat: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FB7185',
  },
  mealItemCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 12,
  },
  mealActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(13, 125, 109, 0.25)',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0D7D6D',
  },
  swapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  swapButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
});
