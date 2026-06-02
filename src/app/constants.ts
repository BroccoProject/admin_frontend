/** Shared domain constants — single source of truth */

export const CATEGORY_AREAS = [
  'Algerian', 'American', 'Argentinian', 'Australian', 'British', 'Canadian',
  'Chinese', 'Croatian', 'Dutch', 'Egyptian', 'Filipino', 'French', 'Greek',
  'Indian', 'Irish', 'Italian', 'Jamaican', 'Japanese', 'Kenyan', 'Malaysian',
  'Mexican', 'Moroccan', 'Norwegian', 'Polish', 'Portuguese', 'Russian',
  'Saudi Arabian', 'Spanish', 'Syrian', 'Thai', 'Tunisian', 'Turkish',
  'Ukrainian', 'Uruguayan', 'Venezulan', 'Vietnamese',
] as const;

export const CATEGORY_TYPES = [
  '*', 'Beef', 'Chicken', 'Dessert', 'Lamb', 'Pork', 'Seafood', 'Side', 'Vegetarian',
] as const;

export const RECIPE_CATEGORIES = [
  'Beef', 'Breakfast', 'Chicken', 'Dessert', 'Goat', 'Lamb',
  'Miscellaneous', 'Pasta', 'Pork', 'Seafood', 'Side', 'Starter',
  'Vegan', 'Vegetarian',
] as const;

export const RECIPE_DIFFICULTIES = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Master Chef', label: 'Master Chef' },
] as const;

export const RECIPE_TAGS = [
  'Alcoholic', 'Baking', 'BBQ', 'Beans', 'Breakfast', 'Brunch',
  'Bun', 'Cake', 'Calorific', 'Caramel', 'Casserole', 'Celebration',
  'Cheap', 'Cheasy', 'Cheesy', 'Chilli', 'Chocolate', 'Christmas',
  'Curry', 'Dairy', 'DateNight', 'Desert', 'DinnerParty', 'Easter',
  'Egg', 'Eid', 'Expensive', 'Fish', 'Fresh', 'Fruity', 'Fusion',
  'Glazed', 'Greasy', 'Halloween', 'HangoverFood', 'Heavy', 'HighFat',
  'Kebab', 'Keto', 'Light', 'LowCalorie', 'LowCarbs', 'MainMeal',
  'Meat', 'Mild', 'Nutty', 'Onthego', 'Paella', 'Paleo', 'Pancake',
  'Party', 'Pasta', 'Pie', 'Pudding', 'Pulse', 'Salad', 'Sandwich',
  'Sausages', 'Savory', 'Seafood', 'Shellfish', 'SideDish', 'Snack',
  'Soup', 'Sour', 'Speciality', 'Spicy', 'Stew', 'Streetfood',
  'StrongFlavor', 'Summer', 'Sweet', 'Tart', 'Treat', 'UnHealthy',
  'Vegan', 'Vegetables', 'Vegetarian',
] as const;

export const RECIPE_STEP_ACTIONS = [
  'add', 'blend', 'chop', 'fry', 'grate', 'melt', 'mince', 'mix',
  'peel', 'roast', 'season', 'slice', 'stir', 'whisk',
] as const;
