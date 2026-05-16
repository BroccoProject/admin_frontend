import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ParserService } from '../../services/parser.service';
import { RecipeService } from '../../services/recipe.service';
import { RecipeDraft } from '../../models/parser.model';

@Component({
  selector: 'app-recipe-create',
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-create.html',
  styleUrl: './recipe-create.scss',
})
export class RecipeCreatePage {
  private readonly parserService = inject(ParserService);
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);

  // Core State
  rawText = signal('');
  feedbackText = signal('');
  threadId = signal<string | null>(null);
  draft = signal<RecipeDraft | null>(null);
  
  // UI State
  isProcessing = signal(false);
  isSubmitting = signal(false);
  activeTab = signal<'general' | 'ingredients' | 'steps'>('general');

  // Toast
  showToast = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');

  processWithAi(): void {
    const textToProcess = this.threadId() ? this.feedbackText() : this.rawText();
    if (!textToProcess.trim()) return;

    this.isProcessing.set(true);

    const apiCall = this.threadId()
      ? this.parserService.provideFeedback(this.threadId()!, textToProcess)
      : this.parserService.parseRecipe(textToProcess);

    apiCall.subscribe({
      next: (res) => {
        this.draft.set(res.draft);
        this.threadId.set(res.thread_id);
        this.feedbackText.set('');
        this.isProcessing.set(false);
        this.showToastMessage('Recipe processed by AI successfully!', 'success');
      },
      error: (err) => {
        this.isProcessing.set(false);
        const errorDetail = err?.error?.detail || 'Failed to process recipe with AI.';
        this.showToastMessage(errorDetail, 'error');
      },
    });
  }

  submitRecipe(): void {
    const currentDraft = this.draft();
    if (!currentDraft) return;

    this.isSubmitting.set(true);
    this.recipeService.createRecipe(currentDraft).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showToastMessage('Recipe saved successfully!', 'success');
        setTimeout(() => {
          this.router.navigate(['/recipes']);
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorDetail = err?.error?.detail || 'Failed to save recipe.';
        this.showToastMessage(errorDetail, 'error');
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

  // Helper helper to safely update nested fields
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
        { name: '', amount: null, unit: '', sort_order: updated.ingredients.length + 1 }
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
      // Re-normalize step numbers
      updated.steps = updated.steps.map((step, i) => ({
        ...step,
        step_number: i + 1
      }));
      this.draft.set(updated);
    }
  }

  private showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 4000);
  }
}
