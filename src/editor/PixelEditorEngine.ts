import { PixelCanvas, type RGBA } from "./canvas/PixelCanvas";
import { HistoryManager } from "./history/HistoryManager";
import { SnapshotCommand, LayerPropertyCommand, ReorderLayersCommand, AddRemoveLayerCommand } from "./history/Command";
import { ToolRegistry } from "./tools/ToolRegistry";
import { Layer } from "./layers/Layer";
import type { SelectionRect, ToolContext } from "./tools/Tool";

const TRANSPARENT: RGBA = [0, 0, 0, 0];
export const MAX_LAYERS = 6;

function imageDataEquals(a: ImageData, b: ImageData): boolean {
  if (a.data.length !== b.data.length) return false;
  for (let i = 0; i < a.data.length; i++) {
    if (a.data[i] !== b.data[i]) return false;
  }
  return true;
}

/** Uma camada carregada do backend (load_texture_layers), antes de virar Layer/PixelCanvas. */
export interface LoadedLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  pixels: number[] | Uint8ClampedArray;
}

/** Payload de uma camada pronto para salvar (save_texture_layers). */
export interface LayerSavePayload {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  pixels: number[];
}

/** Pixels de um template, ja redimensionados pelo backend para o tamanho da textura atual. */
export interface TemplateLayerSource {
  width: number;
  height: number;
  pixels: number[];
}

/**
 * Orquestra as camadas (PixelCanvas por camada) + ToolRegistry +
 * HistoryManager (doc de arquitetura, secao 6). `layers[0]` e sempre a
 * camada do TOPO (mais na frente) - convencao compartilhada com o
 * backend. Ferramentas desenham sempre na camada ativa.
 */
export class PixelEditorEngine {
  readonly width: number;
  readonly height: number;
  readonly history = new HistoryManager();

  layers: Layer[];
  activeLayerId: string;

  activeToolId = "pencil";
  activeColor: RGBA = [0, 0, 0, 255];
  bucketFillMode: "contiguous" | "global" = "contiguous";
  isDirty = false;
  selection: SelectionRect | null = null;

  /** Reatribuido pelo componente React para redesenhar quando algo muda. */
  onChange: () => void = () => {};
  /** Reatribuido pela EditorScreen para levar a cor do conta-gotas ao store. */
  onColorPicked: (color: RGBA) => void = () => {};

  private strokeBefore: ImageData | null = null;
  private isDrawing = false;

  constructor(width: number, height: number, loadedLayers?: LoadedLayer[], activeLayerId?: string) {
    this.width = width;
    this.height = height;

    if (loadedLayers && loadedLayers.length > 0) {
      this.layers = loadedLayers.map((l) => {
        const data = new ImageData(new Uint8ClampedArray(l.pixels), width, height);
        return new Layer(l.id, l.name, new PixelCanvas(width, height, data), l.visible, l.opacity);
      });
      this.activeLayerId = activeLayerId && this.layers.some((l) => l.id === activeLayerId)
        ? activeLayerId
        : this.layers[0].id;
    } else {
      const base = Layer.createBlank("Base", width, height);
      this.layers = [base];
      this.activeLayerId = base.id;
    }
  }

  get activeLayer(): Layer {
    return this.layers.find((l) => l.id === this.activeLayerId) ?? this.layers[0];
  }

  private buildContext(): ToolContext {
    return {
      canvas: this.activeLayer.canvas,
      color: this.activeColor,
      selection: this.selection,
      bucketFillMode: this.bucketFillMode,
      onColorPicked: (color) => this.onColorPicked(color),
      onSelectionChange: (rect) => {
        this.selection = rect;
        this.onChange();
      },
    };
  }

  /** Compara com o estado anterior e so empilha historico se algo mudou de verdade. */
  private commitIfChanged(before: ImageData): void {
    const layer = this.activeLayer;
    const after = layer.canvas.snapshot();
    if (!imageDataEquals(before, after)) {
      this.history.push(
        new SnapshotCommand((data) => layer.canvas.restore(data), before, after, () => this.onChange()),
      );
      this.isDirty = true;
    }
  }

  setActiveTool(id: string): void {
    this.activeToolId = id;
    if (id !== "selection" && this.selection) {
      this.selection = null;
      this.onChange();
    }
  }

  setActiveColor(color: RGBA): void {
    this.activeColor = color;
  }

