// Grocery shopping list & pantry staples mapped to each dish

export interface GroceryItem {
  name: string;
  quantity: string;
  category: "protein" | "produce" | "dairy" | "grains" | "other";
}

export interface PantryItem {
  name: string;
  category: "oil" | "spice" | "sauce" | "staple";
}

// Per-dish grocery (fresh items the cook needs to buy)
const dishGrocery: Record<string, GroceryItem[]> = {
  "Grilled chicken": [
    { name: "Chicken breast", quantity: "500g", category: "protein" },
    { name: "Lemon", quantity: "2", category: "produce" },
    { name: "Bell peppers", quantity: "2", category: "produce" },
  ],
  "Pasta bake": [
    { name: "Penne pasta", quantity: "400g", category: "grains" },
    { name: "Mozzarella", quantity: "200g", category: "dairy" },
    { name: "Tomatoes", quantity: "4", category: "produce" },
    { name: "Heavy cream", quantity: "200ml", category: "dairy" },
  ],
  "Lentil soup": [
    { name: "Red lentils", quantity: "300g", category: "grains" },
    { name: "Carrots", quantity: "3", category: "produce" },
    { name: "Onions", quantity: "2", category: "produce" },
    { name: "Celery", quantity: "3 sticks", category: "produce" },
  ],
  "Stuffed vegetables": [
    { name: "Zucchini", quantity: "4", category: "produce" },
    { name: "Tomatoes", quantity: "4", category: "produce" },
    { name: "Minced lamb", quantity: "300g", category: "protein" },
    { name: "Rice", quantity: "200g", category: "grains" },
  ],
  "Greek salad": [
    { name: "Cucumber", quantity: "2", category: "produce" },
    { name: "Cherry tomatoes", quantity: "250g", category: "produce" },
    { name: "Feta cheese", quantity: "200g", category: "dairy" },
    { name: "Kalamata olives", quantity: "100g", category: "other" },
  ],
  "Salmon fillet": [
    { name: "Salmon fillet", quantity: "500g", category: "protein" },
    { name: "Asparagus", quantity: "1 bunch", category: "produce" },
    { name: "Lemon", quantity: "2", category: "produce" },
  ],
  "Cauliflower rice bowl": [
    { name: "Cauliflower", quantity: "1 head", category: "produce" },
    { name: "Avocado", quantity: "2", category: "produce" },
    { name: "Cherry tomatoes", quantity: "200g", category: "produce" },
  ],
  "Zucchini fritters": [
    { name: "Zucchini", quantity: "3", category: "produce" },
    { name: "Eggs", quantity: "3", category: "dairy" },
    { name: "Feta cheese", quantity: "100g", category: "dairy" },
  ],
  "Chicken salad": [
    { name: "Chicken breast", quantity: "400g", category: "protein" },
    { name: "Mixed greens", quantity: "200g", category: "produce" },
    { name: "Avocado", quantity: "1", category: "produce" },
  ],
  "Egg muffins": [
    { name: "Eggs", quantity: "8", category: "dairy" },
    { name: "Spinach", quantity: "100g", category: "produce" },
    { name: "Cheddar cheese", quantity: "100g", category: "dairy" },
  ],
  "Chicken shawarma bowl": [
    { name: "Chicken thighs", quantity: "600g", category: "protein" },
    { name: "Pickled turnips", quantity: "100g", category: "other" },
    { name: "Tomatoes", quantity: "3", category: "produce" },
    { name: "Tahini", quantity: "100ml", category: "other" },
  ],
  "Fattoush salad": [
    { name: "Romaine lettuce", quantity: "1 head", category: "produce" },
    { name: "Radishes", quantity: "4", category: "produce" },
    { name: "Pita bread", quantity: "2", category: "grains" },
    { name: "Sumac", quantity: "1 tbsp", category: "other" },
  ],
  "Kibbeh": [
    { name: "Minced lamb", quantity: "500g", category: "protein" },
    { name: "Bulgur wheat", quantity: "200g", category: "grains" },
    { name: "Onions", quantity: "2", category: "produce" },
    { name: "Pine nuts", quantity: "50g", category: "other" },
  ],
  "Hummus platter": [
    { name: "Chickpeas (canned)", quantity: "400g", category: "other" },
    { name: "Tahini", quantity: "100ml", category: "other" },
    { name: "Lemon", quantity: "2", category: "produce" },
  ],
  "Rice pilaf": [
    { name: "Basmati rice", quantity: "400g", category: "grains" },
    { name: "Chicken stock", quantity: "500ml", category: "other" },
    { name: "Vermicelli noodles", quantity: "50g", category: "grains" },
  ],
  "Grilled halloumi salad": [
    { name: "Halloumi cheese", quantity: "400g", category: "dairy" },
    { name: "Mixed greens", quantity: "200g", category: "produce" },
    { name: "Pomegranate seeds", quantity: "100g", category: "produce" },
  ],
  "Lamb kofta": [
    { name: "Minced lamb", quantity: "500g", category: "protein" },
    { name: "Parsley", quantity: "1 bunch", category: "produce" },
    { name: "Onions", quantity: "2", category: "produce" },
  ],
  "Tabbouleh bowl": [
    { name: "Bulgur wheat", quantity: "150g", category: "grains" },
    { name: "Parsley", quantity: "2 bunches", category: "produce" },
    { name: "Tomatoes", quantity: "3", category: "produce" },
    { name: "Mint", quantity: "1 bunch", category: "produce" },
  ],
  "Baked fish": [
    { name: "Sea bass", quantity: "500g", category: "protein" },
    { name: "Cherry tomatoes", quantity: "200g", category: "produce" },
    { name: "Capers", quantity: "50g", category: "other" },
  ],
  "Veggie skewers": [
    { name: "Bell peppers", quantity: "3", category: "produce" },
    { name: "Zucchini", quantity: "2", category: "produce" },
    { name: "Mushrooms", quantity: "200g", category: "produce" },
    { name: "Cherry tomatoes", quantity: "200g", category: "produce" },
  ],
  "Chicken machboos": [
    { name: "Chicken pieces", quantity: "1kg", category: "protein" },
    { name: "Basmati rice", quantity: "500g", category: "grains" },
    { name: "Tomatoes", quantity: "3", category: "produce" },
    { name: "Dried lime (loomi)", quantity: "3", category: "other" },
  ],
  "Lamb harees": [
    { name: "Lamb shoulder", quantity: "500g", category: "protein" },
    { name: "Wheat grain", quantity: "300g", category: "grains" },
    { name: "Onions", quantity: "2", category: "produce" },
  ],
  "Balaleet": [
    { name: "Vermicelli noodles", quantity: "200g", category: "grains" },
    { name: "Eggs", quantity: "4", category: "dairy" },
    { name: "Saffron", quantity: "pinch", category: "other" },
    { name: "Sugar", quantity: "50g", category: "other" },
  ],
  "Thareed": [
    { name: "Lamb pieces", quantity: "500g", category: "protein" },
    { name: "Potatoes", quantity: "3", category: "produce" },
    { name: "Flatbread (regag)", quantity: "4", category: "grains" },
    { name: "Tomatoes", quantity: "3", category: "produce" },
  ],
  "Fatayer": [
    { name: "Flour", quantity: "500g", category: "grains" },
    { name: "Spinach", quantity: "300g", category: "produce" },
    { name: "Feta cheese", quantity: "200g", category: "dairy" },
    { name: "Onions", quantity: "2", category: "produce" },
  ],
  "Grilled hammour": [
    { name: "Hammour fillet", quantity: "500g", category: "protein" },
    { name: "Lemon", quantity: "2", category: "produce" },
    { name: "Cherry tomatoes", quantity: "200g", category: "produce" },
  ],
  "Spiced chicken breast": [
    { name: "Chicken breast", quantity: "500g", category: "protein" },
    { name: "Yogurt", quantity: "200ml", category: "dairy" },
    { name: "Lemon", quantity: "1", category: "produce" },
  ],
  "Cauliflower machboos": [
    { name: "Cauliflower", quantity: "1 head", category: "produce" },
    { name: "Basmati rice", quantity: "400g", category: "grains" },
    { name: "Tomatoes", quantity: "2", category: "produce" },
  ],
  "Egg shakshuka": [
    { name: "Eggs", quantity: "6", category: "dairy" },
    { name: "Tomatoes", quantity: "5", category: "produce" },
    { name: "Bell peppers", quantity: "2", category: "produce" },
    { name: "Onions", quantity: "1", category: "produce" },
  ],
  "Mixed grill plate": [
    { name: "Lamb chops", quantity: "400g", category: "protein" },
    { name: "Chicken wings", quantity: "400g", category: "protein" },
    { name: "Bell peppers", quantity: "2", category: "produce" },
    { name: "Onions", quantity: "2", category: "produce" },
  ],
};

