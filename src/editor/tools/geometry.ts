import type { PixelCanvas, RGBA } from "../canvas/PixelCanvas";
import type { SelectionRect } from "./Tool";

/** Selecao ativa, ou a textura inteira se nao houver nenhuma. */
export function regionOrWhole(canvas: PixelCanvas, selection: SelectionRect | null): SelectionRect {
  return selection ?? { x0: 0, y0: 0, x1: canvas.width - 1, y1: canvas.height - 1 };
}

/**
 * Pinta um quadrado de lado `size` centralizado em (cx, cy). Fora dos
 * limites da textura e simplesmente ignorado (setPixel ja faz bounds
 * check). size=1 pinta so o pixel (cx, cy) - mesmo comportamento de
 * antes do pincel ter tamanho variavel.
 */
export function paintBrush(canvas: PixelCanvas, cx: number, cy: number, size: number, color: RGBA): void {
  const before = -Math.floor((size - 1) / 2);
  const after = Math.ceil((size - 1) / 2);
  for (let dy = before; dy <= after; dy++) {
    for (let dx = before; dx <= after; dx++) {
      canvas.setPixel(cx + dx, cy + dy, color);
    }
  }
}

/** Algoritmo de Bresenham - padrao para linhas em pixel art. */
export function drawLine(
  canvas: PixelCanvas,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: RGBA,
): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;

  for (;;) {
    canvas.setPixel(x, y, color);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

/** Contorno de retangulo entre dois pontos (nao preenchido). */
export function drawRectOutline(
  canvas: PixelCanvas,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: RGBA,
): void {
  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1);
  const top = Math.min(y0, y1);
  const bottom = Math.max(y0, y1);

  for (let x = left; x <= right; x++) {
    canvas.setPixel(x, top, color);
    canvas.setPixel(x, bottom, color);
  }
  for (let y = top; y <= bottom; y++) {
    canvas.setPixel(left, y, color);
    canvas.setPixel(right, y, color);
  }
}

/** Espelha uma regiao (ou a textura inteira) na horizontal. */
export function mirrorHorizontal(canvas: PixelCanvas, region: SelectionRect): void {
  const { x0, y0, x1, y1 } = region;
  for (let y = y0; y <= y1; y++) {
    let left = x0;
    let right = x1;
    while (left < right) {
      const a = canvas.getPixel(left, y);
      const b = canvas.getPixel(right, y);
      canvas.setPixel(left, y, b);
      canvas.setPixel(right, y, a);
      left++;
      right--;
    }
  }
}

/** Espelha uma regiao (ou a textura inteira) na vertical. */
export function mirrorVertical(canvas: PixelCanvas, region: SelectionRect): void {
  const { x0, y0, x1, y1 } = region;
  for (let x = x0; x <= x1; x++) {
    let top = y0;
    let bottom = y1;
    while (top < bottom) {
      const a = canvas.getPixel(x, top);
      const b = canvas.getPixel(x, bottom);
      canvas.setPixel(x, top, b);
      canvas.setPixel(x, bottom, a);
      top++;
      bottom--;
    }
  }
}

/**
 * Rotaciona uma regiao quadrada 90 graus (sentido horario), em memoria
 * temporaria (senao um pixel poderia ser lido depois de ja ter sido
 * sobrescrito). So funciona se a regiao for quadrada - largura e altura
 * mudariam de lugar numa regiao retangular, o que nao cabe no mesmo
 * espaco sem redimensionar a textura (fora do escopo desta etapa).
 */
export function rotateRegion90(canvas: PixelCanvas, region: SelectionRect): boolean {
  const { x0, y0, x1, y1 } = region;
  const size = x1 - x0 + 1;
  if (size !== y1 - y0 + 1) return false;

  const source: RGBA[][] = [];
  for (let y = 0; y < size; y++) {
    const row: RGBA[] = [];
    for (let x = 0; x < size; x++) {
      row.push(canvas.getPixel(x0 + x, y0 + y));
    }
    source.push(row);
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const newX = size - 1 - y;
      const newY = x;
      canvas.setPixel(x0 + newX, y0 + newY, source[y][x]);
    }
  }
  return true;
}
