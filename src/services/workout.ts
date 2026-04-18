import { apiFetch } from './api';
import { getUserId } from './auth';

export interface WorkoutExerciseDetail {
  id: number;
  general_exercise_id?: number;
  name: string;
  difficulty_level?: string;
  video_url?: string | null;
  instructions?: string | null;
  common_mistakes?: string | null;
}

export interface WorkoutExerciseItem {
  id: number;
  program_version_id: number;
  exercise_id: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  day_number: number;
  difficulty?: string;
  exercise: WorkoutExerciseDetail;
}

export interface WorkoutPlanVersion {
  id: number;
  user_id: number;
  plan_id: number | null;
  name: string;
  level: string;
  source_type: string;
  source_id: number | null;
  is_active: string;
  user_program_id: number | null;
  exercises: WorkoutExerciseItem[];
}

export interface GenerateTrainingPlanResponse {
  message?: string;
  success?: boolean;
  data?: unknown;
}

export interface ModifyTrainingPlanPayload {
  id: number;
  current_plan_id: string;
  user_feedback: {
    pain_areas: string[];
    difficulty: 'too_easy' | 'good' | 'too_hard';
    disliked_exercises: string[];
    liked_exercises: string[];
    modification_request: string;
  };
}

export interface ModifyTrainingPlanResponse {
  message?: string;
  success?: boolean;
  data?: unknown;
}

type ProgramVersionsApiResponse =
  | {
      success?: boolean;
      data?: WorkoutPlanVersion[] | WorkoutPlanVersion | null;
    }
  | WorkoutPlanVersion[]
  | WorkoutPlanVersion;

function normalizeProgramVersionsResponse(
  response: ProgramVersionsApiResponse
): WorkoutPlanVersion[] {
  if (Array.isArray(response)) return response;

  if (response && typeof response === 'object' && 'data' in response) {
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data) return [data];
    return [];
  }

  if (response && typeof response === 'object') {
    return [response as WorkoutPlanVersion];
  }

  return [];
}

function sortExercisesByDayAndOrder(exercises: WorkoutExerciseItem[]) {
  return [...exercises].sort((a, b) => {
    if (a.day_number !== b.day_number) return a.day_number - b.day_number;
    return a.id - b.id;
  });
}

export async function getLatestAcceptedWorkoutPlan(): Promise<WorkoutPlanVersion | null> {
  const response = await apiFetch<ProgramVersionsApiResponse>('/program-versions', {
    method: 'GET',
  });

  const versions = normalizeProgramVersionsResponse(response);

  const accepted = versions
    .filter((item) => String(item.is_active).toLowerCase() === 'accepted')
    .sort((a, b) => b.id - a.id);

  if (!accepted.length) return null;

  const latest = accepted[0];

  const detailsResponse = await apiFetch<{
    success?: boolean;
    data?: WorkoutPlanVersion;
  }>(`/program-versions/${latest.id}`, {
    method: 'GET',
  });

  const detailedPlan = detailsResponse?.data ?? latest;

  return {
    ...detailedPlan,
    exercises: sortExercisesByDayAndOrder(detailedPlan.exercises ?? []),
  };
}

export async function generateTrainingPlan(): Promise<GenerateTrainingPlanResponse> {
  const userId = await getUserId();

  if (!userId) {
    throw new Error('User ID not found. Please login again.');
  }

  return apiFetch<GenerateTrainingPlanResponse>('/generate-training-plan', {
    method: 'POST',
    body: JSON.stringify({
      id: Number(userId),
    }),
  });
}

export async function modifyTrainingPlan(
  payload: Omit<ModifyTrainingPlanPayload, 'id'>
): Promise<ModifyTrainingPlanResponse> {
  const userId = await getUserId();

  if (!userId) {
    throw new Error('User ID not found. Please login again.');
  }

  return apiFetch<ModifyTrainingPlanResponse>('/modify-training-plan', {
    method: 'POST',
    body: JSON.stringify({
      id: Number(userId),
      ...payload,
    }),
  });
}