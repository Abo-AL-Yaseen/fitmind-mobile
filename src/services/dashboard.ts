import { apiFetch } from './api';
import { getUserId, getUserName } from './auth';

export interface ProfileRow {
  id: number;
  user_id: number;
  age: number | null;
  height: number | null;
  weight: number | null;
  gender: string | null;
  activity_level: string | null;
  preferences: string | null;
  food_allergies: string | null;
  medical_conditions: string | null;
}

export interface UserGoalRow {
  id: number;
  user_id: number;
  goal_type: string | null;
  target_weight: string | number | null;
}

export interface UserProgramRow {
  id: number;
  user_id: number;
  program_version_id: number;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
}

export interface UserNutritionPlanRow {
  id: number;
  name: string;
  user_id: number;
  start_date: string | null;
  end_date: string | null;
  goal_type: string | null;
  active: string | null;
}

export interface NutritionVersionRow {
  id: number;
  user_nutrition_plan_id: number;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  is_active: string | null;
  reason: string | null;
}

export interface NutritionFoodItemRow {
  id: number;
  nutrition_version_id: number;
  nutrition_id: number;
  quantity: string;
  meal_type: string | null;
}

export interface DashboardSummary {
  userName: string;
  heroTitle: string;
  heroGoalText: string;

  quickStats: Array<{
    icon: string;
    label: string;
    value: string;
    bg: string;
    iconColor: string;
  }>;

  todayProgress: Array<{
    label: string;
    value: string;
    progress: number;
    color: string;
  }>;

  profile: {
    age: number | null;
    height: number | null;
    weight: number | null;
    activityLevel: string | null;
  };

  activeWorkoutPlansCount: number;
  activeNutritionPlanName: string;
  activeNutritionGoal: string;
  nutritionVersionId: number | null;
  mealItemsCount: number;
  distinctMealTypesCount: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

function toArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value as T[];
  if (Array.isArray(value?.data)) return value.data as T[];
  if (Array.isArray(value?.data?.data)) return value.data.data as T[];
  return [];
}

function toObject<T>(value: any): T | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (value.data && typeof value.data === 'object' && !Array.isArray(value.data)) {
      return value.data as T;
    }
    return value as T;
  }
  return null;
}

