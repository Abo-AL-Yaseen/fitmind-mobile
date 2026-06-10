import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {
  Apple,
  Coffee,
  Utensils,
  Moon,
  Cookie,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Wand2,
  Settings2,
  Info,
  X,
  CircleSlash,
  CheckCircle2,
  TriangleAlert,
  MessageSquareText,
  Goal,
} from 'lucide-react-native';
import { AITipCard } from '../components/AITipCard';
import {
  type NutritionGoalOption,
  type NutritionMealItem,
} from '../services/nutrition';
import { useLatestNutritionPlanQuery } from '../hooks/nutrition/queries/useLatestNutritionPlanQuery';
import { useGenerateNutritionPlanMutation } from '../hooks/nutrition/mutations/useGenerateNutritionPlanMutation';
import { useModifyNutritionPlanMutation } from '../hooks/nutrition/mutations/useModifyNutritionPlanMutation';
import { useTranslation } from '../i18n';

type MealGroup = {
  key: string;
  title: string;
  subtitle: string;
  items: NutritionMealItem[];
};

type AppAlertState = {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

const goalOptions: Array<{
  value: NutritionGoalOption;
  label: string;
  description: string;
}> = [
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Keep the plan generally balanced.',
  },
  {
    value: 'higher_protein',
    label: 'Higher Protein',
    description: 'Increase protein focus for muscle support.',
  },
  {
    value: 'lower_carb',
    label: 'Lower Carb',
    description: 'Reduce overall carbohydrate intake.',
  },
  {
    value: 'lower_fat',
    label: 'Lower Fat',
    description: 'Reduce overall fat intake.',
  },
];

function prettifyApiError(message?: string) {
  const raw = String(message || '').trim();

  if (!raw) {
    return 'Something went wrong. Please try again.';
  }

  const lower = raw.toLowerCase();

  if (
    lower.includes('maximum execution time') ||
    lower.includes('timed out') ||
    lower.includes('timeout')
  ) {
    return 'The AI nutrition request took too long on the server. The mobile screen is fine, but the backend needs a higher timeout or faster response.';
  }

  if (lower.includes('failed to fetch') || lower.includes('network request failed')) {
    return 'Could not reach the server. Make sure the backend is running and the phone can access it.';
  }

  return raw;
}

function normalizeMealType(mealType?: string) {
  return String(mealType ?? 'snack').trim().toLowerCase();
}

function getMealMeta(mealType?: string) {
  const key = normalizeMealType(mealType);

  if (key === 'breakfast') {
    return {
      key,
      title: 'Breakfast',
      subtitle: 'Start your day right',
      icon: Coffee,
      bg: '#FEF3C7',
      iconColor: '#D97706',
    };
  }

  if (key === 'lunch') {
    return {
      key,
      title: 'Lunch',
      subtitle: 'Midday fuel',
      icon: Utensils,
      bg: '#DBEAFE',
      iconColor: '#2563EB',
    };
  }

  if (key === 'dinner') {
    return {
      key,
      title: 'Dinner',
      subtitle: 'Evening recovery',
      icon: Moon,
      bg: '#EDE9FE',
      iconColor: '#7C3AED',
    };
  }

  return {
    key,
    title: 'Snack',
    subtitle: 'Quick boost',
    icon: Cookie,
    bg: '#FCE7F3',
    iconColor: '#DB2777',
  };
}

function getItemName(item: NutritionMealItem) {
  return item?.food?.name ?? (item as any)?.nutrition?.name ?? (item as any)?.name ?? 'Food';
}

function getItemCalories(item: NutritionMealItem) {
  return Number(item?.food?.calories ?? (item as any)?.nutrition?.calories ?? (item as any)?.calories ?? 0);
}

function getItemProtein(item: NutritionMealItem) {
  return Number(item?.food?.protein ?? (item as any)?.nutrition?.protein ?? (item as any)?.protein ?? 0);
}

function getItemCarbs(item: NutritionMealItem) {
  return Number(item?.food?.carbs ?? (item as any)?.nutrition?.carbs ?? (item as any)?.carbs ?? 0);
}

function getItemFat(item: NutritionMealItem) {
  return Number(item?.food?.fat ?? (item as any)?.nutrition?.fat ?? (item as any)?.fat ?? 0);
}

