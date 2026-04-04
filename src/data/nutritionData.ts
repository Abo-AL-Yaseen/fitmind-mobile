export const mealPlan = {
  targetCalories: 2000,
  targetProtein: 150,
  targetCarbs: 200,
  targetFat: 65,
  meals: [
    {
      type: "Breakfast",
      icon: "Coffee",
      gradient: "from-orange-400 to-amber-400",
      bg: "#FFF7ED",
      iconColor: "#F97316",
      time: "8:00 AM",
      items: [
        { name: "Oatmeal with berries", calories: 250, protein: 8, carbs: 45, fat: 5 },
        { name: "Scrambled eggs (3 eggs)", calories: 210, protein: 18, carbs: 2, fat: 14 },
        { name: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0 },
      ],
    },
    {
      type: "Lunch",
      icon: "Sun",
      gradient: "from-yellow-400 to-orange-300",
      bg: "#FEF9C3",
      iconColor: "#CA8A04",
      time: "1:00 PM",
      items: [
        { name: "Grilled chicken breast (200g)", calories: 330, protein: 62, carbs: 0, fat: 7 },
        { name: "Brown rice (1 cup)", calories: 215, protein: 5, carbs: 45, fat: 2 },
        { name: "Mixed vegetables", calories: 80, protein: 4, carbs: 15, fat: 1 },
      ],
    },
    {
      type: "Snack",
      icon: "Cookie",
      gradient: "from-pink-400 to-rose-400",
      bg: "#FCE7F3",
      iconColor: "#EC4899",
      time: "4:00 PM",
      items: [
        { name: "Greek yogurt", calories: 130, protein: 20, carbs: 9, fat: 3 },
        { name: "Almonds (30g)", calories: 170, protein: 6, carbs: 6, fat: 15 },
      ],
    },
    {
      type: "Dinner",
      icon: "Moon",
      gradient: "from-purple-500 to-purple-400",
      bg: "#F3E8FF",
      iconColor: "#A855F7",
      time: "7:00 PM",
      items: [
        { name: "Salmon fillet (200g)", calories: 410, protein: 50, carbs: 0, fat: 24 },
        { name: "Sweet potato", calories: 180, protein: 4, carbs: 41, fat: 0 },
        { name: "Steamed broccoli", calories: 55, protein: 4, carbs: 11, fat: 1 },
      ],
    },
  ],
};
