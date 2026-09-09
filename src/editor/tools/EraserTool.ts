import type { Tool, ToolContext } from "./Tool";
import { paintBrush } from "./geometry";

const TRANSPARENT: [number, number, number, number] = [0, 0, 0, 0];

export class EraserTool implements Tool {
  id = "eraser";

  onPointerDown(x: number, y: number, ctx: ToolContext): void {
    paintBrush(ctx.canvas, x, y, ctx.brushSize, TRANSPARENT);
  }

  onPointerMove(x: number, y: number, ctx: ToolContext): void {
    paintBrush(ctx.canvas, x, y, ctx.brushSize, TRANSPARENT);
  }

  onPointerUp(): void {
    // Snapshot do traco inteiro fica a cargo do PixelEditorEngine.
  }
}
