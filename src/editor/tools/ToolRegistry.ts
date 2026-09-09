import type { Tool } from "./Tool";
import { PencilTool } from "./PencilTool";
import { EraserTool } from "./EraserTool";
import { BucketTool } from "./BucketTool";
import { EyedropperTool } from "./EyedropperTool";
import { SelectionTool } from "./SelectionTool";
import { MoveSelectionTool } from "./MoveSelectionTool";
import { LineTool } from "./LineTool";
import { RectangleTool } from "./RectangleTool";
import { MirrorHorizontalTool } from "./MirrorHorizontalTool";
import { MirrorVerticalTool } from "./MirrorVerticalTool";
import { RotateTool } from "./RotateTool";

/**
 * Registro central de ferramentas.
 * Ferramenta nova = 1 arquivo + 1 linha de registro aqui, sem tocar em
 * Canvas, HistoryManager ou UI.
 *
 * Etapa 6a: Lapis, Borracha. Etapa 6b: Balde, Conta-gotas, Selecao.
 * Etapa 6c: Linha, Retangulo, Espelhos, Rotacionar - todas as 10
 * ferramentas da v1 registradas.
 * Etapa 6d: Mover Selecao.
 */
class ToolRegistryImpl {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  get(id: string): Tool | undefined {
    return this.tools.get(id);
  }
}

export const ToolRegistry = new ToolRegistryImpl();
ToolRegistry.register(new PencilTool());
ToolRegistry.register(new EraserTool());
ToolRegistry.register(new BucketTool());
ToolRegistry.register(new EyedropperTool());
ToolRegistry.register(new SelectionTool());
ToolRegistry.register(new MoveSelectionTool());
ToolRegistry.register(new LineTool());
ToolRegistry.register(new RectangleTool());
ToolRegistry.register(new MirrorHorizontalTool());
ToolRegistry.register(new MirrorVerticalTool());
ToolRegistry.register(new RotateTool());
