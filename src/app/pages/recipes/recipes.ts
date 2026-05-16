import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecipeService } from '../../services/recipe.service';
import { Recipe, RecipeDeletePreview } from '../../models/recipe.model';

@Component({
  selector: 'app-recipes',
  imports: [CommonModule, FormsModule],
  templateUrl: './recipes.html',
  styleUrl: './recipes.scss',
})
export class RecipesPage implements OnInit {
  private readonly recipeService = inject(RecipeService);

  recipes = signal<Recipe[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);
  searchQuery = signal('');
  sortBy = signal('title');
  sortOrder = signal<'asc' | 'desc'>('asc');
  loading = signal(false);

  // Delete modal state
  showDeleteModal = signal(false);
  recipeToDelete = signal<Recipe | null>(null);
  deleting = signal(false);
  deletePreview = signal<RecipeDeletePreview | null>(null);
  previewLoading = signal(false);
  previewError = signal(false); // true when roadmap_nodes > 0

  // Toast
  showToast = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');

  paginationInfo = computed(() => {
    const t = this.total();
    const p = this.page();
    const ps = this.pageSize();
    const from = t === 0 ? 0 : (p - 1) * ps + 1;
    const to = Math.min(p * ps, t);
    return `Showing ${from} to ${to} of ${t} recipes`;
  });

  pageNumbers = computed(() => {
    const tp = this.totalPages();
    const current = this.page();
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(tp, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  blockedByRoadmap = computed(() => {
    const p = this.deletePreview();
    return p !== null && p.roadmap_nodes > 0;
  });

  ngOnInit(): void {
    this.loadRecipes();
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
          this.showToastMessage('Failed to load recipes', 'error');
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

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadRecipes();
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
        this.showToastMessage('Recipe deleted successfully!', 'success');
        this.loadRecipes();
      },
      error: (err) => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.recipeToDelete.set(null);
        this.deletePreview.set(null);
        const message =
          err?.error?.detail || 'An unexpected error occurred while deleting the recipe.';
        this.showToastMessage(message, 'error');
      },
    });
  }

  difficultyClass(level: string | null): string {
    switch (level?.toLowerCase()) {
      case 'easy': return 'badge-easy';
      case 'medium': return 'badge-medium';
      case 'hard': return 'badge-hard';
      default: return 'badge-neutral';
    }
  }

  private showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 4000);
  }
}
