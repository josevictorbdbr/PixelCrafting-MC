import { Plus } from "lucide-react";
import type { Palette, PaletteColor } from "../../../types/palette";

function hexWithAlpha(hex: string, alpha: number): string {
  return `${hex}${Math.round(alpha).toString(16).padStart(2, "0")}`;
}

/**
 * Icone pequeno de uma paleta: as 2 primeiras cores lado a lado, com um
 * fade no final quando ha mais de 2 - indica "tem mais" sem precisar
 * empilhar varios quadrados.
 */
function PaletteIcon({ colors }: { colors: PaletteColor[] }) {
  if (colors.length === 0) {
    return <span className="w-4 h-3 border border-line bg-canvas shrink-0" />;
  }

  const [first, second] = colors;
  const hasMore = colors.length > 2;

  return (
    <span className="relative w-4 h-3 shrink-0 border border-line overflow-hidden flex">
      <span className="w-1/2 h-full" style={{ backgroundColor: hexWithAlpha(first.hex, first.alpha) }} />
      <span
        className="w-1/2 h-full"
        style={{ backgroundColor: hexWithAlpha((second ?? first).hex, (second ?? first).alpha) }}
      />
      {hasMore && (
        <span
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, transparent 35%, var(--color-panel) 100%)" }}
        />
      )}
    </span>
  );
}

interface PaletteListProps {
  palettes: Palette[];
  onSelect: (id: string) => void;
  onCreate: () => void;
  isCreating: boolean;
  emptyLabel: string;
  newPaletteLabel: string;
}

export function PaletteList({ palettes, onSelect, onCreate, isCreating, emptyLabel, newPaletteLabel }: PaletteListProps) {
  return (
    <div className="flex flex-col gap-2">
      {palettes.length === 0 ? (
        <p className="text-caption text-muted">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {palettes.map((palette) => (
            <li key={palette.id}>
              <button
                type="button"
                onClick={() => onSelect(palette.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-body text-ink text-left border border-transparent hover:border-line hover:bg-canvas"
              >
                <PaletteIcon colors={palette.colors} />
                <span className="truncate">{palette.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onCreate}
        disabled={isCreating}
        className="flex items-center gap-1 text-caption text-accent hover:underline disabled:opacity-50 self-start"
      >
        <Plus size={12} /> {newPaletteLabel}
      </button>
    </div>
  );
}
