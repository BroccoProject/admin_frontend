import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { Recipe, RecipeDeletePreview } from '../../models/recipe.model';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { DeleteModalComponent } from '../../components/delete-modal/delete-modal.component';
import { ToastService } from '../../services/toast.service';
import { HasRoleDirective } from '../../directives/has-role.directive';
import { DisabledNoRoleDirective } from '../../directives/disabled-no-role.directive';

@Component({
  selector: 'app-recipes',
  imports: [CommonModule, FormsModule, PaginationComponent, DeleteModalComponent, HasRoleDirective],
  templateUrl: './recipes.html',
  styleUrl: './recipes.scss',
})
export class RecipesPage implements OnInit {
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  recipes = signal<Recipe[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);
  searchQuery = signal('');
  sortBy = signal('title');
  sortOrder = signal<'asc' | 'desc'>('asc');
  loading = signal(false);

  showDeleteModal = signal(false);
  recipeToDelete = signal<Recipe | null>(null);
  deleting = signal(false);
  deletePreview = signal<RecipeDeletePreview | null>(null);
  previewLoading = signal(false);
  previewError = signal(false);

  blockedByRoadmap = computed(() => {
    const p = this.deletePreview();
    return p !== null && p.roadmap_nodes > 0;
  });

  ngOnInit(): void {
    this.loadRecipes();
  }

  onCreateRecipe(): void {
    this.router.navigate(['/recipes/create']);
  }

  loadRecipes(): void {
    this.loading.set(true);
    this.recipeService
      .getRecipes({
        page: this.page(),
        page_size: this.pageSize(),
        search: this.searchQuery() || undefined,
        sort_by: this.sortBy(),
        sort_order: this.sortOrder(),
      })
      .subscribe({
        next: (res) => {
          this.recipes.set(res.items);
          this.total.set(res.total);
          this.totalPages.set(res.total_pages);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toastService.show('Failed to load recipes', 'error');
        },
      });
  }

  onSearch(): void {
    this.page.set(1);
    this.loadRecipes();
  }

  onSortChange(field: string): void {
    this.sortBy.set(field);
    this.page.set(1);
    this.loadRecipes();
  }

  onEditRecipe(recipe: Recipe): void {
    this.router.navigate(['/recipes', recipe.id, 'edit']);
  }

  confirmDelete(recipe: Recipe): void {
    this.recipeToDelete.set(recipe);
    this.deletePreview.set(null);
    this.previewLoading.set(true);
    this.showDeleteModal.set(true);

    this.recipeService.getDeletePreview(recipe.id).subscribe({
      next: (preview) => {
        this.deletePreview.set(preview);
        this.previewLoading.set(false);
      },
      error: () => {
        this.previewLoading.set(false);
      },
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.recipeToDelete.set(null);
    this.deletePreview.set(null);
  }

  executeDelete(): void {
    const recipe = this.recipeToDelete();
    if (!recipe || this.blockedByRoadmap()) return;

    this.deleting.set(true);
    this.recipeService.deleteRecipe(recipe.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.recipeToDelete.set(null);
        this.deletePreview.set(null);
        this.toastService.show('Recipe deleted successfully!', 'success');
        this.loadRecipes();
      },
      error: (err) => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.recipeToDelete.set(null);
        this.deletePreview.set(null);
        const message =
          err?.error?.detail || 'An unexpected error occurred while deleting the recipe.';
        this.toastService.show(message, 'error');
      },
    });
  }

  difficultyClass(level: string | null): string {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'badge-easy';
      case 'intermediate': return 'badge-medium';
      case 'master chef': return 'badge-hard';
      default: return 'badge-neutral';
    }
  }
}
