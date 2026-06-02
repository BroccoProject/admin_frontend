import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { Recipe, RecipeDeletePreview } from '../../models/recipe.model';
import { DeleteModalComponent } from '../../components/delete-modal/delete-modal.component';
import { ToastService } from '../../services/toast.service';
import { HasRoleDirective } from '../../directives/has-role.directive';
import { RouterModule } from '@angular/router';
import { RECIPE_CATEGORIES, RECIPE_DIFFICULTIES, RECIPE_TAGS } from '../../constants';

@Component({
  selector: 'app-recipes',
  imports: [CommonModule, FormsModule, RouterModule, DeleteModalComponent, HasRoleDirective],
  templateUrl: './recipes.html',
  styleUrl: './recipes.scss',
})
export class RecipesPage implements OnInit {
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  recipes = signal<Recipe[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(25);
  totalPages = signal(1);
  searchQuery = signal('');
  sortBy = signal('title');
  sortOrder = signal<'asc' | 'desc'>('asc');
  filterCategory = signal('');
  filterDifficulty = signal('');
  filterTag = signal('');
  showFiltersPanel = signal(false);
  loading = signal(false);

  availableDifficulties = RECIPE_DIFFICULTIES.map(d => d.value);
  availableCategories = [...RECIPE_CATEGORIES];
  availableTags = [...RECIPE_TAGS].slice(0, 20);

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
        category: this.filterCategory() || undefined,
        difficulty: this.filterDifficulty() || undefined,
        tag: this.filterTag() || undefined,
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

  loadMoreRecipes(): void {
    this.loading.set(true);
    this.recipeService
      .getRecipes({
        page: this.page(),
        page_size: this.pageSize(),
        search: this.searchQuery() || undefined,
        sort_by: this.sortBy(),
        sort_order: this.sortOrder(),
        category: this.filterCategory() || undefined,
        difficulty: this.filterDifficulty() || undefined,
        tag: this.filterTag() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.recipes.update(existing => [...existing, ...res.items]);
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

  onScroll(event: Event): void {
    const tracker = event.target as HTMLElement;
    const limit = tracker.scrollHeight - tracker.clientHeight;
    if (tracker.scrollTop >= limit - 100) {
      if (!this.loading() && this.page() < this.totalPages()) {
        this.page.update(p => p + 1);
        this.loadMoreRecipes();
      }
    }
  }

  onSearch(): void {
    this.page.set(1);
    this.loadRecipes();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadRecipes();
  }

  onSortChange(field: string): void {
    this.sortBy.set(field);
    this.page.set(1);
    this.loadRecipes();
  }

  toggleSortOrder(): void {
    this.sortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
    this.page.set(1);
    this.loadRecipes();
  }

  toggleFiltersPanel(): void {
    this.showFiltersPanel.update(v => !v);
  }

  closeFiltersPanel(): void {
    this.showFiltersPanel.set(false);
  }

  selectDifficulty(diff: string): void {
    this.filterDifficulty.set(this.filterDifficulty() === diff ? '' : diff);
    this.onFilterChange();
  }

  selectCategory(cat: string): void {
    this.filterCategory.set(this.filterCategory() === cat ? '' : cat);
    this.onFilterChange();
  }

  selectTag(tag: string): void {
    this.filterTag.set(this.filterTag() === tag ? '' : tag);
    this.onFilterChange();
  }

  clearFilters(): void {
    this.filterDifficulty.set('');
    this.filterCategory.set('');
    this.filterTag.set('');
    this.onFilterChange();
  }

  hasActiveFilters(): boolean {
    return !!(this.filterDifficulty() || this.filterCategory() || this.filterTag());
  }

  onEditRecipe(recipe: Recipe): void {
    this.router.navigate(['/recipes', recipe.id, 'edit']);
  }

  confirmDelete(recipe: Recipe): void {
    this.recipeToDelete.set(recipe);
    this.deletePreview.set(null);
    this.previewLoading.set(true);
    this.previewError.set(false);
    this.showDeleteModal.set(true);

    this.recipeService.getDeletePreview(recipe.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preview) => {
          this.deletePreview.set(preview);
          this.previewLoading.set(false);
        },
        error: () => {
          this.previewLoading.set(false);
          this.previewError.set(true);
          this.toastService.show('Failed to load delete preview', 'error');
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
