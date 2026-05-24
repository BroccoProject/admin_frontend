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
