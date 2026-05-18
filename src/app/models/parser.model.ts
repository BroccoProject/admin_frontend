export interface RecipeIngredientDraft {
  name: string;
  amount: number;
  unit: string;
  sort_order: number;
}

export interface StepIngredientDraft {
  name: string;
  amount: number;
  unit: string;
  actions: string[];
  name_i18n: Record<string, string>;
}

export interface StepItemDraft {
  name: string;
  tag: string;
  name_i18n: Record<string, string>;
}

export interface RecipeStepDraft {
  step_number: number;
  instruction: string;
  instruction_i18n: Record<string, string>;
  duration_seconds: number | null;
  ingredients: StepIngredientDraft[];
  items: StepItemDraft[];
}

export interface RecipeDraft {
  title: string;
  description: string;
  difficulty: string;
  duration_minutes: number;
  category: string;
  area: string | null;
  tags: string[];
  source_url: string | null;
  image_url: string | null;
  youtube_url: string | null;
  ingredients: RecipeIngredientDraft[];
  steps: RecipeStepDraft[];
  title_i18n: Record<string, string>;
  description_i18n: Record<string, string>;
}

export interface ParseRequest {
  text: string;
}

export interface FeedbackRequest {
  feedback: string;
}

export interface ParseResponse {
  thread_id: string;
  status: string;
  draft: RecipeDraft;
}
