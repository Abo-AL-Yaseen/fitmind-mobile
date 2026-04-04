export const workoutPlan = [
  {
    day: "Monday",
    title: "Chest & Triceps",
    exercises: [
      { name: "Bench Press", sets: "4 sets × 8-10 reps", emoji: "🏋️", instructions: "Keep your back flat on the bench, lower the bar to your chest, and press up explosively.", mistakes: "Don't bounce the bar off your chest or arch your back excessively.", level: "Intermediate" },
      { name: "Incline Dumbbell Press", sets: "3 sets × 10-12 reps", emoji: "💪", instructions: "Set bench to 30-45 degrees, press dumbbells up while keeping control.", mistakes: "Avoid using momentum or letting dumbbells drift apart.", level: "Intermediate" },
      { name: "Cable Flyes", sets: "3 sets × 12-15 reps", emoji: "🦾", instructions: "Keep a slight bend in your elbows, bring handles together in front of chest.", mistakes: "Don't lock your elbows or use your back to swing the weight.", level: "Beginner" },
      { name: "Tricep Dips", sets: "3 sets × 10-12 reps", emoji: "🤸", instructions: "Lower yourself until elbows are at 90 degrees, push back up.", mistakes: "Don't let shoulders shrug up or go too low.", level: "Intermediate" },
      { name: "Tricep Pushdowns", sets: "3 sets × 12-15 reps", emoji: "💥", instructions: "Keep elbows locked at sides, push the bar down using only your triceps.", mistakes: "Don't move your elbows or use your shoulders.", level: "Beginner" },
    ],
    completed: 3,
    isToday: true,
  },
  {
    day: "Tuesday",
    title: "Back & Biceps",
    exercises: [
      { name: "Deadlifts", sets: "4 sets × 6-8 reps", emoji: "🏋️‍♂️", instructions: "Keep back straight, drive through heels, fully extend hips at top.", mistakes: "Don't round your back or hyperextend at the top.", level: "Advanced" },
      { name: "Pull-ups", sets: "3 sets × 8-10 reps", emoji: "🤾", instructions: "Pull yourself up until chin is over the bar, lower with control.", mistakes: "Don't swing or use momentum.", level: "Intermediate" },
    ],
    completed: 0,
    isToday: false,
  },
  {
    day: "Wednesday",
    title: "Rest & Recovery",
    exercises: [],
    completed: 0,
    isToday: false,
  },
  {
    day: "Thursday",
    title: "Legs",
    exercises: [
      { name: "Squats", sets: "4 sets × 8-10 reps", emoji: "🦵", instructions: "Keep chest up, squat down until thighs are parallel to ground.", mistakes: "Don't let knees cave in or round your back.", level: "Intermediate" },
    ],
    completed: 0,
    isToday: false,
  },
];

export const levelColors: Record<string, { bg: string; text: string; border: string }> = {
  Beginner: { bg: "#ECFDF5", text: "#10B981", border: "#A7F3D0" },
  Intermediate: { bg: "#EFF6FF", text: "#3B82F6", border: "#BFDBFE" },
  Advanced: { bg: "#FEF2F2", text: "#EF4444", border: "#FECACA" },
};
