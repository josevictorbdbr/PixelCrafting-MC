import {
  Undo2,
  Redo2,
  Pencil,
  Eraser,
  PaintBucket,
  Pipette,
  Slash,
  Square,
  FlipHorizontal2,
  FlipVertical2,
  RotateCw,
  Scaling,
  SquareDashedMousePointer,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "../../i18n/useTranslation";
import type { Dictionary } from "../../i18n/en";

interface ToolbarItem {
  id: string;
  label: string;
  Icon: LucideIcon;
  kind: "tool" | "action";
}

/**
 * Categorias da toolbar. 4 colunas permitem que categorias com 4 itens
 * (Pincéis, Transformar) ocupem uma linha inteira. "Formas" e "Selecao"
 * foram unidas numa so categoria (2+1=3 itens) para preencher a linha
 * sem sobrar espaco.
 */
function buildToolbarCategories(t: Dictionary): { label: string; items: ToolbarItem[] }[] {
  return [
    {
      label: t.editor.toolbarCategories.general,
      items: [
        { id: "undo", label: t.editor.tools.undo, Icon: Undo2, kind: "action" },
        { id: "redo", label: t.editor.tools.redo, Icon: Redo2, kind: "action" },
      ],
    },
    {
      label: t.editor.toolbarCategories.drawing,
      items: [
        { id: "pencil", label: t.editor.tools.pencil, Icon: Pencil, kind: "tool" },
        { id: "eraser", label: t.editor.tools.eraser, Icon: Eraser, kind: "tool" },
        { id: "bucket", label: t.editor.tools.bucket, Icon: PaintBucket, kind: "tool" },
        { id: "eyedropper", label: t.editor.tools.eyedropper, Icon: Pipette, kind: "tool" },
      ],
    },
    {
      label: t.editor.toolbarCategories.shapes,
      items: [
        { id: "line", label: t.editor.tools.line, Icon: Slash, kind: "tool" },
        { id: "rectangle", label: t.editor.tools.rectangle, Icon: Square, kind: "tool" },
        { id: "selection", label: t.editor.tools.selection, Icon: SquareDashedMousePointer, kind: "tool" },
      ],
    },
    {
      label: t.editor.toolbarCategories.transform,
      items: [
        { id: "mirror-h", label: t.editor.tools.mirrorHorizontal, Icon: FlipHorizontal2, kind: "tool" },
        { id: "mirror-v", label: t.editor.tools.mirrorVertical, Icon: FlipVertical2, kind: "tool" },
        { id: "rotate", label: t.editor.tools.rotate, Icon: RotateCw, kind: "tool" },
        { id: "resize", label: t.editor.tools.resize, Icon: Scaling, kind: "action" },
      ],
    },
  ];
}

interface ToolbarProps {
  activeTool: string;
  onSelectTool: (toolId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onResize: () => void;
  bucketFillMode: "contiguous" | "global";
  onBucketFillModeChange: (mode: "contiguous" | "global") => void;
}

export function Toolbar({
  activeTool,
  onSelectTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onResize,
  bucketFillMode,
  onBucketFillModeChange,
}: ToolbarProps) {
  const t = useTranslation();
  const toolbarCategories = buildToolbarCategories(t);

  const handleClick = (id: string) => {
    if (id === "undo") onUndo();
    else if (id === "redo") onRedo();
    else if (id === "resize") onResize();
    else onSelectTool(id);
  };

  const isDisabled = (id: string) => (id === "undo" && !canUndo) || (id === "redo" && !canRedo);

  const toggleBucketAffectAll = () => {
    onBucketFillModeChange(bucketFillMode === "global" ? "contiguous" : "global");
  };

  return (
    <nav className="flex-1 py-3 px-2 flex flex-col gap-4 overflow-y-auto">
      {toolbarCategories.map((category) => (
        <div key={category.label}>
          <h3 className="text-caption text-muted tracking-wide mb-1.5 px-0.5">{category.label}</h3>
          <div className="grid grid-cols-4 gap-1">
            {category.items.map(({ id, label, Icon, kind }) => {
              const isActive = kind === "tool" && id === activeTool;
              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={label}
                  disabled={isDisabled(id)}
                  onClick={() => handleClick(id)}
                  className={`size-9 flex items-center justify-center rounded-sm transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isActive
                      ? "bg-accent/15 text-accent border border-accent"
                      : "text-muted hover:text-ink hover:bg-panel border border-transparent"
                  }`}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>

          {category.label === t.editor.toolbarCategories.drawing && activeTool === "bucket" && (
            <button
              type="button"
              onClick={toggleBucketAffectAll}
              aria-pressed={bucketFillMode === "global"}
              className={`mt-1.5 size-9 flex items-center justify-center text-center text-[10px] leading-tight rounded-sm border transition-colors cursor-pointer ${
                bucketFillMode === "global"
                  ? "bg-accent/15 text-accent border-accent"
                  : "text-muted border-line hover:text-ink hover:bg-panel"
              }`}
            >
              {t.editor.tools.bucketAffectAll}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}