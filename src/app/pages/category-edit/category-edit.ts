import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-category-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './category-edit.html',
  styleUrl: './category-edit.scss',
})
export class CategoryEditPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);
  private readonly toastService = inject(ToastService);

  id = signal<string>('');
  loading = signal(true);
  saving = signal(false);

  formData = signal<{ title: string; description: string }>({
    title: '',
    description: ''
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.loadCategory(id);
    }
  }

  loadCategory(id: string): void {
    this.categoryService.getCategoryById(id).subscribe({
      next: (cat) => {
        this.formData.set({
          title: cat.title || '',
          description: cat.subtitle || ''
        });
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Failed to load category', 'error');
        this.router.navigate(['/categories']);
      }
    });
  }

  save(): void {
    this.saving.set(true);
    this.categoryService.updateCategory(this.id(), this.formData()).subscribe({
      next: () => {
        this.toastService.show('Category updated successfully', 'success');
        this.router.navigate(['/categories']);
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.show(err?.error?.detail || 'Failed to update category', 'error');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/categories']);
  }
}
