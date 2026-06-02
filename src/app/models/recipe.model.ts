export interface Recipe {
  id: string;
  title: string;
  description?: string | null;
  image_url: string | null;
  difficulty_level: string | null;
  duration_minutes: number | null;
  category: string | null;
  area: string | null;
  tags: string[] | null;
  roadmap_category_titles: string[];
  youtube_url?: string | null;
  source_url?: string | null;
}

export interface RecipeListResponse {
  items: Recipe[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RecipeDeletePreview {
  recipe_ingredients: number;
  steps: number;
  step_ingredients: number;
  step_items: number;
  roadmap_nodes: number;
}

// ── Detailed types for recipe edit page ──

export interface IngredientRef {
  id: string;
  name: string;
  default_unit: string | null;
}

export interface ItemRef {
  id: string;
  name: string;
  tag: string;
}

export interface RecipeIngredientDetail {
  id?: string;
  ingredient: IngredientRef;
  amount: number | null;
  unit: string | null;
  sort_order: number;
}

export interface StepIngredientDetail {
  id?: string;
  ingredient: IngredientRef;
  amount: number | null;
  unit: string | null;
  actions: string[];
}

export interface StepItemDetail {
  id?: string;
  item: ItemRef;
}

export interface RecipeStepDetail {
  id?: string;
  step_number: number;
  instruction: string;
  duration_seconds: number | null;
  ingredients: StepIngredientDetail[];
  items: StepItemDetail[];
}

export interface RecipeDetail extends Recipe {
  ingredients: RecipeIngredientDetail[];
  steps: RecipeStepDetail[];
}

// ── Update payloads ──

export interface RecipeIngredientUpdate {
  ingredient_id: string;
  amount: number | null;
  unit: string | null;
  sort_order: number;
}

export interface StepIngredientUpdate {
  ingredient_id: string;
  amount: number | null;
  unit: string | null;
  actions: string[];
}

export interface StepItemUpdate {
  item_id: string;
}

export interface RecipeStepUpdate {
  step_number: number;
  instruction: string;
  duration_seconds: number | null;
  ingredients: StepIngredientUpdate[];
  items: StepItemUpdate[];
}

export interface RecipeFullUpdate {
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  difficulty_level?: string | null;
  duration_minutes?: number | null;
  youtube_url?: string | null;
  tags?: string[] | null;
  category?: string | null;
  area?: string | null;
  source_url?: string | null;
  ingredients: RecipeIngredientUpdate[];
  steps: RecipeStepUpdate[];
}
