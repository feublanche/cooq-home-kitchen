export interface Cook {
  id: string;
  firstName: string;
  lastInitial: string;
  cuisine: string;
  areas: string[];
  yearsExperience: number;
  rating: number | null;
  isNew: boolean;
  certified: boolean;
  bio: string;
  availableDays: number[]; // 0=Sun, 1=Mon, ...6=Sat
  menus: Menu[];
}

export interface Menu {
  id: string;
  name: string;
  meals: string[];
  addOns: string;
  pricePerVisit: number;
}

export const cooks: Cook[] = [
  {
    id: "maria-s",
    firstName: "Maria",
    lastInitial: "S",
    cuisine: "Mediterranean",
    areas: ["JBR", "Marina"],
    yearsExperience: 5,
    rating: 4.9,
    isNew: false,
    certified: true,
    bio: "Maria specialises in Mediterranean family cooking — fresh, balanced, and always labelled. She's cooked for over 40 families across JBR and Marina.",
    availableDays: [1, 3, 6], // Mon, Wed, Sat
    menus: [
      {
        id: "family-classics",
        name: "Family Classics",
        meals: ["Grilled chicken", "Pasta bake", "Lentil soup", "Stuffed vegetables", "Greek salad"],
        addOns: "Soups / Desserts / Sides",
        pricePerVisit: 350,
      },
      {
        id: "low-carb-keto",
        name: "Low-Carb Keto",
        meals: ["Salmon fillet", "Cauliflower rice bowl", "Zucchini fritters", "Chicken salad", "Egg muffins"],
        addOns: "",
        pricePerVisit: 350,
      },
    ],
  },
  {
    id: "rania-k",
    firstName: "Rania",
    lastInitial: "K",
    cuisine: "Lebanese",
    areas: ["Downtown", "Business Bay"],
    yearsExperience: 8,
    rating: 5.0,
    isNew: false,
    certified: true,
    bio: "Rania brings authentic Lebanese flavours to every kitchen she enters. With 8 years of private cooking, she's known for her mezze platters and slow-cooked stews.",
    availableDays: [0, 2, 4], // Sun, Tue, Thu
    menus: [
      {
        id: "family-classics",
        name: "Family Classics",
        meals: ["Chicken shawarma bowl", "Fattoush salad", "Kibbeh", "Hummus platter", "Rice pilaf"],
        addOns: "Soups / Desserts / Sides",
        pricePerVisit: 350,
      },
      {
        id: "low-carb-keto",
        name: "Low-Carb Keto",
        meals: ["Grilled halloumi salad", "Lamb kofta", "Tabbouleh bowl", "Baked fish", "Veggie skewers"],
        addOns: "",
        pricePerVisit: 350,
      },
    ],
  },
  {
    id: "ahmed-t",
    firstName: "Ahmed",
    lastInitial: "T",
    cuisine: "Emirati",
    areas: ["Arabian Ranches", "Jumeirah"],
    yearsExperience: 3,
    rating: null,
    isNew: true,
    certified: true,
    bio: "Ahmed is passionate about preserving traditional Emirati recipes with a modern twist. His machboos and luqaimat are family favourites across Jumeirah.",
    availableDays: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
    menus: [
      {
        id: "family-classics",
        name: "Family Classics",
        meals: ["Chicken machboos", "Lamb harees", "Balaleet", "Thareed", "Fatayer"],
        addOns: "Soups / Desserts / Sides",
        pricePerVisit: 350,
      },
      {
        id: "low-carb-keto",
        name: "Low-Carb Keto",
        meals: ["Grilled hammour", "Spiced chicken breast", "Cauliflower machboos", "Egg shakshuka", "Mixed grill plate"],
        addOns: "",
        pricePerVisit: 350,
      },
    ],
  },
];

export const getCookById = (id: string) => cooks.find((c) => c.id === id);