function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeGoalLabel(value: string | null | undefined): string {
  if (!value) return 'No Goal';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function calculateRemainingDays(endDate: string | null | undefined): number {
  if (!endDate) return 0;

  const end = new Date(endDate);
  const today = new Date();

  if (Number.isNaN(end.getTime())) return 0;

  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

function normalizeProfile(raw: any): ProfileRow {
  return {
    id: toNumber(raw?.id),
    user_id: toNumber(raw?.user_id),
    age: raw?.age != null ? toNumber(raw.age) : null,
    height: raw?.height != null ? toNumber(raw.height) : null,
    weight: raw?.weight != null ? toNumber(raw.weight) : null,
    gender: raw?.gender ?? null,
    activity_level: raw?.activity_level ?? null,
    preferences: raw?.preferences ?? null,
    food_allergies: raw?.food_allergies ?? null,
    medical_conditions: raw?.medical_conditions ?? null,
  };
}

function normalizeUserGoal(raw: any): UserGoalRow {
  return {
    id: toNumber(raw?.id),
    user_id: toNumber(raw?.user_id),
    goal_type: raw?.goal_type ?? null,
    target_weight: raw?.target_weight ?? null,
  };
}

function normalizeUserProgram(raw: any): UserProgramRow {
  return {
    id: toNumber(raw?.id),
    user_id: toNumber(raw?.user_id),
    program_version_id: toNumber(raw?.program_version_id),
    start_date: raw?.start_date ?? null,
    end_date: raw?.end_date ?? null,
    status: raw?.status ?? null,
  };
}

function normalizeUserNutritionPlan(raw: any): UserNutritionPlanRow {
  return {
    id: toNumber(raw?.id),
    name: String(raw?.name ?? 'My Nutrition Plan'),
    user_id: toNumber(raw?.user_id),
    start_date: raw?.start_date ?? null,
    end_date: raw?.end_date ?? null,
    goal_type: raw?.goal_type ?? null,
    active: raw?.active ?? null,
  };
}

function normalizeNutritionVersion(raw: any): NutritionVersionRow {
  return {
    id: toNumber(raw?.id),
    user_nutrition_plan_id: toNumber(raw?.user_nutrition_plan_id),
    daily_calories: toNumber(raw?.daily_calories),
    daily_protein: toNumber(raw?.daily_protein),
    daily_carbs: toNumber(raw?.daily_carbs),
    daily_fat: toNumber(raw?.daily_fat),
    is_active: raw?.is_active ?? null,
    reason: raw?.reason ?? null,
  };
}

function normalizeNutritionFoodItem(raw: any): NutritionFoodItemRow {
  return {
    id: toNumber(raw?.id),
    nutrition_version_id: toNumber(raw?.nutrition_version_id),
    nutrition_id: toNumber(raw?.nutrition_id ?? raw?.food_id),
    quantity: String(raw?.quantity ?? '1'),
    meal_type: raw?.meal_type ?? null,
  };
}

export async function getProfileByUserId(userId: number): Promise<ProfileRow | null> {
  const response = await apiFetch<any>(`/profile/user/${userId}`, { method: 'GET' });
  const row = toObject<any>(response);
  return row ? normalizeProfile(row) : null;
}

export async function getUserGoals(): Promise<UserGoalRow[]> {
  const response = await apiFetch<any>('/user-goals', { method: 'GET' });
  return toArray<any>(response).map(normalizeUserGoal);
}

export async function getUserPrograms(): Promise<UserProgramRow[]> {
  const response = await apiFetch<any>('/user-programs', { method: 'GET' });
  return toArray<any>(response).map(normalizeUserProgram);
}

export async function getUserNutritionPlans(): Promise<UserNutritionPlanRow[]> {
  const response = await apiFetch<any>('/user-nutrition-plans', { method: 'GET' });
  return toArray<any>(response).map(normalizeUserNutritionPlan);
}

export async function getNutritionVersions(): Promise<NutritionVersionRow[]> {
  const response = await apiFetch<any>('/nutrition-versions', { method: 'GET' });
  return toArray<any>(response).map(normalizeNutritionVersion);
}

export async function getNutritionFoodItems(): Promise<NutritionFoodItemRow[]> {
  const response = await apiFetch<any>('/nutrition-food-items', { method: 'GET' });
  return toArray<any>(response).map(normalizeNutritionFoodItem);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const userIdRaw = await getUserId();
  const userNameRaw = await getUserName();

  const userId = Number(userIdRaw);

  if (!userId) {
    throw new Error('Could not determine the current user ID.');
  }

  const [profile, goals, programs, nutritionPlans, nutritionVersions, nutritionFoodItems] =
    await Promise.all([
      getProfileByUserId(userId),
      getUserGoals(),
      getUserPrograms(),
      getUserNutritionPlans(),
      getNutritionVersions(),
      getNutritionFoodItems(),
    ]);

  const latestGoal =
    goals
      .filter((item) => item.user_id === userId)
      .sort((a, b) => b.id - a.id)[0] ?? null;

  const userPrograms = programs.filter((item) => item.user_id === userId);
  const activeWorkoutPlans = userPrograms.filter(
    (item) => String(item.status ?? '').toLowerCase() === 'active'
  );

  const userNutritionOnly = nutritionPlans
    .filter((item) => item.user_id === userId)
    .sort((a, b) => b.id - a.id);

  const activeNutritionPlan =
    userNutritionOnly.find((item) => String(item.active ?? '').toLowerCase() === 'active') ??
    userNutritionOnly[0] ??
    null;

  const linkedVersions = nutritionVersions
    .filter((item) => item.user_nutrition_plan_id === activeNutritionPlan?.id)
    .sort((a, b) => b.id - a.id);

  const activeNutritionVersion =
    linkedVersions.find((item) => String(item.is_active ?? '').toLowerCase() === 'active') ??
    linkedVersions[0] ??
    null;

  const linkedFoodItems = nutritionFoodItems.filter(
    (item) => item.nutrition_version_id === activeNutritionVersion?.id
  );

  const distinctMealTypesCount = new Set(
    linkedFoodItems
      .map((item) => String(item.meal_type ?? '').toLowerCase())
      .filter(Boolean)
  ).size;

  const mealItemsCount = linkedFoodItems.length;
  const activeWorkoutPlansCount = activeWorkoutPlans.length;
  const targetCalories = toNumber(activeNutritionVersion?.daily_calories);
  const targetProtein = toNumber(activeNutritionVersion?.daily_protein);
  const targetCarbs = toNumber(activeNutritionVersion?.daily_carbs);
  const targetFat = toNumber(activeNutritionVersion?.daily_fat);

  const goalLabel = normalizeGoalLabel(
    activeNutritionPlan?.goal_type ?? latestGoal?.goal_type ?? null
  );

  const displayUserName =
    String(userNameRaw ?? '').trim() ||
    `User ${userId}`;

  const latestWorkoutPlan =
    activeWorkoutPlans.sort((a, b) => b.id - a.id)[0] ??
    userPrograms.sort((a, b) => b.id - a.id)[0] ??
    null;

  const workoutDaysLeft = calculateRemainingDays(latestWorkoutPlan?.end_date);
  const nutritionDaysLeft = calculateRemainingDays(activeNutritionPlan?.end_date);

  const workoutProgress = activeWorkoutPlansCount > 0 ? 100 : 0;
  const nutritionProgress = activeNutritionVersion ? 100 : 0;
  const mealsProgress = Math.min(100, Math.round((distinctMealTypesCount / 4) * 100));

  return {
    userName: displayUserName,
    heroTitle: `Welcome back, ${displayUserName}! 👋`,
    heroGoalText: activeNutritionVersion
      ? `Your focus is ${goalLabel.toLowerCase()}. You have ${activeWorkoutPlansCount} active workout plan${activeWorkoutPlansCount === 1 ? '' : 's'} and a ${targetCalories} kcal nutrition target today.`
      : `Your focus is ${goalLabel.toLowerCase()}. Keep moving and stay consistent today.`,

    quickStats: [
      {
        icon: 'Flame',
        label: 'Daily Target',
        value: targetCalories > 0 ? `${targetCalories} kcal` : 'No Target',
        bg: '#E6F4F1',
        iconColor: '#0D7D6D',
      },
      {
        icon: 'Dumbbell',
        label: 'Workout Plans',
        value: `${activeWorkoutPlansCount} Active`,
        bg: '#FFF7ED',
        iconColor: '#F59E0B',
      },
      {
        icon: 'Apple',
        label: 'Meal Items',
        value: `${mealItemsCount}`,
        bg: '#EFF6FF',
        iconColor: '#3B82F6',
      },
    ],

    todayProgress: [
      {
        label: 'Workout Plan',
        value:
          activeWorkoutPlansCount > 0
            ? `${activeWorkoutPlansCount} active · ${workoutDaysLeft} days left`
            : 'No active workout plan',
        progress: workoutProgress,
        color: '#0D7D6D',
      },
      {
        label: 'Nutrition Target',
        value:
          nutritionProgress > 0
            ? `${targetCalories} kcal · ${targetProtein}g protein`
            : 'No active nutrition version',
        progress: nutritionProgress,
        color: '#FBBF24',
      },
      {
        label: 'Meal Coverage',
        value:
          mealItemsCount > 0
            ? `${distinctMealTypesCount}/4 meal groups · ${nutritionDaysLeft} days left`
            : 'No meal items found',
        progress: mealsProgress,
        color: '#60A5FA',
      },
    ],

    profile: {
      age: profile?.age ?? null,
      height: profile?.height ?? null,
      weight: profile?.weight ?? null,
      activityLevel: profile?.activity_level ?? null,
    },

    activeWorkoutPlansCount,
    activeNutritionPlanName: activeNutritionPlan?.name ?? 'No Nutrition Plan',
    activeNutritionGoal: goalLabel,
    nutritionVersionId: activeNutritionVersion?.id ?? null,
    mealItemsCount,
    distinctMealTypesCount,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
  };
}