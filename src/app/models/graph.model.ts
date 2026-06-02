export interface GraphNode {
  id: string; // internal UUID for graph tracking
  recipe_id: string | null;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  selected?: boolean;
}

export interface GraphEdge {
  fromNodeId: string;
  toNodeId: string;
}
