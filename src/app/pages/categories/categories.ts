import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category, CategoryDeletePreview } from '../../models/category.model';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { DeleteModalComponent } from '../../components/delete-modal/delete-modal.component';
import { ToastService } from '../../services/toast.service';
import { HasRoleDirective } from '../../directives/has-role.directive';
import { DisabledNoRoleDirective } from '../../directives/disabled-no-role.directive';
import { Router } from '@angular/router';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule, PaginationComponent, DeleteModalComponent, HasRoleDirective],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class CategoriesPage implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  categories = signal<Category[]>([]);
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
  categoryToDelete = signal<Category | null>(null);
  deleting = signal(false);
  deletePreview = signal<CategoryDeletePreview | null>(null);
  previewLoading = signal(false);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.categoryService
      .getCategories({
        page: this.page(),
        page_size: this.pageSize(),
        search: this.searchQuery() || undefined,
        sort_by: this.sortBy(),
        sort_order: this.sortOrder(),
      })
      .subscribe({
        next: (res) => {
          this.categories.set(res.items);
          this.total.set(res.total);
          this.totalPages.set(res.total_pages);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toastService.show('Failed to load categories', 'error');
        },
      });
  }

  onSearch(): void {
    this.page.set(1);
    this.loadCategories();
  }

  onSortChange(field: string): void {
    this.sortBy.set(field);
    this.page.set(1);
    this.loadCategories();
  }

  onEditCategory(category: Category): void {
    this.router.navigate(['/categories', category.id, 'edit']);
  }

  // Delete flow
  confirmDelete(category: Category): void {
    this.categoryToDelete.set(category);
    this.deletePreview.set(null);
    this.previewLoading.set(true);
    this.showDeleteModal.set(true);

    this.categoryService.getDeletePreview(category.id).subscribe({
      next: (preview) => {
        this.deletePreview.set(preview);
        this.previewLoading.set(false);
      },
      error: () => {
        // Non-fatal: modal still opens but without preview stats
        this.previewLoading.set(false);
      },
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.categoryToDelete.set(null);
    this.deletePreview.set(null);
  }

  executeDelete(): void {
    const cat = this.categoryToDelete();
    if (!cat) return;

    this.deleting.set(true);
    this.categoryService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.categoryToDelete.set(null);
        this.deletePreview.set(null);
        this.toastService.show('Category deleted successfully!', 'success');
        this.loadCategories();
      },
      error: (err) => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.categoryToDelete.set(null);
        this.deletePreview.set(null);
        const message =
          err?.error?.detail ||
          'An unexpected error occurred while deleting the category.';
        this.toastService.show(message, 'error');
      },
    });
  }
}
