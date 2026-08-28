import type { Tool, ToolContext } from "./Tool";
import type { RGBA, PixelCanvas } from "../canvas/PixelCanvas";

function colorsEqual(a: RGBA, b: RGBA): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

/** Preenchimento por area (4-direcional), so pixels conectados ao clique. */
function floodFillContiguous(canvas: PixelCanvas, startX: number, startY: number, target: RGBA, fillColor: RGBA): void {
  const stack: [number, number][] = [[startX, startY]];
  const visited = new Set<number>();

  while (stack.length > 0) {
    const next = stack.pop();
    if (!next) break;
    const [x, y] = next;
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue;

    const key = y * canvas.width + x;
    if (visited.has(key)) continue;
    if (!colorsEqual(canvas.getPixel(x, y), target)) continue;

    visited.add(key);
    canvas.setPixel(x, y, fillColor);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

/** Preenche todo pixel do canvas com a cor alvo, conectado ou nao. */
function fillGlobal(canvas: PixelCanvas, target: RGBA, fillColor: RGBA): void {
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (colorsEqual(canvas.getPixel(x, y), target)) {
        canvas.setPixel(x, y, fillColor);
      }
    }
  }
}

export class BucketTool implements Tool {
  id = "bucket";

  onPointerDown(x: number, y: number, ctx: ToolContext): void {
    const target = ctx.canvas.getPixel(x, y);
    if (colorsEqual(target, ctx.color)) return;

    if (ctx.bucketFillMode === "global") {
      fillGlobal(ctx.canvas, target, ctx.color);
    } else {
      floodFillContiguous(ctx.canvas, x, y, target, ctx.color);
    }
  }

  onPointerMove(): void {
    // Balde age so no clique, nao repete durante o arraste.
  }

  onPointerUp(): void {}
}