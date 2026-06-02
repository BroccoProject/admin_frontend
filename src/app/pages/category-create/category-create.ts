import {
  Component,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { RecipeService } from '../../services/recipe.service';
import { ToastService } from '../../services/toast.service';
import { Recipe } from '../../models/recipe.model';
import { CategoryCreatePayload, CategoryNodePayload } from '../../models/category.model';
import { CATEGORY_AREAS, CATEGORY_TYPES } from '../../constants';
import { GraphNode, GraphEdge } from '../../models/graph.model';
import { GraphCanvasComponent } from '../../components/graph-canvas/graph-canvas.component';

@Component({
  selector: 'app-category-create',
  standalone: true,
  imports: [CommonModule, FormsModule, GraphCanvasComponent],
  templateUrl: './category-create.html',
  styleUrl: './category-create.scss',
})
export class CategoryCreatePage implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly recipeService = inject(RecipeService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  @ViewChild(GraphCanvasComponent) graphCanvas!: GraphCanvasComponent;

  // Form State
  formData = signal<{
    title: string;
    unlock_cost_stars: number;
    category_area: string;
    category_type: string;
  }>({
    title: '',
    unlock_cost_stars: 0,
    category_area: '',
    category_type: '',
  });

  readonly availableAreas = CATEGORY_AREAS;
  readonly availableTypes = CATEGORY_TYPES;

  // Recipes State (Left Panel)
  recipes = signal<Recipe[]>([]);
  searchQuery = signal('');
  page = signal(1);
  pageSize = signal(20);
  totalPages = signal(1);
  loadingRecipes = signal(false);
  isSubmitting = signal(false);

  // Graph State
  nodes = signal<GraphNode[]>([]);
  edges = signal<GraphEdge[]>([]);

  // Grid Spacing for database map_column/map_row conversion
  private readonly GRID_CELL_WIDTH = 200;
  private readonly GRID_CELL_HEIGHT = 150;
  private readonly GRID_OFFSET_X = 100;
  private readonly GRID_OFFSET_Y = 100;

  ngOnInit(): void {
    this.loadRecipes();
  }

  // --- Recipe List Loading ---

  loadRecipes(): void {
    this.loadingRecipes.set(true);
    this.recipeService
      .getRecipes({
        page: this.page(),
        page_size: this.pageSize(),
        search: this.searchQuery() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.recipes.set(res.items);
          this.totalPages.set(res.total_pages);
          this.loadingRecipes.set(false);
        },
        error: () => {
          this.toastService.show('Failed to load recipes', 'error');
          this.loadingRecipes.set(false);
        },
      });
  }

  loadMoreRecipes(): void {
    if (this.page() >= this.totalPages() || this.loadingRecipes()) return;
    this.page.update(p => p + 1);
    this.loadingRecipes.set(true);
    this.recipeService
      .getRecipes({
        page: this.page(),
        page_size: this.pageSize(),
        search: this.searchQuery() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.recipes.update(existing => [...existing, ...res.items]);
          this.totalPages.set(res.total_pages);
          this.loadingRecipes.set(false);
        },
        error: () => {
          this.toastService.show('Failed to load recipes', 'error');
          this.loadingRecipes.set(false);
        },
      });
  }

  onRecipeScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) {
      this.loadMoreRecipes();
    }
  }

  onSearch(): void {
    this.page.set(1);
    this.loadRecipes();
  }

  openRecipeDetail(recipeId: string): void {
    window.open(`/#/recipes/${recipeId}`, '_blank');
  }

  // --- Drag and Drop from List to Canvas ---

  onDragStartRecipe(event: DragEvent, recipe: Recipe): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify({
        id: recipe.id,
        title: recipe.title
      }));
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  addRecipeToCanvas(recipe: Recipe): void {
    if (this.graphCanvas) {
      this.graphCanvas.addRecipeNode(recipe);
    }
  }

  // --- Save Logic ---

  saveCategory(): void {
    const form = this.formData();
    if (!form.title.trim()) {
      this.toastService.show('Category title is required', 'error');
      return;
    }

    this.isSubmitting.set(true);

    const payload: CategoryCreatePayload = {
      title: form.title,
      subtitle: null,
      image_url: null,
      unlock_cost_stars: form.unlock_cost_stars,
      category_area: form.category_area || null,
      category_type: form.category_type || null,
      nodes: this.serializeGraph()
    };

    this.categoryService.createCategory(payload).subscribe({
      next: () => {
        this.toastService.show('Category created successfully', 'success');
        this.router.navigate(['/categories']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.show(err?.error?.detail || 'Failed to create category', 'error');
      }
    });
  }

  private serializeGraph(): CategoryNodePayload[] {
    const result: CategoryNodePayload[] = [];
    const currentNodes = this.nodes();
    const currentEdges = this.edges();

    for (const node of currentNodes) {
      // Find dependencies (edges pointing TO this node)
      const depEdges = currentEdges.filter(e => e.toNodeId === node.id);
      
      // We map source nodes to their eventual index in the result array.
      // But result array doesn't exist yet! We must order nodes topologically, 
      // or simply rely on backend resolving by prereq IDs if we had them.
      // Since payload expects `prerequisite_indices`, we must compute an order.

      // For simplicity, just use current array order (assuming no complex topological sort needed for indices)
      const prereqIndices = depEdges.map(e => 
        currentNodes.findIndex(n => n.id === e.fromNodeId)
      ).filter(idx => idx !== -1);

      // Math.floor to convert pixel coords to map grid coords
      const col = Math.floor((node.x - this.GRID_OFFSET_X) / this.GRID_CELL_WIDTH);
      const row = Math.floor((node.y - this.GRID_OFFSET_Y) / this.GRID_CELL_HEIGHT);

      result.push({
        recipe_id: node.recipe_id,
        title: node.title,
        x: col,
        y: row,
        prerequisite_indices: prereqIndices
      });
    }
    return result;
  }

  cancel(): void {
    this.router.navigate(['/categories']);
  }
}
