import type { Tool, ToolContext } from "./Tool";
import { regionOrWhole, rotateRegion90 } from "./geometry";

/**
 * Acao instantanea - gira 90 graus (sentido horario) a selecao ativa (se
 * for quadrada) ou a textura inteira. Regiao retangular (nao-quadrada) e
 * rejeitada via onActionRejected - rotacionar mudaria a forma da regiao,
 * o que nao cabe no mesmo espaco sem redimensionar.
 */
export class RotateTool implements Tool {
  id = "rotate";

  onPointerDown(_x: number, _y: number, ctx: ToolContext): void {
    const applied = rotateRegion90(ctx.canvas, regionOrWhole(ctx.canvas, ctx.selection));
    if (!applied) ctx.onActionRejected?.("rotate_requires_square_region");
  }

  onPointerMove(): void {}
  onPointerUp(): void {}
}