// Per-dish pantry (items the household should already have)
const dishPantry: Record<string, PantryItem[]> = {
  "Grilled chicken": [
    { name: "Olive oil", category: "oil" },
    { name: "Garlic powder", category: "spice" },
    { name: "Salt & pepper", category: "spice" },
    { name: "Oregano", category: "spice" },
  ],
  "Pasta bake": [
    { name: "Olive oil", category: "oil" },
    { name: "Garlic", category: "spice" },
    { name: "Salt & pepper", category: "spice" },
    { name: "Basil (dried)", category: "spice" },
  ],
  "Lentil soup": [
    { name: "Olive oil", category: "oil" },
    { name: "Cumin", category: "spice" },
    { name: "Salt & pepper", category: "spice" },
    { name: "Turmeric", category: "spice" },
  ],
  "Stuffed vegetables": [
    { name: "Olive oil", category: "oil" },
    { name: "Cinnamon", category: "spice" },
    { name: "Allspice", category: "spice" },
    { name: "Salt & pepper", category: "spice" },
  ],
  "Greek salad": [
    { name: "Extra virgin olive oil", category: "oil" },
    { name: "Dried oregano", category: "spice" },
    { name: "Red wine vinegar", category: "sauce" },
    { name: "Salt", category: "spice" },
  ],
  default: [
    { name: "Olive oil", category: "oil" },
    { name: "Salt & pepper", category: "spice" },
    { name: "Garlic", category: "spice" },
  ],
};

export function getGroceryListForMenu(meals: string[]): GroceryItem[] {
  const items: GroceryItem[] = [];
  const seen = new Set<string>();
  for (const meal of meals) {
    const groceries = dishGrocery[meal] || [];
    for (const g of groceries) {
      const key = g.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        items.push(g);
      }
    }
  }
  return items;
}

export function getPantryListForMenu(meals: string[]): PantryItem[] {
  const items: PantryItem[] = [];
  const seen = new Set<string>();
  for (const meal of meals) {
    const pantry = dishPantry[meal] || dishPantry["default"];
    for (const p of pantry) {
      const key = p.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        items.push(p);
      }
    }
  }
  return items;
}

const categoryIcons: Record<string, string> = {
  protein: "🥩",
  produce: "🥬",
  dairy: "🧀",
  grains: "🌾",
  other: "📦",
  oil: "🫒",
  spice: "🧂",
  sauce: "🫙",
  staple: "🏠",
};

export { categoryIcons };
