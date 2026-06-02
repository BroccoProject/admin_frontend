import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { RecipeService } from '../../services/recipe.service';
import { ToastService } from '../../services/toast.service';
import {
  RecipeDetail,
  RecipeIngredientDetail,
  RecipeStepDetail,
  StepIngredientDetail,
  StepItemDetail,
  IngredientRef,
  ItemRef,
  RecipeFullUpdate,
} from '../../models/recipe.model';
import { RECIPE_TAGS, RECIPE_STEP_ACTIONS } from '../../constants';

@Component({
  selector: 'app-recipe-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DragDropModule],
  templateUrl: './recipe-edit.html',
  styleUrl: './recipe-edit.scss',
})
export class RecipeEditPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipeService = inject(RecipeService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  id = signal<string>('');
  loading = signal(true);
  saving = signal(false);
  activeTab = signal<'general' | 'ingredients' | 'steps'>('general');

  // Recipe detail data (mutable copy)
  recipe = signal<RecipeDetail | null>(null);

  // Reference lists for dropdowns
  allIngredients = signal<IngredientRef[]>([]);
  allItems = signal<ItemRef[]>([]);

  // Tags string for easy editing
  tagsString = signal('');

  // Computed counts for tab badges
  ingredientCount = computed(() => this.recipe()?.ingredients?.length ?? 0);
  stepCount = computed(() => this.recipe()?.steps?.length ?? 0);

  readonly availableTags = RECIPE_TAGS;
  readonly availableActions = RECIPE_STEP_ACTIONS;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.loadRecipeDetail(id);
      this.loadReferenceData();
    }
  }

  loadRecipeDetail(id: string): void {
    this.recipeService.getRecipeDetail(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.recipe.set(structuredClone(detail));
          this.tagsString.set((detail.tags || []).join(', '));
          this.loading.set(false);
        },
        error: () => {
          this.toastService.show('Failed to load recipe', 'error');
          this.router.navigate(['/recipes']);
        },
      });
  }

  loadReferenceData(): void {
    this.recipeService.getAllIngredients()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.allIngredients.set(res.items),
        error: () => this.toastService.show('Failed to load ingredients list', 'error'),
      });

    this.recipeService.getAllItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.allItems.set(res.items),
        error: () => this.toastService.show('Failed to load items list', 'error'),
      });
  }

  setTab(tab: 'general' | 'ingredients' | 'steps'): void {
    this.activeTab.set(tab);
  }

  // ── General info helpers ──

  updateField<K extends keyof RecipeDetail>(field: K, value: RecipeDetail[K]): void {
    const r = this.recipe();
    if (!r) return;
    this.recipe.set({ ...r, [field]: value });
  }

  hasTag(tag: string): boolean {
    return (this.recipe()?.tags || []).includes(tag);
  }

  toggleTag(tag: string): void {
    const r = this.recipe();
    if (!r) return;
    const tags = [...(r.tags || [])];
    const idx = tags.indexOf(tag);
    if (idx >= 0) {
      tags.splice(idx, 1);
    } else {
      tags.push(tag);
    }
    r.tags = tags;
    this.recipe.set({ ...r });
  }

  // ── Recipe Ingredient CRUD ──

  addRecipeIngredient(): void {
    const r = this.recipe();
    if (!r || this.allIngredients().length === 0) return;
    const firstIng = this.allIngredients()[0];
    const newIng: RecipeIngredientDetail = {
      ingredient: { ...firstIng },
      amount: null,
      unit: firstIng.default_unit || null,
      sort_order: r.ingredients.length,
    };
    r.ingredients = [...r.ingredients, newIng];
    this.recipe.set({ ...r });
  }

  removeRecipeIngredient(index: number): void {
    const r = this.recipe();
    if (!r) return;
    r.ingredients = r.ingredients.filter((_, i) => i !== index);
    this.recipe.set({ ...r });
  }

  onRecipeIngredientChange(index: number, ingredientId: string): void {
    const r = this.recipe();
    if (!r) return;
    const ref = this.allIngredients().find((i) => i.id === ingredientId);
    if (ref) {
      r.ingredients[index].ingredient = { ...ref };
      if (!r.ingredients[index].unit) {
        r.ingredients[index].unit = ref.default_unit;
      }
      this.recipe.set({ ...r });
    }
  }

  // ── Step CRUD ──

  addStep(): void {
    const r = this.recipe();
    if (!r) return;
    const nextNum = r.steps.length > 0 ? Math.max(...r.steps.map((s) => s.step_number)) + 1 : 1;
    const newStep: RecipeStepDetail = {
      step_number: nextNum,
      instruction: '',
      duration_seconds: null,
      ingredients: [],
      items: [],
    };
    r.steps = [...r.steps, newStep];
    this.recipe.set({ ...r });
  }

  removeStep(index: number): void {
    const r = this.recipe();
    if (!r) return;
    r.steps = r.steps.filter((_, i) => i !== index);
    // Re-number steps
    r.steps.forEach((s, i) => (s.step_number = i + 1));
    this.recipe.set({ ...r });
  }

  dropStep(event: CdkDragDrop<RecipeStepDetail[]>): void {
    const r = this.recipe();
    if (!r) return;
    moveItemInArray(r.steps, event.previousIndex, event.currentIndex);
    // Re-number steps
    r.steps.forEach((s, i) => (s.step_number = i + 1));
    this.recipe.set({ ...r });
  }

  // ── Step Ingredient CRUD ──

  addStepIngredient(stepIndex: number): void {
    const r = this.recipe();
    if (!r || this.allIngredients().length === 0) return;
    const firstIng = this.allIngredients()[0];
    const newSI: StepIngredientDetail = {
      ingredient: { ...firstIng },
      amount: null,
      unit: firstIng.default_unit || null,
      actions: [],
    };
    r.steps[stepIndex].ingredients = [...r.steps[stepIndex].ingredients, newSI];
    this.recipe.set({ ...r });
  }

  removeStepIngredient(stepIndex: number, ingIndex: number): void {
    const r = this.recipe();
    if (!r) return;
    r.steps[stepIndex].ingredients = r.steps[stepIndex].ingredients.filter((_, i) => i !== ingIndex);
    this.recipe.set({ ...r });
  }

  onStepIngredientChange(stepIndex: number, ingIndex: number, ingredientId: string): void {
    const r = this.recipe();
    if (!r) return;
    const ref = this.allIngredients().find((i) => i.id === ingredientId);
    if (ref) {
      r.steps[stepIndex].ingredients[ingIndex].ingredient = { ...ref };
      if (!r.steps[stepIndex].ingredients[ingIndex].unit) {
        r.steps[stepIndex].ingredients[ingIndex].unit = ref.default_unit;
      }
      this.recipe.set({ ...r });
    }
  }

  toggleStepIngredientAction(stepIndex: number, ingIndex: number, action: string): void {
    const r = this.recipe();
    if (!r) return;
    const si = r.steps[stepIndex].ingredients[ingIndex];
    const idx = si.actions.indexOf(action);
    if (idx >= 0) {
      si.actions.splice(idx, 1);
    } else {
      si.actions.push(action);
    }
    this.recipe.set({ ...r });
  }

  // ── Step Item CRUD ──

  addStepItem(stepIndex: number): void {
    const r = this.recipe();
    if (!r || this.allItems().length === 0) return;
    const firstItem = this.allItems()[0];
    const newSI: StepItemDetail = {
      item: { ...firstItem },
    };
    r.steps[stepIndex].items = [...r.steps[stepIndex].items, newSI];
    this.recipe.set({ ...r });
  }

  removeStepItem(stepIndex: number, itemIndex: number): void {
    const r = this.recipe();
    if (!r) return;
    r.steps[stepIndex].items = r.steps[stepIndex].items.filter((_, i) => i !== itemIndex);
    this.recipe.set({ ...r });
  }

  onStepItemChange(stepIndex: number, itemIndex: number, itemId: string): void {
    const r = this.recipe();
    if (!r) return;
    const ref = this.allItems().find((i) => i.id === itemId);
    if (ref) {
      r.steps[stepIndex].items[itemIndex].item = { ...ref };
      this.recipe.set({ ...r });
    }
  }

  // ── Save ──

  save(): void {
    const r = this.recipe();
    if (!r) return;

    const payload: RecipeFullUpdate = {
      title: r.title,
      description: r.description,
      image_url: r.image_url,
      difficulty_level: r.difficulty_level,
      duration_minutes: r.duration_minutes,
      youtube_url: r.youtube_url,
      tags: r.tags,
      category: r.category,
      area: r.area,
      source_url: r.source_url,
      ingredients: r.ingredients.map((ri, idx) => ({
        ingredient_id: ri.ingredient.id,
        amount: ri.amount,
        unit: ri.unit,
        sort_order: idx,
      })),
      steps: r.steps.map((step) => ({
        step_number: step.step_number,
        instruction: step.instruction,
        duration_seconds: step.duration_seconds,
        ingredients: step.ingredients.map((si) => ({
          ingredient_id: si.ingredient.id,
          amount: si.amount,
          unit: si.unit,
          actions: si.actions,
        })),
        items: step.items.map((sit) => ({
          item_id: sit.item.id,
        })),
      })),
    };

    this.saving.set(true);
    this.recipeService.updateRecipeFull(this.id(), payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.recipe.set(structuredClone(detail));
          this.saving.set(false);
          this.toastService.show('Recipe updated successfully', 'success');
        },
        error: (err) => {
          this.saving.set(false);
          this.toastService.show(err?.error?.detail || 'Failed to update recipe', 'error');
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/recipes']);
  }
}
