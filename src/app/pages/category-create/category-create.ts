import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  HostListener,
  inject,
  signal,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { RecipeService } from '../../services/recipe.service';
import { ToastService } from '../../services/toast.service';
import { Recipe } from '../../models/recipe.model';
import { CategoryCreatePayload, CategoryNodePayload } from '../../models/category.model';

interface GraphNode {
  id: string; // internal UUID for graph tracking
  recipe_id: string | null;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  selected?: boolean;
}

interface GraphEdge {
  fromNodeId: string;
  toNodeId: string;
}

@Component({
  selector: 'app-category-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-create.html',
  styleUrl: './category-create.scss',
})
export class CategoryCreatePage implements OnInit, OnDestroy {
  private readonly categoryService = inject(CategoryService);
  private readonly recipeService = inject(RecipeService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  @ViewChild('graphCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // Form State
  formData = signal<{
    title: string;
    unlock_cost_stars: number;
    category_area: string;
    category_type: string;
  }>({
    title: '',
    unlock_cost_stars: 0,
    category_area: '',
    category_type: '',
  });

  readonly availableAreas = [
    'Algerian', 'American', 'Argentinian', 'Australian', 'British', 'Canadian',
    'Chinese', 'Croatian', 'Dutch', 'Egyptian', 'Filipino', 'French', 'Greek',
    'Indian', 'Irish', 'Italian', 'Jamaican', 'Japanese', 'Kenyan', 'Malaysian',
    'Mexican', 'Moroccan', 'Norwegian', 'Polish', 'Portuguese', 'Russian',
    'Saudi Arabian', 'Spanish', 'Syrian', 'Thai', 'Tunisian', 'Turkish',
    'Ukrainian', 'Uruguayan', 'Venezulan', 'Vietnamese'
  ];
  readonly availableTypes = ['*', 'Beef', 'Chicken', 'Dessert', 'Lamb', 'Pork', 'Seafood', 'Side', 'Vegetarian'];

  // Recipes State (Left Panel)
  recipes = signal<Recipe[]>([]);
  searchQuery = signal('');
  page = signal(1);
  pageSize = signal(20);
  totalPages = signal(1);
  loadingRecipes = signal(false);
  isSubmitting = signal(false);

  // Graph State
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId?: number;
  nodes: GraphNode[] = [];
  edges: GraphEdge[] = [];

  // Canvas Interactions
  private panX = 0;
  private panY = 0;
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;

  private draggingNode: GraphNode | null = null;
  private dragStartX = 0;
  private dragStartY = 0;

  private connectingFromNode: GraphNode | null = null;
  private mouseX = 0;
  private mouseY = 0;

  private readonly PORT_RADIUS = 6;
  private readonly NODE_WIDTH = 140;
  private readonly NODE_HEIGHT = 60;

  // Grid Spacing for database map_column/map_row conversion
  private readonly GRID_CELL_WIDTH = 200;
  private readonly GRID_CELL_HEIGHT = 150;
  private readonly GRID_OFFSET_X = 100;
  private readonly GRID_OFFSET_Y = 100;

  ngOnInit(): void {
    this.loadRecipes();
    this.initCanvas();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // --- Recipe List Loading ---

  loadRecipes(): void {
    this.loadingRecipes.set(true);
    this.recipeService
      .getRecipes({
        page: this.page(),
        page_size: this.pageSize(),
        search: this.searchQuery() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.recipes.set(res.items);
          this.totalPages.set(res.total_pages);
          this.loadingRecipes.set(false);
        },
        error: () => {
          this.toastService.show('Failed to load recipes', 'error');
          this.loadingRecipes.set(false);
        },
      });
  }

  loadMoreRecipes(): void {
    if (this.page() >= this.totalPages() || this.loadingRecipes()) return;
    this.page.update(p => p + 1);
    this.loadingRecipes.set(true);
    this.recipeService
      .getRecipes({
        page: this.page(),
        page_size: this.pageSize(),
        search: this.searchQuery() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.recipes.update(existing => [...existing, ...res.items]);
          this.totalPages.set(res.total_pages);
          this.loadingRecipes.set(false);
        },
        error: () => {
          this.toastService.show('Failed to load recipes', 'error');
          this.loadingRecipes.set(false);
        },
      });
  }

  onRecipeScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) {
      this.loadMoreRecipes();
    }
  }

  onSearch(): void {
    this.page.set(1);
    this.loadRecipes();
  }

  openRecipeDetail(recipeId: string): void {
    window.open(`/recipes/${recipeId}`, '_blank');
  }

  // --- Drag and Drop from List to Canvas ---

  onDragStartRecipe(event: DragEvent, recipe: Recipe): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify({
        id: recipe.id,
        title: recipe.title
      }));
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onCanvasDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault();
    const dataStr = event.dataTransfer?.getData('application/json');
    if (!dataStr) return;

    try {
      const data = JSON.parse(dataStr);
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left - this.panX;
      const y = event.clientY - rect.top - this.panY;

      this.addNode(data.id, data.title, x - this.NODE_WIDTH / 2, y - this.NODE_HEIGHT / 2);
    } catch (e) {
      console.error('Failed to parse dropped recipe', e);
    }
  }

  // --- Canvas & Graph Logic ---

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
    
    // Start render loop
    this.ngZone.runOutsideAngular(() => {
      const render = () => {
        this.drawGraph();
        this.animationFrameId = requestAnimationFrame(render);
      };
      render();
    });
  }

  @HostListener('window:resize')
  resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
  }

  private addNode(recipe_id: string | null, title: string, x: number, y: number): void {
    const id = crypto.randomUUID();
    this.nodes.push({ id, recipe_id, title, x, y, width: this.NODE_WIDTH, height: this.NODE_HEIGHT });
  }

  private getPortPositions(node: GraphNode): { in: {x: number, y: number}, out: {x: number, y: number} } {
    return {
      in: { x: node.x, y: node.y + node.height / 2 },
      out: { x: node.x + node.width, y: node.y + node.height / 2 }
    };
  }

  private distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  // Mouse Handlers
  onCanvasMouseDown(event: MouseEvent): void {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const worldX = mouseX - this.panX;
    const worldY = mouseY - this.panY;

    // 1. Check middle mouse for panning
    if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
      this.isPanning = true;
      this.panStartX = event.clientX - this.panX;
      this.panStartY = event.clientY - this.panY;
      return;
    }

    if (event.button !== 0) return; // Only left click for interaction

    // Deselect all
    this.nodes.forEach(n => n.selected = false);

    // 2. Check ports for connection starting
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const ports = this.getPortPositions(node);
      
      // Clicked output port?
      if (this.distance(worldX, worldY, ports.out.x, ports.out.y) < this.PORT_RADIUS * 2) {
        this.connectingFromNode = node;
        return;
      }
    }

    // 3. Check node dragging
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (worldX >= node.x && worldX <= node.x + node.width &&
          worldY >= node.y && worldY <= node.y + node.height) {
        this.draggingNode = node;
        node.selected = true;
        this.dragStartX = worldX - node.x;
        this.dragStartY = worldY - node.y;
        
        // Bring to front
        this.nodes.splice(i, 1);
        this.nodes.push(node);
        return;
      }
    }

    // If nothing clicked, start panning
    this.isPanning = true;
    this.panStartX = event.clientX - this.panX;
    this.panStartY = event.clientY - this.panY;
  }

  onCanvasMouseMove(event: MouseEvent): void {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;

    if (this.isPanning) {
      this.panX = event.clientX - this.panStartX;
      this.panY = event.clientY - this.panStartY;
    } else if (this.draggingNode) {
      const worldX = this.mouseX - this.panX;
      const worldY = this.mouseY - this.panY;
      this.draggingNode.x = worldX - this.dragStartX;
      this.draggingNode.y = worldY - this.dragStartY;
    }
  }

  @HostListener('window:mouseup', ['$event'])
  onCanvasMouseUp(event: MouseEvent): void {
    this.isPanning = false;
    this.draggingNode = null;

    if (this.connectingFromNode && this.canvasRef) {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const worldX = event.clientX - rect.left - this.panX;
      const worldY = event.clientY - rect.top - this.panY;

      // Check if dropped on an input port
      for (const node of this.nodes) {
        if (node.id === this.connectingFromNode.id) continue;
        const ports = this.getPortPositions(node);
        if (this.distance(worldX, worldY, ports.in.x, ports.in.y) < this.PORT_RADIUS * 3) {
          // Check if edge already exists
          const exists = this.edges.find(e => 
            e.fromNodeId === this.connectingFromNode!.id && 
            e.toNodeId === node.id
          );
          if (!exists) {
            this.edges.push({
              fromNodeId: this.connectingFromNode.id,
              toNodeId: node.id
            });
          }
          break;
        }
      }
      this.connectingFromNode = null;
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selectedNodeIndex = this.nodes.findIndex(n => n.selected);
      if (selectedNodeIndex !== -1) {
        const nodeId = this.nodes[selectedNodeIndex].id;
        // Remove edges connected to this node
        this.edges = this.edges.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId);
        // Remove node
        this.nodes.splice(selectedNodeIndex, 1);
      }
    }
  }

  private drawGraph(): void {
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);

    // Draw background grid dots
    const dotSpacing = 20;
    const startX = Math.floor(-this.panX / dotSpacing) * dotSpacing;
    const startY = Math.floor(-this.panY / dotSpacing) * dotSpacing;
    const endX = startX + canvas.width + dotSpacing;
    const endY = startY + canvas.height + dotSpacing;

    this.ctx.fillStyle = '#e5e7eb';
    for (let x = startX; x < endX; x += dotSpacing) {
      for (let y = startY; y < endY; y += dotSpacing) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Draw existing edges
    this.ctx.strokeStyle = '#34d399'; // Emerald-400
    this.ctx.lineWidth = 2;
    for (const edge of this.edges) {
      const fromNode = this.nodes.find(n => n.id === edge.fromNodeId);
      const toNode = this.nodes.find(n => n.id === edge.toNodeId);
      if (fromNode && toNode) {
        const p1 = this.getPortPositions(fromNode).out;
        const p2 = this.getPortPositions(toNode).in;
        this.drawBezierCurve(p1.x, p1.y, p2.x, p2.y);
      }
    }

    // Draw connecting line in progress
    if (this.connectingFromNode) {
      const p1 = this.getPortPositions(this.connectingFromNode).out;
      const worldMouseX = this.mouseX - this.panX;
      const worldMouseY = this.mouseY - this.panY;
      this.ctx.strokeStyle = '#a7f3d0'; // Emerald-200
      this.ctx.lineWidth = 2;
      this.drawBezierCurve(p1.x, p1.y, worldMouseX, worldMouseY);
    }

    // Draw nodes
    for (const node of this.nodes) {
      this.drawNode(node);
    }

    this.ctx.restore();
  }

  private drawBezierCurve(x1: number, y1: number, x2: number, y2: number): void {
    const cpOffset = Math.abs(x2 - x1) * 0.5 + 20;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.bezierCurveTo(
      x1 + cpOffset, y1,
      x2 - cpOffset, y2,
      x2, y2
    );
    this.ctx.stroke();
  }

  private drawNode(node: GraphNode): void {
    // Node shadow
    this.ctx.shadowColor = 'rgba(0,0,0,0.05)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetY = 4;

    // Node background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.roundRect(node.x, node.y, node.width, node.height, 8);
    this.ctx.fill();

    // Node border
    this.ctx.shadowColor = 'transparent';
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = node.selected ? '#ff6d00' : '#e5e7eb';
    if (node.selected) this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Text
    this.ctx.fillStyle = '#374151';
    this.ctx.font = '500 13px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Simple text wrapping (up to 2 lines)
    const words = node.title.split(' ');
    let line1 = '';
    let line2 = '';
    let i = 0;
    for (; i < words.length; i++) {
      if (this.ctx.measureText(line1 + words[i] + ' ').width < node.width - 20) {
        line1 += words[i] + ' ';
      } else {
        break;
      }
    }
    for (; i < words.length; i++) {
      if (this.ctx.measureText(line2 + words[i] + ' ').width < node.width - 20) {
        line2 += words[i] + ' ';
      } else {
        line2 += '...';
        break;
      }
    }

    if (line2) {
      this.ctx.fillText(line1.trim(), node.x + node.width / 2, node.y + node.height / 2 - 8);
      this.ctx.fillText(line2.trim(), node.x + node.width / 2, node.y + node.height / 2 + 8);
    } else {
      this.ctx.fillText(line1.trim(), node.x + node.width / 2, node.y + node.height / 2);
    }

    // Draw ports
    const ports = this.getPortPositions(node);
    
    this.ctx.fillStyle = '#10b981'; // Emerald-500
    this.ctx.beginPath();
    this.ctx.arc(ports.in.x, ports.in.y, this.PORT_RADIUS, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(ports.out.x, ports.out.y, this.PORT_RADIUS, 0, Math.PI * 2);
    this.ctx.fill();
  }

  // --- Save Logic ---

  saveCategory(): void {
    const form = this.formData();
    if (!form.title.trim()) {
      this.toastService.show('Category title is required', 'error');
      return;
    }

    this.isSubmitting.set(true);

    const payload: CategoryCreatePayload = {
      title: form.title,
      subtitle: null,
      image_url: null,
      unlock_cost_stars: form.unlock_cost_stars,
      category_area: form.category_area || null,
      category_type: form.category_type || null,
      nodes: this.serializeGraph()
    };

    this.categoryService.createCategory(payload).subscribe({
      next: () => {
        this.toastService.show('Category created successfully', 'success');
        this.router.navigate(['/categories']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.show(err?.error?.detail || 'Failed to create category', 'error');
      }
    });
  }

  private serializeGraph(): CategoryNodePayload[] {
    // Backend expects an array of nodes, where prereqs are indices of other nodes in the array.
    // 1. Map internal IDs to array indices
    const idToIndex = new Map<string, number>();
    this.nodes.forEach((n, idx) => idToIndex.set(n.id, idx));

    // 2. Build payload
    return this.nodes.map(n => {
      // Find all incoming edges to this node
      const incomingEdges = this.edges.filter(e => e.toNodeId === n.id);
      const prereqIndices = incomingEdges.map(e => idToIndex.get(e.fromNodeId)!);

      const gridX = Math.max(0, Math.round((n.x - this.GRID_OFFSET_X) / this.GRID_CELL_WIDTH));
      const gridY = Math.max(0, Math.round((n.y - this.GRID_OFFSET_Y) / this.GRID_CELL_HEIGHT));

      return {
        recipe_id: n.recipe_id,
        title: n.title,
        x: gridX,
        y: gridY,
        prerequisite_indices: prereqIndices
      };
    });
  }

  cancel(): void {
    this.router.navigate(['/categories']);
  }
}
