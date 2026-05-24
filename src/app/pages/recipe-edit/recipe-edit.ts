import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { ToastService } from '../../services/toast.service';
import { Recipe } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './recipe-edit.html',
  styleUrl: './recipe-edit.scss',
})
export class RecipeEditPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipeService = inject(RecipeService);
  private readonly toastService = inject(ToastService);

  id = signal<string>('');
  loading = signal(true);
  saving = signal(false);

  formData = signal<Partial<Recipe>>({
    title: '',
    description: '',
    difficulty_level: 'Beginner',
    duration_minutes: 0,
    youtube_url: '',
    source_url: '',
    tags: []
  });
  tagsString = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.loadRecipe(id);
    }
  }

  loadRecipe(id: string): void {
    this.recipeService.getRecipeById(id).subscribe({
      next: (recipe) => {
        this.formData.set({
          title: recipe.title,
          description: recipe.description,
          difficulty_level: recipe.difficulty_level,
          duration_minutes: recipe.duration_minutes,
          youtube_url: recipe.youtube_url,
          source_url: recipe.source_url,
          tags: recipe.tags
        });
        this.tagsString.set((recipe.tags || []).join(', '));
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Failed to load recipe', 'error');
        this.router.navigate(['/recipes']);
      }
    });
  }

  save(): void {
    const data = { ...this.formData() };
    const t = this.tagsString().split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    data.tags = t;

    this.saving.set(true);
    this.recipeService.updateRecipe(this.id(), data).subscribe({
      next: () => {
        this.toastService.show('Recipe updated successfully', 'success');
        this.router.navigate(['/recipes']);
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.show(err?.error?.detail || 'Failed to update recipe', 'error');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/recipes']);
  }
}
