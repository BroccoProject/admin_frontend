import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { ToastService } from '../../services/toast.service';
import { DeleteModalComponent } from '../../components/delete-modal/delete-modal.component';
import { HasRoleDirective } from '../../directives/has-role.directive';
import { RecipeDetail, RecipeDeletePreview } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe-view',
  standalone: true,
  imports: [CommonModule, RouterModule, DeleteModalComponent, HasRoleDirective],
  templateUrl: './recipe-view.html',
  styleUrl: './recipe-view.scss',
})
export class RecipeViewPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipeService = inject(RecipeService);
  private readonly toastService = inject(ToastService);

  id = signal<string>('');
  loading = signal(true);
  activeTab = signal<'general' | 'ingredients' | 'steps'>('general');

  recipe = signal<RecipeDetail | null>(null);

  // Tab counts
  ingredientCount = computed(() => this.recipe()?.ingredients?.length ?? 0);
  stepCount = computed(() => this.recipe()?.steps?.length ?? 0);

  // Delete modal state
  showDeleteModal = signal(false);
  deleting = signal(false);
  deletePreview = signal<RecipeDeletePreview | null>(null);
  previewLoading = signal(false);

  blockedByRoadmap = computed(() => {
    const p = this.deletePreview();
    return p !== null && p.roadmap_nodes > 0;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.loadRecipeDetail(id);
    }
  }

  loadRecipeDetail(id: string): void {
    this.loading.set(true);
    this.recipeService.getRecipeDetail(id).subscribe({
      next: (detail) => {
        this.recipe.set(detail);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Failed to load recipe details', 'error');
        this.router.navigate(['/recipes']);
      },
    });
  }

  setTab(tab: 'general' | 'ingredients' | 'steps'): void {
    this.activeTab.set(tab);
  }

  onEditRecipe(): void {
    const currentId = this.id();
    if (currentId) {
      this.router.navigate(['/recipes', currentId, 'edit']);
    }
  }

  confirmDelete(): void {
    const currentId = this.id();
    if (!currentId) return;

    this.deletePreview.set(null);
    this.previewLoading.set(true);
    this.showDeleteModal.set(true);

    this.recipeService.getDeletePreview(currentId).subscribe({
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
    this.deletePreview.set(null);
  }

  executeDelete(): void {
    const currentId = this.id();
    if (!currentId || this.blockedByRoadmap()) return;

    this.deleting.set(true);
    this.recipeService.deleteRecipe(currentId).subscribe({
      next: () => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.toastService.show('Recipe deleted successfully!', 'success');
        this.router.navigate(['/recipes']);
      },
      error: (err) => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        const message = err?.error?.detail || 'An unexpected error occurred while deleting the recipe.';
        this.toastService.show(message, 'error');
      },
    });
  }

  difficultyClass(level: string | null | undefined): string {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'badge-easy';
      case 'intermediate': return 'badge-medium';
      case 'master chef': return 'badge-hard';
      default: return 'badge-neutral';
    }
  }
}
