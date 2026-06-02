export interface Category {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  unlock_cost_stars: number | null;
  category_area: string | null;
  category_type: string | null;
  total_nodes: number | null;
}

export interface CategoryListResponse {
  items: Category[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CategoryDeletePreview {
  unlocked_by_users: number;
  roadmap_nodes: number;
  completed_node_records: number;
}

export interface CategoryNodePayload {
  recipe_id: string | null;
  title: string;
  x: number;
  y: number;
  prerequisite_indices: number[];
}

export interface CategoryCreatePayload {
  title: string;
  subtitle: string | null;
  image_url: string | null;
  unlock_cost_stars: number | null;
  category_area: string | null;
  category_type: string | null;
  nodes?: CategoryNodePayload[];
}

export interface CategoryNodeResponse {
  id: string;
  recipe_id: string | null;
  title: string;
  x: number;
  y: number;
  prerequisite_ids: string[];
}