function groupFoodsByMeal(items: NutritionMealItem[]): MealGroup[] {
  const orderedMealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'snacks'];

  const map = new Map<string, NutritionMealItem[]>();

  items.forEach((item) => {
    const rawMeal = normalizeMealType(item.meal_type);
    const mealKey = rawMeal === 'snacks' ? 'snack' : rawMeal;

    if (!map.has(mealKey)) {
      map.set(mealKey, []);
    }

    map.get(mealKey)?.push(item);
  });

  return orderedMealTypes
    .map((meal) => (meal === 'snacks' ? 'snack' : meal))
    .filter((meal, index, arr) => arr.indexOf(meal) === index)
    .filter((meal) => map.has(meal))
    .map((meal) => {
      const meta = getMealMeta(meal);
      return {
        key: meta.key,
        title: meta.title,
        subtitle: meta.subtitle,
        items: map.get(meal) ?? [],
      };
    });
}

export default function NutritionScreen() {
  const { t, isRtl } = useTranslation();
  const {
    data: activePlan = null,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useLatestNutritionPlanQuery();

  const generateMutation = useGenerateNutritionPlanMutation();
  const modifyMutation = useModifyNutritionPlanMutation();

  const [expandedMeal, setExpandedMeal] = useState<string | null>('breakfast');
  const [selectedFood, setSelectedFood] = useState<NutritionMealItem | null>(null);

  const [modifyModalVisible, setModifyModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<NutritionGoalOption>('balanced');
  const [dislikedFoods, setDislikedFoods] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [appAlert, setAppAlert] = useState<AppAlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const generateLoading = generateMutation.isPending;
  const modifyLoading = modifyMutation.isPending;
  const refreshing = isRefetching && !isLoading;

  const showAppAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    setAppAlert({
      visible: true,
      title,
      message,
      type,
    });
  };

  const closeAppAlert = () => {
    setAppAlert((prev) => ({ ...prev, visible: false }));
  };

  const mealGroups = useMemo(
    () => groupFoodsByMeal(activePlan?.food_items ?? []),
    [activePlan]
  );

  useEffect(() => {
    if (isError) {
      showAppAlert(
        t('nutrition.loadFailed'),
        prettifyApiError((error as Error)?.message),
        'error'
      );
    }
  }, [isError, error, t]);

  useEffect(() => {
    if (!mealGroups.length) {
      return;
    }

    const expandedMealExists = mealGroups.some((meal) => meal.key === expandedMeal);

    if (!expandedMeal || !expandedMealExists) {
      setExpandedMeal(mealGroups[0].key);
    }
  }, [mealGroups, expandedMeal]);

  const currentFoodNames = useMemo(() => {
    const names = (activePlan?.food_items ?? [])
      .map((item) => getItemName(item).trim())
      .filter(Boolean) as string[];

    return Array.from(new Set(names));
  }, [activePlan]);

  const likedFoods = useMemo(() => {
    return currentFoodNames.filter((name) => !dislikedFoods.includes(name));
  }, [currentFoodNames, dislikedFoods]);

  const totals = useMemo(() => {
    const allItems = activePlan?.food_items ?? [];

    const calories = allItems.reduce(
      (sum, item) => sum + getItemCalories(item) * Number(item.quantity ?? 1),
      0
    );

    const protein = allItems.reduce(
      (sum, item) => sum + getItemProtein(item) * Number(item.quantity ?? 1),
      0
    );

    const carbs = allItems.reduce(
      (sum, item) => sum + getItemCarbs(item) * Number(item.quantity ?? 1),
      0
    );

    const fat = allItems.reduce(
      (sum, item) => sum + getItemFat(item) * Number(item.quantity ?? 1),
      0
    );

    return { calories, protein, carbs, fat };
  }, [activePlan]);

  const targetCalories = activePlan?.total_daily.calories ?? 0;
  const calPercent =
    targetCalories > 0 ? Math.round((totals.calories / targetCalories) * 100) : 0;

  const macros = [
    {
      label: t('nutrition.protein'),
      value: Math.round(totals.protein),
      target: Math.round(activePlan?.total_daily.protein ?? 0),
      color: '#3B82F6',
      unit: 'g',
    },
    {
      label: t('nutrition.carbs'),
      value: Math.round(totals.carbs),
      target: Math.round(activePlan?.total_daily.carbs ?? 0),
      color: '#FBBF24',
      unit: 'g',
    },
    {
      label: t('nutrition.fat'),
      value: Math.round(totals.fat),
      target: Math.round(activePlan?.total_daily.fat ?? 0),
      color: '#FB7185',
      unit: 'g',
    },
  ];

  const handleRefresh = async () => {
    await refetch();
  };

  const handleGeneratePlan = async () => {
    try {
      const response = await generateMutation.mutateAsync();

      showAppAlert(
        t('nutrition.planRequestSent'),
        response?.message || t('nutrition.planRequestText'),
        'success'
      );
    } catch (error: any) {
      showAppAlert(t('nutrition.generateFailed'), prettifyApiError(error?.message), 'error');
    }
  };

  const toggleDislikedFood = (foodName: string) => {
    setDislikedFoods((prev) =>
      prev.includes(foodName)
        ? prev.filter((item) => item !== foodName)
        : [...prev, foodName]
    );
  };

  const resetModifyForm = () => {
    setSelectedGoal('balanced');
    setDislikedFoods([]);
    setNotes('');
  };

  const handleSubmitModification = async () => {
    if (!activePlan?.version_id) {
      showAppAlert(t('nutrition.noPlan'), t('nutrition.noPlanModify'), 'info');
      return;
    }

    if (!notes.trim()) {
      showAppAlert('Missing Notes', 'Please write what you want changed in the nutrition plan.', 'info');
      return;
    }

    try {
      await modifyMutation.mutateAsync({
        current_plan_id: String(activePlan.version_id),
        user_feedback: {
          goal: selectedGoal,
          disliked_foods: dislikedFoods,
          liked_foods: likedFoods,
          notes: notes.trim(),
        },
      });

      setModifyModalVisible(false);
      resetModifyForm();

      showAppAlert(
        'Modification Sent',
        'Your nutrition modification request was sent successfully and is waiting for coach approval.',
        'success'
      );
    } catch (error: any) {
      showAppAlert(t('nutrition.modifyFailed'), prettifyApiError(error?.message), 'error');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D7D6D" />
        <Text style={styles.loadingText}>{t('nutrition.loading')}</Text>
      </View>
    );
  }

  const alertTheme =
    appAlert.type === 'success'
      ? {
          icon: <CheckCircle2 color="#0D7D6D" size={22} />,
          box: styles.customAlertSuccess,
          button: styles.customAlertButtonSuccess,
        }
      : appAlert.type === 'error'
      ? {
          icon: <TriangleAlert color="#B91C1C" size={22} />,
          box: styles.customAlertError,
          button: styles.customAlertButtonError,
        }
      : {
          icon: <Info color="#0D7D6D" size={22} />,
          box: styles.customAlertInfo,
          button: styles.customAlertButtonInfo,
        };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.headerTopRow, isRtl && styles.rowReverse]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, isRtl && styles.textRight]}>
                  {t('nutrition.smartTitle')}
                </Text>
                <Text style={[styles.headerSubtitle, isRtl && styles.textRight]}>
                  {activePlan
                    ? `${activePlan.name} • ${activePlan.goal_type ?? t('nutrition.planFallback')}`
                    : t('nutrition.noApproved')}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.refreshButton}
                activeOpacity={0.8}
                onPress={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color="#0D7D6D" />
                ) : (
                  <RefreshCw color="#0D7D6D" size={18} />
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.headerMetaRow, isRtl && styles.rowReverse]}>
              <View style={styles.headerMetaBadge}>
                <Text style={styles.headerMetaText}>
                  {t('nutrition.status')}: {activePlan?.active ?? t('nutrition.noActivePlan')}
                </Text>
              </View>
              <View style={styles.headerMetaBadge}>
                <Text style={styles.headerMetaText}>
                  {t('nutrition.meals')}: {mealGroups.length}
                </Text>
              </View>
            </View>

            <View style={[styles.headerActions, isRtl && styles.rowReverse]}>
              <TouchableOpacity
                style={[styles.primaryActionButton, generateLoading && styles.buttonDisabled]}
                activeOpacity={0.85}
                onPress={handleGeneratePlan}
                disabled={generateLoading}
              >
                {generateLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Wand2 color="#FFFFFF" size={16} />
                    <Text style={styles.primaryActionText}>{t('nutrition.generatePlan')}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryActionButton,
                  (!activePlan || modifyLoading) && styles.buttonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={() => setModifyModalVisible(true)}
                disabled={!activePlan || modifyLoading}
              >
                {modifyLoading ? (
                  <ActivityIndicator size="small" color="#0D7D6D" />
                ) : (
                  <>
                    <Settings2 color="#0D7D6D" size={16} />
                    <Text style={styles.secondaryActionText}>{t('nutrition.modifyPlan')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <View style={[styles.calorieRow, isRtl && styles.rowReverse]}>
              <View style={styles.ringContainer}>
                <View style={styles.ring}>
                  <Text style={styles.ringPercent}>{calPercent}%</Text>
                </View>
              </View>

              <View style={styles.calorieInfo}>
                <Text style={[styles.calorieLabel, isRtl && styles.textRight]}>
                  {t('nutrition.dailyCalories')}
                </Text>
                <Text style={styles.calorieValue}>{Math.round(totals.calories)}</Text>
                <Text style={styles.calorieTarget}>
                  {t('nutrition.ofKcal', {
                    value: Math.round(activePlan?.total_daily.calories ?? 0),
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.macrosGrid}>
              {macros.map((macro) => (
                <View key={macro.label} style={styles.macroCard}>
                  <Text style={styles.macroLabel}>{macro.label}</Text>
                  <View style={styles.macroBar}>
                    <View
                      style={[
                        styles.macroBarFill,
                        {
                          width: `${Math.min(
                            macro.target > 0 ? (macro.value / macro.target) * 100 : 0,
                            100
                          )}%`,
                          backgroundColor: macro.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.macroValue}>
                    {macro.value}
                    {macro.unit}
                  </Text>
                  <Text style={styles.macroTarget}>
                    / {macro.target}
                    {macro.unit}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <AITipCard
            title={t('nutrition.tipTitle')}
            text={
              activePlan
                ? t('nutrition.tipActive')
                : t('nutrition.tipInactive')
            }
          />

          {!activePlan || mealGroups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Apple color="#0D7D6D" size={28} />
              <Text style={styles.emptyTitle}>{t('nutrition.emptyTitle')}</Text>
              <Text style={styles.emptyText}>
                {t('nutrition.emptyText')}
              </Text>
            </View>
          ) : (
            mealGroups.map((meal) => {
              const meta = getMealMeta(meal.key);
              const MealIcon = meta.icon;
              const mealCalories = meal.items.reduce(
                (sum, item) => sum + getItemCalories(item) * Number(item.quantity ?? 1),
                0
              );
              const isExpanded = expandedMeal === meal.key;

              return (
                <View key={meal.key} style={styles.mealCard}>
                  <TouchableOpacity
                    style={styles.mealHeader}
                    onPress={() => setExpandedMeal(isExpanded ? null : meal.key)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.mealLeft}>
                      <View style={[styles.mealIcon, { backgroundColor: meta.bg }]}>
                        <MealIcon color={meta.iconColor} size={20} />
                      </View>

                      <View>
                        <Text style={styles.mealTitle}>{meal.title}</Text>
                        <Text style={styles.mealSubtitle}>{meal.subtitle}</Text>
                      </View>
                    </View>

                    <View style={styles.mealRight}>
                      <View style={styles.mealCaloriesBadge}>
                        <Text style={styles.mealCaloriesText}>{Math.round(mealCalories)} kcal</Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp color="#9CA3AF" size={18} />
                      ) : (
                        <ChevronDown color="#9CA3AF" size={18} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.mealContent}>
                      {meal.items.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.foodCard, isRtl && styles.rowReverse]}
                          activeOpacity={0.85}
                          onPress={() => setSelectedFood(item)}
                        >
                          <Text style={styles.foodEmoji}>🍽️</Text>

                          <View style={styles.foodContent}>
                            <View style={[styles.foodHeader, isRtl && styles.rowReverse]}>
                              <Text
                                style={[styles.foodName, isRtl && styles.textRight]}
                                numberOfLines={2}
                              >
                                {getItemName(item)}
                              </Text>

                              <View style={styles.quantityBadge}>
                                <Text style={styles.quantityBadgeText}>
                                  Qty {String(item.quantity ?? '1')}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.foodSubtitle}>
                              {Math.round(getItemCalories(item))} kcal • P{' '}
                              {Math.round(getItemProtein(item))}g • C{' '}
                              {Math.round(getItemCarbs(item))}g • F{' '}
                              {Math.round(getItemFat(item))}g
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedFood}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFood(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedFood(null)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedFood && (
              <>
                <View style={[styles.foodModalHeader, isRtl && styles.rowReverse]}>
                  <View style={styles.foodModalIconWrap}>
                    <Apple color="#0D7D6D" size={18} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.foodModalTitle, isRtl && styles.textRight]}>
                      {getItemName(selectedFood)}
                    </Text>
                    <Text style={[styles.foodModalSubtitle, isRtl && styles.textRight]}>
                      {t('nutrition.meal')}: {selectedFood.meal_type}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => setSelectedFood(null)}>
                    <X color="#6B7280" size={20} />
                  </TouchableOpacity>
                </View>

                <View style={styles.foodInfoBox}>
                  <View style={[styles.foodInfoRow, isRtl && styles.rowReverse]}>
                    <Text style={styles.foodInfoLabel}>{t('nutrition.calories')}</Text>
                    <Text style={styles.foodInfoValue}>
                      {Math.round(getItemCalories(selectedFood))} kcal
                    </Text>
                  </View>
                  <View style={[styles.foodInfoRow, isRtl && styles.rowReverse]}>
                    <Text style={styles.foodInfoLabel}>{t('nutrition.protein')}</Text>
                    <Text style={styles.foodInfoValue}>
                      {Math.round(getItemProtein(selectedFood))} g
                    </Text>
                  </View>
                  <View style={[styles.foodInfoRow, isRtl && styles.rowReverse]}>
                    <Text style={styles.foodInfoLabel}>{t('nutrition.carbs')}</Text>
                    <Text style={styles.foodInfoValue}>
                      {Math.round(getItemCarbs(selectedFood))} g
                    </Text>
                  </View>
                  <View style={[styles.foodInfoRow, isRtl && styles.rowReverse]}>
                    <Text style={styles.foodInfoLabel}>{t('nutrition.fat')}</Text>
                    <Text style={styles.foodInfoValue}>
                      {Math.round(getItemFat(selectedFood))} g
                    </Text>
                  </View>
                  <View style={[styles.foodInfoRow, isRtl && styles.rowReverse]}>
                    <Text style={styles.foodInfoLabel}>{t('nutrition.quantity')}</Text>
                    <Text style={styles.foodInfoValue}>{String(selectedFood.quantity ?? '1')}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.gotItButton}
                  onPress={() => setSelectedFood(null)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.gotItButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={modifyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModifyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModifyModalVisible(false)}
        >
          <TouchableOpacity
            style={[styles.modalContent, { maxHeight: '90%' }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modifyHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modifyTitle, isRtl && styles.textRight]}>
                  {t('nutrition.modifyTitle')}
                </Text>
                <Text style={[styles.modifySubtitle, isRtl && styles.textRight]}>
                  {t('nutrition.modifySubtitle')}
                </Text>
              </View>

              <TouchableOpacity onPress={() => setModifyModalVisible(false)}>
                <X color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modifyIntroCard}>
                <Text style={[styles.modifyIntroTitle, isRtl && styles.textRight]}>
                  {t('nutrition.payloadPreview')}
                </Text>
                <Text style={styles.modifyIntroText}>
                  current_plan_id: {activePlan?.version_id ?? 'N/A'}
                </Text>
                <Text style={styles.modifyIntroText}>
                  {t('nutrition.payloadText')}
                </Text>
              </View>

              <Text style={[styles.fieldLabel, isRtl && styles.textRight]}>
                {t('nutrition.goalAdjustment')}
              </Text>
              <Text style={[styles.fieldHelper, isRtl && styles.textRight]}>
                {t('nutrition.goalAdjustmentHelp')}
              </Text>

              <View style={styles.difficultyList}>
                {goalOptions.map((option) => {
                  const active = selectedGoal === option.value;

                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.difficultyCard, active && styles.difficultyCardActive]}
                      onPress={() => setSelectedGoal(option.value)}
                      activeOpacity={0.85}
                    >
                      <Goal size={16} color={active ? '#0D7D6D' : '#6B7280'} />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.difficultyCardTitle,
                            active && styles.difficultyCardTitleActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                        <Text style={styles.difficultyCardText}>{option.description}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, isRtl && styles.textRight]}>
                {t('nutrition.dislikedFoods')}
              </Text>
              <Text style={[styles.fieldHelper, isRtl && styles.textRight]}>
                {t('nutrition.dislikedFoodsHelp')}
              </Text>

              <View style={styles.chipsWrap}>
                {currentFoodNames.length ? (
                  currentFoodNames.map((name) => {
                    const active = dislikedFoods.includes(name);

                    return (
                      <TouchableOpacity
                        key={name}
                        style={[styles.chip, active && styles.chipDangerActive]}
                        onPress={() => toggleDislikedFood(name)}
                        activeOpacity={0.8}
                      >
                        <CircleSlash size={14} color={active ? '#B91C1C' : '#6B7280'} />
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipDangerTextActive,
                          ]}
                        >
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.helperText}>{t('nutrition.noCurrentFoods')}</Text>
                )}
              </View>

              <Text style={[styles.fieldLabel, isRtl && styles.textRight]}>
                {t('nutrition.modificationNotes')}
              </Text>
              <Text style={[styles.fieldHelper, isRtl && styles.textRight]}>
                {t('nutrition.modificationNotesHelp')}
              </Text>

              <View style={styles.requestBox}>
                <View style={styles.requestHeader}>
                  <MessageSquareText color="#0D7D6D" size={16} />
                  <Text style={styles.requestHeaderText}>{t('nutrition.yourRequest')}</Text>
                </View>

                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t('nutrition.notesPlaceholder')}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  style={styles.textArea}
                />
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>{t('nutrition.finalPayload')}</Text>
                <Text style={styles.summaryText}>
                  • current_plan_id: {activePlan?.version_id ?? 'N/A'}
                </Text>
                <Text style={styles.summaryText}>• goal: {selectedGoal}</Text>
                <Text style={styles.summaryText}>
                  • disliked_foods: {dislikedFoods.length}
                </Text>
                <Text style={styles.summaryText}>
                  • liked_foods: {likedFoods.length}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, modifyLoading && styles.buttonDisabled]}
                onPress={handleSubmitModification}
                activeOpacity={0.85}
                disabled={modifyLoading}
              >
                {modifyLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('nutrition.submitModification')}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={appAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={closeAppAlert}
      >
        <View style={styles.customAlertOverlay}>
          <View style={[styles.customAlertCard, alertTheme.box]}>
            <View style={styles.customAlertHeader}>
              <View style={styles.customAlertIconWrap}>{alertTheme.icon}</View>
              <Text style={styles.customAlertTitle}>{appAlert.title}</Text>
            </View>

            <Text style={styles.customAlertMessage}>{appAlert.message}</Text>

            <TouchableOpacity
              style={[styles.customAlertButton, alertTheme.button]}
              activeOpacity={0.85}
              onPress={closeAppAlert}
            >
              <Text style={styles.customAlertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#0D7D6D',
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  headerMetaBadge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerMetaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  primaryActionButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionText: {
    color: '#0D7D6D',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 16,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
  },
  ringPercent: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D7D6D',
  },
  calorieInfo: {
    flex: 1,
  },
  calorieLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  calorieTarget: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  macroLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  macroBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 8,
  },
  macroBarFill: {
    height: 8,
    borderRadius: 999,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  macroTarget: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyCard: {
    marginTop: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  mealIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  mealSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#6B7280',
  },
  mealRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mealCaloriesBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mealCaloriesText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  mealContent: {
    marginTop: 14,
    gap: 10,
  },
  foodCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  foodEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  foodContent: {
    flex: 1,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  foodName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  foodSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  quantityBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.42)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  foodModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  foodModalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  foodModalSubtitle: {
    marginTop: 2,
    color: '#6B7280',
    fontSize: 13,
  },
  foodInfoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 10,
  },
  foodInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  foodInfoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  gotItButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0D7D6D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gotItButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modifyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  modifyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  modifySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
  },
  modifyIntroCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 16,
  },
  modifyIntroTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  modifyIntroText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  fieldHelper: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginBottom: 10,
  },
  difficultyList: {
    gap: 10,
    marginBottom: 16,
  },
  difficultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  difficultyCardActive: {
    borderColor: '#99F6E4',
    backgroundColor: '#F0FDFA',
  },
  difficultyCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  difficultyCardTitleActive: {
    color: '#0D7D6D',
  },
  difficultyCardText: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipDangerActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  chipDangerTextActive: {
    color: '#B91C1C',
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
  },
  requestBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 16,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  requestHeaderText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  textArea: {
    minHeight: 130,
    fontSize: 14,
    color: '#111827',
    lineHeight: 21,
    padding: 0,
  },
  summaryBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginBottom: 4,
  },
  submitButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0D7D6D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  customAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.30)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  customAlertCard: {
    borderRadius: 24,
    padding: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
  },
  customAlertSuccess: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  customAlertError: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  customAlertInfo: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  customAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  customAlertIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAlertTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  customAlertMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 18,
  },
  customAlertButton: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAlertButtonSuccess: {
    backgroundColor: '#0D7D6D',
  },
  customAlertButtonError: {
    backgroundColor: '#C81E1E',
  },
  customAlertButtonInfo: {
    backgroundColor: '#2563EB',
  },
  customAlertButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
});
