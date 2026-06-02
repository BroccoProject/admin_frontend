import { Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ParserService } from '../../services/parser.service';
import { RecipeService } from '../../services/recipe.service';
import { ToastService } from '../../services/toast.service';
import { RecipeDraft } from '../../models/parser.model';
import { RECIPE_CATEGORIES, RECIPE_DIFFICULTIES, RECIPE_TAGS } from '../../constants';

@Component({
  selector: 'app-recipe-create',
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-create.html',
  styleUrl: './recipe-create.scss',
})
export class RecipeCreatePage {
  private readonly parserService = inject(ParserService);
  private readonly recipeService = inject(RecipeService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  rawText = signal('');
  feedbackText = signal('');
  threadId = signal<string | null>(null);
  draft = signal<RecipeDraft | null>(null);

  isProcessing = signal(false);
  isSubmitting = signal(false);
  activeTab = signal<'general' | 'ingredients' | 'steps'>('general');

  readonly categories = RECIPE_CATEGORIES;
  readonly difficulties = RECIPE_DIFFICULTIES;
  readonly availableTags = RECIPE_TAGS;

  toggleTag(tag: string): void {
    const current = this.draft();
    if (current) {
      const tags = current.tags || [];
      const updatedTags = tags.includes(tag)
        ? tags.filter(t => t !== tag)
        : [...tags, tag];
      this.updateField('tags', updatedTags);
    }
  }

  hasTag(tag: string): boolean {
    return this.draft()?.tags?.includes(tag) || false;
  }

  processWithAi(): void {
    const textToProcess = this.threadId() ? this.feedbackText() : this.rawText();
    if (!textToProcess.trim()) return;

    this.isProcessing.set(true);

    const apiCall = this.threadId()
      ? this.parserService.provideFeedback(this.threadId()!, textToProcess)
      : this.parserService.parseRecipe(textToProcess);

    apiCall.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.draft.set(res.draft);
        this.threadId.set(res.thread_id);
        this.feedbackText.set('');
        this.isProcessing.set(false);
        this.toastService.show('Recipe processed by AI successfully!', 'success');
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.toastService.show(err?.error?.detail || 'Failed to process recipe with AI.', 'error');
      },
    });
  }

  submitRecipe(): void {
    const currentDraft = this.draft();
    if (!currentDraft) return;

    this.isSubmitting.set(true);
    this.recipeService.createRecipe(currentDraft)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toastService.show('Recipe saved successfully!', 'success');
          setTimeout(() => {
            this.router.navigate(['/recipes']);
          }, 1500);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toastService.show(err?.error?.detail || 'Failed to save recipe.', 'error');
        },
      });
  }

  resetParser(): void {
    this.threadId.set(null);
    this.draft.set(null);
    this.rawText.set('');
    this.feedbackText.set('');
    this.activeTab.set('general');
  }

  goBack(): void {
    this.router.navigate(['/recipes']);
  }

  updateField<K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K]): void {
    const current = this.draft();
    if (current) {
      this.draft.set({
        ...current,
        [key]: value,
      });
    }
  }

  addIngredient(): void {
    const current = this.draft();
    if (current) {
      const updated = { ...current };
      updated.ingredients = [
        ...updated.ingredients,
        { name: '', amount: 1, unit: 'pcs', sort_order: updated.ingredients.length + 1 }
      ];
      this.draft.set(updated);
    }
  }

  removeIngredient(index: number): void {
    const current = this.draft();
    if (current) {
      const updated = { ...current };
      updated.ingredients = updated.ingredients.filter((_, i) => i !== index);
      this.draft.set(updated);
    }
  }

  addStep(): void {
    const current = this.draft();
    if (current) {
      const updated = { ...current };
      updated.steps = [
        ...updated.steps,
        {
          step_number: updated.steps.length + 1,
          instruction: '',
          instruction_i18n: {},
          duration_seconds: null,
          ingredients: [],
          items: []
        }
      ];
      this.draft.set(updated);
    }
  }

  removeStep(index: number): void {
    const current = this.draft();
    if (current) {
      const updated = { ...current };
      updated.steps = updated.steps.filter((_, i) => i !== index);
      updated.steps = updated.steps.map((step, i) => ({
        ...step,
        step_number: i + 1
      }));
      this.draft.set(updated);
    }
  }
}
