import { getUserId } from './auth';
import { apiFetch } from './api';

export type NutritionGoalOption =
  | 'balanced'
  | 'higher_protein'
  | 'lower_carb'
  | 'lower_fat'
  | string;

export interface FoodDetails {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size?: string | null;
  general_nutrition_id?: number | null;
}

export interface NutritionFoodItemRow {
  id: number;
  nutrition_version_id: number;
  nutrition_id: number;
  quantity: string;
  meal_type: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface NutritionVersionRow {
  id: number;
  user_nutrition_plan_id: number;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  is_active: string;
  reason?: string | null;
}

export interface UserNutritionPlanRow {
  id: number;
  name: string;
  user_id: number;
  start_date?: string | null;
  end_date?: string | null;
  goal_type?: string | null;
  active?: string | null;
}

export interface NutritionMealItem {
  id: number;
  nutrition_version_id: number;
  nutrition_id: number;
  quantity: string;
  meal_type: string;
  food?: FoodDetails | null;
}

export interface NutritionPlanVersion {
  id: number;
  name: string;
  user_id: number;
  start_date?: string | null;
  end_date?: string | null;
  goal_type?: string | null;
  active?: string | null;
  version_id: number;
  version_reason?: string | null;
  version_status?: string | null;
  total_daily: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  food_items: NutritionMealItem[];
}

export interface GenerateNutritionPlanResponse {
  data?: any;
  modification_request_id?: number;
  message?: string;
}

export interface ModifyNutritionPlanPayload {
  current_plan_id: string;
  user_feedback: {
    goal: NutritionGoalOption;
    disliked_foods: string[];
    liked_foods: string[];
    notes: string;
  };
}

export interface ModifyNutritionPlanResponse {
  data?: any;
  modification_request_id?: number;
  message?: string;
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

function normalizeFood(raw: any): FoodDetails {
  return {
    id: toNumber(raw?.id),
    name: String(raw?.name ?? 'Food'),
    calories: toNumber(raw?.calories),
    protein: toNumber(raw?.protein),
    carbs: toNumber(raw?.carbs),
    fat: toNumber(raw?.fat),
    serving_size: raw?.serving_size ?? null,
    general_nutrition_id: raw?.general_nutrition_id
      ? toNumber(raw.general_nutrition_id)
      : null,
  };
}

function normalizeNutritionFoodItem(raw: any): NutritionFoodItemRow {
  return {
    id: toNumber(raw?.id),
    nutrition_version_id: toNumber(raw?.nutrition_version_id),
    nutrition_id: toNumber(raw?.nutrition_id ?? raw?.food_id),
    quantity: String(raw?.quantity ?? '1'),
    meal_type: String(raw?.meal_type ?? 'snack'),
    created_at: raw?.created_at ?? null,
    updated_at: raw?.updated_at ?? null,
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
    is_active: String(raw?.is_active ?? ''),
    reason: raw?.reason ?? null,
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

async function getFoodsMap(): Promise<Map<number, FoodDetails>> {
  const map = new Map<number, FoodDetails>();

  let currentPage = 1;
  let lastPage = 1;

  do {
    const response = await apiFetch<any>(`/foods?page=${currentPage}`, { method: 'GET' });

    const foodsRaw: any[] = Array.isArray(response?.data) ? response.data : [];

    foodsRaw.forEach((item: any) => {
      const food = normalizeFood(item);
      if (food.id) {
        map.set(food.id, food);
      }
    });

    const metaCurrentPage = Number(response?.meta?.current_page ?? currentPage);
    const metaLastPage = Number(response?.meta?.last_page ?? metaCurrentPage);

    currentPage = metaCurrentPage + 1;
    lastPage = metaLastPage;
  } while (currentPage <= lastPage);

  return map;
}

export async function getUserNutritionPlans(): Promise<UserNutritionPlanRow[]> {
  const response = await apiFetch<any>('/user-nutrition-plans', { method: 'GET' });
  return toArray<any>(response).map(normalizeUserNutritionPlan);
}

export async function getUserNutritionPlanById(
  id: number | string
): Promise<UserNutritionPlanRow | null> {
  const response = await apiFetch<any>(`/user-nutrition-plans/${id}`, { method: 'GET' });
  const row = toObject<any>(response);
  return row ? normalizeUserNutritionPlan(row) : null;
}

export async function getNutritionVersions(): Promise<NutritionVersionRow[]> {
  const response = await apiFetch<any>('/nutrition-versions', { method: 'GET' });
  return toArray<any>(response).map(normalizeNutritionVersion);
}

export async function getNutritionVersionById(
  id: number | string
): Promise<NutritionVersionRow | null> {
  const response = await apiFetch<any>(`/nutrition-versions/${id}`, { method: 'GET' });
  const row = toObject<any>(response);
  return row ? normalizeNutritionVersion(row) : null;
}

export async function getNutritionFoodItems(): Promise<NutritionFoodItemRow[]> {
  const response = await apiFetch<any>('/nutrition-food-items', { method: 'GET' });
  return toArray<any>(response).map(normalizeNutritionFoodItem);
}

export async function getNutritionFoodItemById(
  id: number | string
): Promise<NutritionFoodItemRow | null> {
  const response = await apiFetch<any>(`/nutrition-food-items/${id}`, { method: 'GET' });
  const row = toObject<any>(response);
  return row ? normalizeNutritionFoodItem(row) : null;
}

export async function getLatestAcceptedNutritionPlan(): Promise<NutritionPlanVersion | null> {
  const userIdRaw = await getUserId();
  const userId = Number(userIdRaw);

  if (!userId) {
    throw new Error('Could not determine the current user ID.');
  }

  const [plans, versions, foodItems, foodsMap] = await Promise.all([
    getUserNutritionPlans(),
    getNutritionVersions(),
    getNutritionFoodItems(),
    getFoodsMap(),
  ]);

  const userPlans = plans
    .filter((plan) => plan.user_id === userId)
    .sort((a, b) => b.id - a.id);

  if (!userPlans.length) {
    return null;
  }

  const activePlan =
    userPlans.find((plan) => String(plan.active ?? '').toLowerCase() === 'active') ??
    userPlans[0];

  const planVersions = versions
    .filter((version) => version.user_nutrition_plan_id === activePlan.id)
    .sort((a, b) => b.id - a.id);

  const activeVersion =
    planVersions.find((version) => String(version.is_active ?? '').toLowerCase() === 'active') ??
    planVersions[0];

  if (!activeVersion) {
    return null;
  }

  const versionFoodItems = foodItems
    .filter((item) => item.nutrition_version_id === activeVersion.id)
    .map((item) => {
      const mappedFood = foodsMap.get(item.nutrition_id);

      return {
        id: item.id,
        nutrition_version_id: item.nutrition_version_id,
        nutrition_id: item.nutrition_id,
        quantity: item.quantity,
        meal_type: item.meal_type,
        food:
          mappedFood ??
          ({
            id: item.nutrition_id,
            name: 'Food',
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          } as FoodDetails),
      };
    });

  return {
    id: activePlan.id,
    name: activePlan.name,
    user_id: activePlan.user_id,
    start_date: activePlan.start_date,
    end_date: activePlan.end_date,
    goal_type: activePlan.goal_type,
    active: activePlan.active,
    version_id: activeVersion.id,
    version_reason: activeVersion.reason ?? '',
    total_daily: {
      calories: versionFoodItems.reduce(
        (sum, item) => sum + Number(item.food?.calories ?? 0) * Number(item.quantity ?? 1),
        0
      ),
      protein: versionFoodItems.reduce(
        (sum, item) => sum + Number(item.food?.protein ?? 0) * Number(item.quantity ?? 1),
        0
      ),
      carbs: versionFoodItems.reduce(
        (sum, item) => sum + Number(item.food?.carbs ?? 0) * Number(item.quantity ?? 1),
        0
      ),
      fat: versionFoodItems.reduce(
        (sum, item) => sum + Number(item.food?.fat ?? 0) * Number(item.quantity ?? 1),
        0
      ),
    },
    food_items: versionFoodItems,
  };
}

export async function generateNutritionPlan(): Promise<GenerateNutritionPlanResponse> {
  const userId = await getUserId();

  if (!userId) {
    throw new Error('Could not determine the current user ID.');
  }

  return apiFetch<GenerateNutritionPlanResponse>('/generate-nutrition-plan', {
    method: 'POST',
    body: JSON.stringify({
      id: String(userId),
    }),
  });
}

export async function modifyNutritionPlan(
  payload: ModifyNutritionPlanPayload
): Promise<ModifyNutritionPlanResponse> {
  const userId = await getUserId();

  if (!userId) {
    throw new Error('Could not determine the current user ID.');
  }

  return apiFetch<ModifyNutritionPlanResponse>('/modify-nutrition-plan', {
    method: 'POST',
    body: JSON.stringify({
      id: Number(userId),
      current_plan_id: Number(payload.current_plan_id),
      user_feedback: payload.user_feedback,
    }),
  });
}