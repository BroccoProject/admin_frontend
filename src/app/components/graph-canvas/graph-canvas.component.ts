import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  HostListener,
  inject,
  NgZone,
  model,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphNode, GraphEdge } from '../../models/graph.model';
import { Recipe } from '../../models/recipe.model';

@Component({
  selector: 'app-graph-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graph-canvas.component.html',
  styleUrl: './graph-canvas.component.scss'
})
export class GraphCanvasComponent implements OnInit, OnDestroy {
  private readonly ngZone = inject(NgZone);

  @ViewChild('graphCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  nodes = model.required<GraphNode[]>();
  edges = model.required<GraphEdge[]>();
  changed = output<void>();

  private ctx!: CanvasRenderingContext2D;
  private animationFrameId?: number;

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

  ngOnInit(): void {
    this.initCanvas();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

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

  public addRecipeNode(recipe: Recipe): void {
    const canvas = this.canvasRef.nativeElement;
    const centerX = (canvas.width / 2) - this.panX - (this.NODE_WIDTH / 2);
    const centerY = (canvas.height / 2) - this.panY - (this.NODE_HEIGHT / 2);
    const offset = (Math.random() - 0.5) * 40;
    
    this.addNode(recipe.id, recipe.title, centerX + offset, centerY + offset);
    
    if (window.innerWidth <= 768) {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  private addNode(recipe_id: string | null, title: string, x: number, y: number): void {
    const id = crypto.randomUUID();
    const newNodes = [...this.nodes(), { id, recipe_id, title, x, y, width: this.NODE_WIDTH, height: this.NODE_HEIGHT }];
    this.nodes.set(newNodes);
    this.changed.emit();
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

  // --- Mouse & Touch Handlers ---
  
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

  onCanvasMouseDown(event: MouseEvent): void {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const worldX = mouseX - this.panX;
    const worldY = mouseY - this.panY;

    if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
      this.isPanning = true;
      this.panStartX = event.clientX - this.panX;
      this.panStartY = event.clientY - this.panY;
      return;
    }

    if (event.button !== 0) return;

    const currentNodes = [...this.nodes()];
    currentNodes.forEach(n => n.selected = false);

    for (let i = currentNodes.length - 1; i >= 0; i--) {
      const node = currentNodes[i];
      const ports = this.getPortPositions(node);
      if (this.distance(worldX, worldY, ports.out.x, ports.out.y) < this.PORT_RADIUS * 2) {
        this.connectingFromNode = node;
        this.nodes.set(currentNodes);
        return;
      }
    }

    for (let i = currentNodes.length - 1; i >= 0; i--) {
      const node = currentNodes[i];
      if (worldX >= node.x && worldX <= node.x + node.width &&
          worldY >= node.y && worldY <= node.y + node.height) {
        this.draggingNode = node;
        node.selected = true;
        this.dragStartX = worldX - node.x;
        this.dragStartY = worldY - node.y;
        
        currentNodes.splice(i, 1);
        currentNodes.push(node);
        this.nodes.set(currentNodes);
        return;
      }
    }

    this.nodes.set(currentNodes);
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
    
    if (this.draggingNode) {
      this.changed.emit();
    }
    this.draggingNode = null;

    if (this.connectingFromNode && this.canvasRef) {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const worldX = event.clientX - rect.left - this.panX;
      const worldY = event.clientY - rect.top - this.panY;

      const currentNodes = this.nodes();
      let currentEdges = [...this.edges()];

      for (const node of currentNodes) {
        if (node.id === this.connectingFromNode.id) continue;
        const ports = this.getPortPositions(node);
        if (this.distance(worldX, worldY, ports.in.x, ports.in.y) < this.PORT_RADIUS * 3) {
          const exists = currentEdges.find(e => 
            e.fromNodeId === this.connectingFromNode!.id && e.toNodeId === node.id
          );
          if (!exists) {
            currentEdges.push({
              fromNodeId: this.connectingFromNode.id,
              toNodeId: node.id
            });
            this.edges.set(currentEdges);
            this.changed.emit();
          }
          break;
        }
      }
    }

    this.connectingFromNode = null;
    this.mouseX = 0;
    this.mouseY = 0;
  }

  onCanvasTouchStart(event: TouchEvent): void {
    if (event.touches.length > 1) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.onCanvasMouseDown({
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      shiftKey: false
    } as any);
  }

  onCanvasTouchMove(event: TouchEvent): void {
    if (event.touches.length > 1) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.onCanvasMouseMove({
      clientX: touch.clientX,
      clientY: touch.clientY
    } as any);
  }

  @HostListener('window:touchend', ['$event'])
  onCanvasTouchEnd(event: TouchEvent): void {
    if (event.changedTouches.length === 0) return;
    const touch = event.changedTouches[0];
    this.onCanvasMouseUp({
      clientX: touch.clientX,
      clientY: touch.clientY
    } as any);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const currentNodes = [...this.nodes()];
      const selectedNodeIndex = currentNodes.findIndex(n => n.selected);
      if (selectedNodeIndex !== -1) {
        const nodeId = currentNodes[selectedNodeIndex].id;
        
        const newEdges = this.edges().filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId);
        this.edges.set(newEdges);
        
        currentNodes.splice(selectedNodeIndex, 1);
        this.nodes.set(currentNodes);
        
        this.changed.emit();
      }
    }
  }

  private drawGraph(): void {
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    const currentNodes = this.nodes();
    const currentEdges = this.edges();
    
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);

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

    this.ctx.strokeStyle = '#34d399';
    this.ctx.lineWidth = 2;
    for (const edge of currentEdges) {
      const fromNode = currentNodes.find(n => n.id === edge.fromNodeId);
      const toNode = currentNodes.find(n => n.id === edge.toNodeId);
      if (fromNode && toNode) {
        const p1 = this.getPortPositions(fromNode).out;
        const p2 = this.getPortPositions(toNode).in;
        this.drawBezierCurve(p1.x, p1.y, p2.x, p2.y);
      }
    }

    if (this.connectingFromNode) {
      const p1 = this.getPortPositions(this.connectingFromNode).out;
      const worldMouseX = this.mouseX - this.panX;
      const worldMouseY = this.mouseY - this.panY;
      this.ctx.strokeStyle = '#a7f3d0';
      this.ctx.lineWidth = 2;
      this.drawBezierCurve(p1.x, p1.y, worldMouseX, worldMouseY);
    }

    for (const node of currentNodes) {
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
    this.ctx.shadowColor = 'rgba(0,0,0,0.05)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetY = 4;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.roundRect(node.x, node.y, node.width, node.height, 8);
    this.ctx.fill();

    this.ctx.shadowColor = 'transparent';
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = node.selected ? '#ff6d00' : '#e5e7eb';
    if (node.selected) this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = '#374151';
    this.ctx.font = '500 13px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
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

    const ports = this.getPortPositions(node);
    
    this.ctx.fillStyle = '#10b981';
    this.ctx.beginPath();
    this.ctx.arc(ports.in.x, ports.in.y, this.PORT_RADIUS, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(ports.out.x, ports.out.y, this.PORT_RADIUS, 0, Math.PI * 2);
    this.ctx.fill();
  }
}
