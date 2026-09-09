import type { PixelCanvas, RGBA } from "../canvas/PixelCanvas";

/** Retangulo de selecao, em coordenadas de pixel da textura (normalizado: x0<=x1, y0<=y1). */
export interface SelectionRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface ToolContext {
  canvas: PixelCanvas;
  color: RGBA;
  /** Selecao ativa no momento (so leitura) - null se nao houver nenhuma. */
  selection: SelectionRect | null;
  /** Modo do balde: 'contiguous' (padrao) preenche so a area conectada;
   * 'global' preenche todos os pixels da cor alvo no canvas inteiro.
   * Ignorado pelas outras ferramentas. */
  bucketFillMode?: "contiguous" | "global";
  /** Tamanho do pincel (lado do quadrado, em pixels), usado por Lapis e
   * Borracha. Ignorado pelas outras ferramentas. Minimo 1. */
  brushSize: number;
  /** Usado pelo Conta-gotas para atualizar a cor ativa. */
  onColorPicked?: (color: RGBA) => void;
  /** Usado pela Selecao para reportar o retangulo (ou null ao desmarcar). */
  onSelectionChange?: (rect: SelectionRect | null) => void;
  /** Usado por ferramentas instantaneas (ex.: Rotacionar) para avisar que a
   * acao nao pode ser aplicada nas condicoes atuais. `code` e uma chave de
   * i18n em `errors`. */
  onActionRejected?: (code: string) => void;
}

/**
 * Interface base de ferramenta. Cada ferramenta implementa isso e nao conhece as outras - o
 * PixelEditorEngine e quem decide qual esta ativa e delega os eventos.
 */
export interface Tool {
  id: string;
  onPointerDown(x: number, y: number, ctx: ToolContext): void;
  onPointerMove(x: number, y: number, ctx: ToolContext): void;
  onPointerUp(x: number, y: number, ctx: ToolContext): void;
}

/**
 * Ids das ferramentas que usam brushSize (Lapis, Borracha). Fonte unica
 * compartilhada entre o Toolbar (slider de tamanho) e o PixelCanvas
 * (preview de hover) - evita as duas listas saírem dessincronizadas se
 * uma ferramenta nova de pincel for adicionada.
 */
export const BRUSH_SIZE_TOOL_IDS: ReadonlySet<string> = new Set(["pencil", "eraser"]);
