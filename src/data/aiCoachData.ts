export const userData = {
  name: 'John Anderson',
  avatar: 'JA',
  stats: {
    weight: 82,
    height: 180,
    age: 28,
    level: 'Intermediate',
    goal: 'Fat Loss',
  },
  injury: {
    hasInjury: true,
    type: 'Knee Injury',
    affectedArea: 'Right Knee',
  },
  program: {
    name: 'Lean & Shred Program',
    duration: '4 weeks',
    daysPerWeek: 4,
    startDate: '2025-03-15',
    nextUpdate: '3 weeks',
  },
};

export const workoutPlan = [
  {
    id: 1,
    day: 'Day 1',
    focus: 'Chest & Triceps',
    completed: true,
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '8-10', rest: '90s' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: '60s' },
      { name: 'Cable Flyes', sets: 3, reps: '12-15', rest: '45s' },
      { name: 'Tricep Dips', sets: 3, reps: '10-12', rest: '60s' },
      { name: 'Overhead Tricep Extension', sets: 3, reps: '12-15', rest: '45s' },
    ],
  },
  {
    id: 2,
    day: 'Day 2',
    focus: 'Back & Biceps',
    completed: false,
    exercises: [
      { name: 'Pull-Ups', sets: 4, reps: '6-8', rest: '90s' },
      { name: 'Barbell Rows', sets: 4, reps: '8-10', rest: '90s' },
      { name: 'Lat Pulldown', sets: 3, reps: '10-12', rest: '60s' },
      { name: 'Barbell Curls', sets: 3, reps: '10-12', rest: '60s' },
      { name: 'Hammer Curls', sets: 3, reps: '12-15', rest: '45s' },
    ],
  },
  {
    id: 3,
    day: 'Day 3',
    focus: 'Legs (Modified)',
    completed: false,
    modified: true,
    exercises: [
      { name: 'Leg Press', sets: 4, reps: '10-12', rest: '90s', note: 'Light weight' },
      { name: 'Romanian Deadlifts', sets: 3, reps: '10-12', rest: '60s' },
      { name: 'Hamstring Curls', sets: 3, reps: '12-15', rest: '45s' },
      { name: 'Calf Raises', sets: 4, reps: '15-20', rest: '30s' },
    ],
  },
  {
    id: 4,
    day: 'Day 4',
    focus: 'Shoulders & Core',
    completed: false,
    exercises: [
      { name: 'Overhead Press', sets: 4, reps: '8-10', rest: '90s' },
      { name: 'Lateral Raises', sets: 3, reps: '12-15', rest: '45s' },
      { name: 'Front Raises', sets: 3, reps: '12-15', rest: '45s' },
      { name: 'Face Pulls', sets: 3, reps: '15-20', rest: '30s' },
      { name: 'Plank', sets: 3, reps: '60s', rest: '45s' },
    ],
  },
];

export const goalColors: Record<string, { bg: string; text: string; border: string }> = {
  'Fat Loss': { bg: '#FF334D', text: '#FF6B7A', border: '#FF334D' },
  'Muscle Gain': { bg: '#3B82F6', text: '#60A5FA', border: '#3B82F6' },
  'Maintenance': { bg: '#10B981', text: '#34D399', border: '#10B981' },
};