  setBucketFillMode(mode: "contiguous" | "global"): void {
    if (this.bucketFillMode === mode) return;
    this.bucketFillMode = mode;
    this.onChange();
  }

  pointerDown(x: number, y: number): void {
    const tool = ToolRegistry.get(this.activeToolId);
    if (!tool) return;
    this.isDrawing = true;
    this.strokeBefore = this.activeLayer.canvas.snapshot();
    tool.onPointerDown(x, y, this.buildContext());
    this.onChange();
  }

  pointerMove(x: number, y: number): void {
    if (!this.isDrawing) return;
    const tool = ToolRegistry.get(this.activeToolId);
    if (!tool) return;
    tool.onPointerMove(x, y, this.buildContext());
    this.onChange();
  }

  pointerUp(x: number, y: number): void {
    if (!this.isDrawing) return;
    const tool = ToolRegistry.get(this.activeToolId);
    tool?.onPointerUp(x, y, this.buildContext());
    this.isDrawing = false;

    const before = this.strokeBefore;
    this.strokeBefore = null;
    if (!before) return;
    this.commitIfChanged(before);
  }

  /** Apaga (transparente) os pixels dentro da selecao ativa, na camada ativa. */
  clearSelectionRect(): void {
    if (!this.selection) return;
    const canvas = this.activeLayer.canvas;
    const before = canvas.snapshot();
    const { x0, y0, x1, y1 } = this.selection;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        canvas.setPixel(x, y, TRANSPARENT);
      }
    }
    this.commitIfChanged(before);
    this.onChange();
  }

  undo(): void {
    if (!this.history.canUndo) return;
    this.history.undo();
    this.isDirty = true;
  }

  redo(): void {
    if (!this.history.canRedo) return;
    this.history.redo();
    this.isDirty = true;
  }

  markSaved(): void {
    this.isDirty = false;
  }

  // ------------------------------------------------------------------
  // Camadas
  // ------------------------------------------------------------------

  setActiveLayerId(id: string): void {
    if (!this.layers.some((l) => l.id === id) || id === this.activeLayerId) return;
    this.activeLayerId = id;
    this.onChange();
  }

  /**
   * Composicao final (todas as camadas visiveis, respeitando opacidade)
   * usada pela tela para desenhar. Mesmo algoritmo alpha-over do
   * backend (core/texture/texture_manager.rs) - percorre do ultimo
   * indice pro primeiro, ja que `layers[0]` e o topo.
   */
  getComposite(): ImageData {
    const out = new ImageData(this.width, this.height);
    const dst = out.data;
    const pixelCount = this.width * this.height;

    for (let idx = this.layers.length - 1; idx >= 0; idx--) {
      const layer = this.layers[idx];
      if (!layer.visible || layer.opacity === 0) continue;
      const factor = layer.opacity / 100;
      const src = layer.canvas.getImageData().data;

      for (let i = 0; i < pixelCount; i++) {
        const si = i * 4;
        const sa = (src[si + 3] / 255) * factor;
        if (sa <= 0) continue;
        const da = dst[si + 3] / 255;
        const outA = sa + da * (1 - sa);
        if (outA <= 0.0001) continue;
        dst[si] = (src[si] * sa + dst[si] * da * (1 - sa)) / outA;
        dst[si + 1] = (src[si + 1] * sa + dst[si + 1] * da * (1 - sa)) / outA;
        dst[si + 2] = (src[si + 2] * sa + dst[si + 2] * da * (1 - sa)) / outA;
        dst[si + 3] = outA * 255;
      }
    }
    return out;
  }

  /** Cria uma camada nova (transparente) no topo e a torna ativa. Bloqueada em MAX_LAYERS. */
  addLayer(): void {
    if (this.layers.length >= MAX_LAYERS) return;

    const layer = Layer.createBlank(`Layer ${this.layers.length + 1}`, this.width, this.height);
    this.insertLayerOnTop(layer);
  }

  /**
   * Cria uma camada nova no topo ja populada com os pixels de um template
   * (backend ja redimensionou via nearest-neighbor para width/height desta
   * textura). Mesmo fluxo estrutural de addLayer() - bloqueada em
   * MAX_LAYERS. `name` e o rotulo ja traduzido/decidido pela UI.
   */
  addLayerFromTemplate(name: string, template: TemplateLayerSource): void {
    if (this.layers.length >= MAX_LAYERS) return;
    if (template.width !== this.width || template.height !== this.height) return;

    const data = new ImageData(new Uint8ClampedArray(template.pixels), this.width, this.height);
    const layer = new Layer(crypto.randomUUID(), name, new PixelCanvas(this.width, this.height, data));
    this.insertLayerOnTop(layer);
  }

  /** Compartilhado por addLayer/addLayerFromTemplate: insere no topo (indice 0), ativa e empilha historico. */
  private insertLayerOnTop(layer: Layer): void {
    const index = 0;
    const activeBefore = this.activeLayerId;

    this.layers.splice(index, 0, layer);
    this.activeLayerId = layer.id;

    this.history.push(
      new AddRemoveLayerCommand(
        (l, i) => this.layers.splice(i, 0, l),
        (id) => { this.layers = this.layers.filter((x) => x.id !== id); },
        (id) => { this.activeLayerId = id; },
        layer,
        index,
        true,
        activeBefore,
        layer.id,
        () => this.onChange(),
      ),
    );
    this.isDirty = true;
    this.onChange();
  }

  /** Remove uma camada. Bloqueada se so restar 1. Se a removida era a ativa, ativa a vizinha. */
  deleteLayer(id: string): void {
    if (this.layers.length <= 1) return;
    const index = this.layers.findIndex((l) => l.id === id);
    if (index === -1) return;

    const layer = this.layers[index];
    const activeBefore = this.activeLayerId;

    this.layers.splice(index, 1);
    const activeAfter = activeBefore === id
      ? this.layers[Math.min(index, this.layers.length - 1)].id
      : activeBefore;
    this.activeLayerId = activeAfter;

    this.history.push(
      new AddRemoveLayerCommand(
        (l, i) => this.layers.splice(i, 0, l),
        (rid) => { this.layers = this.layers.filter((x) => x.id !== rid); },
        (aid) => { this.activeLayerId = aid; },
        layer,
        index,
        false,
        activeBefore,
        activeAfter,
        () => this.onChange(),
      ),
    );
    this.isDirty = true;
    this.onChange();
  }

  /** Move uma camada uma posicao para cima (mais perto do topo, indice 0). */
  moveLayerUp(id: string): void {
    const index = this.layers.findIndex((l) => l.id === id);
    if (index <= 0) return;
    this.swapLayers(index, index - 1);
  }

  /** Move uma camada uma posicao para baixo (mais longe do topo). */
  moveLayerDown(id: string): void {
    const index = this.layers.findIndex((l) => l.id === id);
    if (index === -1 || index >= this.layers.length - 1) return;
    this.swapLayers(index, index + 1);
  }

  setLayerVisible(id: string, visible: boolean): void {
    const layer = this.layers.find((l) => l.id === id);
    if (!layer || layer.visible === visible) return;
    const before = layer.visible;
    layer.visible = visible;
    this.pushLayerPropertyCommand<boolean>((v) => { layer.visible = v; }, before, visible);
  }

  setLayerOpacity(id: string, opacity: number): void {
    const layer = this.layers.find((l) => l.id === id);
    if (!layer || layer.opacity === opacity) return;
    const before = layer.opacity;
    layer.opacity = opacity;
    this.pushLayerPropertyCommand<number>((v) => { layer.opacity = v; }, before, opacity);
  }

  /** Monta o payload pronto para `saveTextureLayers`/`saveTextureLayersAs`. */
  toSavePayload(): { width: number; height: number; activeLayerId: string; layers: LayerSavePayload[] } {
    return {
      width: this.width,
      height: this.height,
      activeLayerId: this.activeLayerId,
      layers: this.layers.map((l) => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        opacity: l.opacity,
        pixels: Array.from(l.canvas.getImageData().data),
      })),
    };
  }

  private swapLayers(a: number, b: number): void {
    const before = this.layers.map((l) => l.id);
    [this.layers[a], this.layers[b]] = [this.layers[b], this.layers[a]];
    const after = this.layers.map((l) => l.id);

    this.history.push(new ReorderLayersCommand((order) => this.applyOrder(order), before, after, () => this.onChange()));
    this.isDirty = true;
    this.onChange();
  }

  private applyOrder(order: string[]): void {
    const byId = new Map(this.layers.map((l) => [l.id, l]));
    this.layers = order.map((id) => byId.get(id)!);
  }

  private pushLayerPropertyCommand<T>(setValue: (v: T) => void, before: T, after: T): void {
    this.history.push(new LayerPropertyCommand<T>(setValue, before, after, () => this.onChange()));
    this.isDirty = true;
    this.onChange();
  }
}
