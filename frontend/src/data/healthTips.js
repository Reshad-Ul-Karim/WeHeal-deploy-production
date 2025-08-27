// Health tips data for patient dashboard
export const healthTips = [
  {
    id: 1,
    title: "Stay Hydrated",
    tip: "Drink at least 8 glasses of water daily to maintain proper hydration and support kidney function.",
    icon: "💧",
    category: "Hydration"
  },
  {
    id: 2,
    title: "Regular Exercise",
    tip: "Aim for 30 minutes of moderate exercise 5 times a week to boost cardiovascular health.",
    icon: "🏃‍♂️",
    category: "Fitness"
  },
  {
    id: 3,
    title: "Balanced Diet",
    tip: "Include fruits, vegetables, whole grains, and lean proteins in your daily meals.",
    icon: "🥗",
    category: "Nutrition"
  },
  {
    id: 4,
    title: "Quality Sleep",
    tip: "Get 7-9 hours of quality sleep each night for optimal mental and physical health.",
    icon: "😴",
    category: "Sleep"
  },
  {
    id: 5,
    title: "Regular Check-ups",
    tip: "Schedule annual health screenings and follow up with your healthcare provider regularly.",
    icon: "🩺",
    category: "Prevention"
  },
  {
    id: 6,
    title: "Stress Management",
    tip: "Practice meditation, deep breathing, or yoga to manage stress and improve mental well-being.",
    icon: "🧘‍♀️",
    category: "Mental Health"
  },
  {
    id: 7,
    title: "Hand Hygiene",
    tip: "Wash your hands frequently with soap for at least 20 seconds to prevent infections.",
    icon: "🧼",
    category: "Hygiene"
  },
  {
    id: 8,
    title: "Limit Screen Time",
    tip: "Take regular breaks from screens and practice the 20-20-20 rule to protect your eyes.",
    icon: "👀",
    category: "Eye Health"
  },
  {
    id: 9,
    title: "Vitamin D",
    tip: "Get some sunlight exposure or take vitamin D supplements to support bone health.",
    icon: "☀️",
    category: "Vitamins"
  },
  {
    id: 10,
    title: "Limit Processed Foods",
    tip: "Reduce intake of processed foods and added sugars to maintain a healthy weight.",
    icon: "🚫",
    category: "Nutrition"
  },
  {
    id: 11,
    title: "Stay Social",
    tip: "Maintain social connections and relationships to support mental and emotional health.",
    icon: "👥",
    category: "Mental Health"
  },
  {
    id: 12,
    title: "Posture Awareness",
    tip: "Maintain good posture while sitting and standing to prevent back and neck pain.",
    icon: "🧍‍♂️",
    category: "Posture"
  },
  {
    id: 13,
    title: "Dental Care",
    tip: "Brush teeth twice daily and floss regularly to maintain oral health.",
    icon: "🦷",
    category: "Dental"
  },
  {
    id: 14,
    title: "Deep Breathing",
    tip: "Practice deep breathing exercises to reduce anxiety and improve lung capacity.",
    icon: "🫁",
    category: "Breathing"
  },
  {
    id: 15,
    title: "Healthy Snacking",
    tip: "Choose nuts, fruits, or yogurt instead of processed snacks for better nutrition.",
    icon: "🥜",
    category: "Nutrition"
  },
  {
    id: 16,
    title: "Regular Stretching",
    tip: "Stretch your muscles daily to improve flexibility and reduce injury risk.",
    icon: "🤸‍♀️",
    category: "Flexibility"
  },
  {
    id: 17,
    title: "Heart Health",
    tip: "Monitor your blood pressure regularly and maintain a heart-healthy lifestyle.",
    icon: "❤️",
    category: "Cardiovascular"
  },
  {
    id: 18,
    title: "Mindful Eating",
    tip: "Eat slowly and mindfully to improve digestion and prevent overeating.",
    icon: "🍽️",
    category: "Mindfulness"
  },
  {
    id: 19,
    title: "Stay Active",
    tip: "Take the stairs instead of elevators and park farther away to increase daily activity.",
    icon: "🚶‍♂️",
    category: "Activity"
  },
  {
    id: 20,
    title: "Mental Stimulation",
    tip: "Read books, solve puzzles, or learn new skills to keep your brain active and healthy.",
    icon: "🧠",
    category: "Brain Health"
  }
];

// Function to get a random health tip
export const getRandomHealthTip = () => {
  const randomIndex = Math.floor(Math.random() * healthTips.length);
  return healthTips[randomIndex];
};

// Function to get multiple random health tips
export const getRandomHealthTips = (count = 3) => {
  const shuffled = [...healthTips].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
