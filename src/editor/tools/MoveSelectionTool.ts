import type { Tool, ToolContext, SelectionRect } from "./Tool";
import type { PixelCanvas, RGBA } from "../canvas/PixelCanvas";

const TRANSPARENT: RGBA = [0, 0, 0, 0];

/** Clampa a regiao aos limites do canvas - a selecao pode ter coordenadas fora da textura (arrasto que sai da area visivel), e getPixel nao tem bounds check. */
function clampRegion(region: SelectionRect, canvas: PixelCanvas): SelectionRect {
  return {
    x0: Math.max(0, region.x0),
    y0: Math.max(0, region.y0),
    x1: Math.min(canvas.width - 1, region.x1),
    y1: Math.min(canvas.height - 1, region.y1),
  };
}

/**
 * Move os pixels da selecao ativa (corta e cola) - sem selecao, nao faz
 * nada. Segue o mesmo padrao de preview de Linha/Retangulo: snapshot
 * limpo (com o buraco ja cortado) + restore-e-redesenha a cada
 * pointerMove, em vez de mexer no canvas incrementalmente.
 */
export class MoveSelectionTool implements Tool {
  id = "move-selection";

  private dragStart: { x: number; y: number } | null = null;
  private region: SelectionRect | null = null;
  private buffer: RGBA[][] | null = null;
  private baseWithHole: ImageData | null = null;

  onPointerDown(x: number, y: number, ctx: ToolContext): void {
    if (!ctx.selection) return;
    this.region = clampRegion(ctx.selection, ctx.canvas);
    this.dragStart = { x, y };
    this.buffer = this.cutRegion(ctx.canvas, this.region);
    this.baseWithHole = ctx.canvas.snapshot();
  }

  onPointerMove(x: number, y: number, ctx: ToolContext): void {
    if (!this.dragStart) return;
    this.applyOffset(ctx, x - this.dragStart.x, y - this.dragStart.y);
  }

  onPointerUp(x: number, y: number, ctx: ToolContext): void {
    if (!this.dragStart || !this.region) {
      this.reset();
      return;
    }
    const dx = x - this.dragStart.x;
    const dy = y - this.dragStart.y;
    this.applyOffset(ctx, dx, dy);

    const { x0, y0, x1, y1 } = this.region;
    ctx.onSelectionChange?.({ x0: x0 + dx, y0: y0 + dy, x1: x1 + dx, y1: y1 + dy });
    this.reset();
  }

  private reset(): void {
    this.dragStart = null;
    this.region = null;
    this.buffer = null;
    this.baseWithHole = null;
  }

  /** Restaura o estado com o buraco (sem o pedaco movido) e redesenha o buffer na posicao deslocada. */
  private applyOffset(ctx: ToolContext, dx: number, dy: number): void {
    if (!this.region || !this.buffer || !this.baseWithHole) return;
    ctx.canvas.restore(this.baseWithHole);
    this.pasteRegion(ctx.canvas, this.region, this.buffer, dx, dy);
  }

  /** Extrai os pixels da regiao (ja clampada) para o buffer de arrasto e apaga o original no canvas. */
  private cutRegion(canvas: PixelCanvas, region: SelectionRect): RGBA[][] {
    const { x0, y0, x1, y1 } = region;
    const rows: RGBA[][] = [];
    for (let y = y0; y <= y1; y++) {
      const row: RGBA[] = [];
      for (let x = x0; x <= x1; x++) {
        row.push(canvas.getPixel(x, y));
        canvas.setPixel(x, y, TRANSPARENT);
      }
      rows.push(row);
    }
    return rows;
  }

  /** Desenha o buffer deslocado (dx, dy) a partir do canto original da regiao. Pixels que caem fora da textura sao descartados (setPixel ja ignora fora dos limites). */
  private pasteRegion(canvas: PixelCanvas, region: SelectionRect, buffer: RGBA[][], dx: number, dy: number): void {
    const { x0, y0 } = region;
    for (let ry = 0; ry < buffer.length; ry++) {
      for (let rx = 0; rx < buffer[ry].length; rx++) {
        canvas.setPixel(x0 + rx + dx, y0 + ry + dy, buffer[ry][rx]);
      }
    }
  }
}
