import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category, CategoryDeletePreview } from '../../models/category.model';
import { DeleteModalComponent } from '../../components/delete-modal/delete-modal.component';
import { ToastService } from '../../services/toast.service';
import { HasRoleDirective } from '../../directives/has-role.directive';
import { DisabledNoRoleDirective } from '../../directives/disabled-no-role.directive';
import { Router } from '@angular/router';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule, DeleteModalComponent, HasRoleDirective],
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
  pageSize = signal(25);
  totalPages = signal(1);
  searchQuery = signal('');
  sortBy = signal('title');
  sortOrder = signal<'asc' | 'desc'>('asc');
  filterArea = signal('');
  filterType = signal('');
  showFiltersPanel = signal(false);
  loading = signal(false);

  availableAreas = [
    'Algerian', 'American', 'Argentinian', 'Australian', 'British', 'Canadian', 
    'Chinese', 'Croatian', 'Dutch', 'Egyptian', 'Filipino', 'French', 'Greek', 
    'Indian', 'Irish', 'Italian', 'Jamaican', 'Japanese', 'Kenyan', 'Malaysian', 
    'Mexican', 'Moroccan', 'Norwegian', 'Polish', 'Portuguese', 'Russian', 
    'Saudi Arabian', 'Spanish', 'Syrian', 'Thai', 'Tunisian', 'Turkish', 
    'Ukrainian', 'Uruguayan', 'Venezulan', 'Vietnamese'
  ];
  availableTypes = ['*', 'Beef', 'Chicken', 'Dessert', 'Lamb', 'Pork', 'Seafood', 'Side', 'Vegetarian'];

  showDeleteModal = signal(false);
  categoryToDelete = signal<Category | null>(null);
  deleting = signal(false);
  deletePreview = signal<CategoryDeletePreview | null>(null);
  previewLoading = signal(false);

  ngOnInit(): void {
    this.loadCategories();
  }

  onCreateCategory(): void {
    this.router.navigate(['/categories/create']);
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
        category_area: this.filterArea() || undefined,
        category_type: this.filterType() || undefined,
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

  loadMoreCategories(): void {
    this.loading.set(true);
    this.categoryService
      .getCategories({
        page: this.page(),
        page_size: this.pageSize(),
        search: this.searchQuery() || undefined,
        sort_by: this.sortBy(),
        sort_order: this.sortOrder(),
        category_area: this.filterArea() || undefined,
        category_type: this.filterType() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.categories.update(existing => [...existing, ...res.items]);
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

  onScroll(event: Event): void {
    const tracker = event.target as HTMLElement;
    const limit = tracker.scrollHeight - tracker.clientHeight;
    if (tracker.scrollTop >= limit - 100) {
      if (!this.loading() && this.page() < this.totalPages()) {
        this.page.update(p => p + 1);
        this.loadMoreCategories();
      }
    }
  }

  onSearch(): void {
    this.page.set(1);
    this.loadCategories();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadCategories();
  }

  onSortChange(field: string): void {
    this.sortBy.set(field);
    this.page.set(1);
    this.loadCategories();
  }

  toggleSortOrder(): void {
    this.sortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
    this.page.set(1);
    this.loadCategories();
  }

  toggleFiltersPanel(): void {
    this.showFiltersPanel.update(v => !v);
  }

  closeFiltersPanel(): void {
    this.showFiltersPanel.set(false);
  }

  selectArea(area: string): void {
    this.filterArea.set(this.filterArea() === area ? '' : area);
    this.onFilterChange();
  }

  selectType(type: string): void {
    this.filterType.set(this.filterType() === type ? '' : type);
    this.onFilterChange();
  }

  clearFilters(): void {
    this.filterArea.set('');
    this.filterType.set('');
    this.onFilterChange();
  }

  hasActiveFilters(): boolean {
    return !!(this.filterArea() || this.filterType());
  }

  typeRowClass(type: string | null): string {
    if (!type || type === '*') return '';
    return 'row-type-' + type.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  onEditCategory(category: Category): void {
    this.router.navigate(['/categories', category.id, 'edit']);
  }

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
