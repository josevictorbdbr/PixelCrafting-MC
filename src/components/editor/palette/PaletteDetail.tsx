import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import type { Palette } from "../../../types/palette";
import { ColorSwatch } from "./ColorSwatch";

function hexWithAlpha(hex: string, alpha: number): string {
  return `${hex}${Math.round(alpha).toString(16).padStart(2, "0")}`;
}

interface PaletteDetailLabels {
  back: string;
  addCurrentColor: string;
  deletePalette: string;
  deletePaletteConfirm: string;
  cancel: string;
  empty: string;
  useColorAriaLabel: (hex: string) => string;
  deleteColorAriaLabel: (hex: string) => string;
}

interface PaletteDetailProps {
  palette: Palette;
  activeColorHex: string;
  activeAlpha: number;
  onBack: () => void;
  onUseColor: (hex: string, alpha: number) => void;
  onAddCurrentColor: () => void;
  onRemoveColor: (colorId: string) => void;
  onDeletePalette: () => void;
  isSubmitting: boolean;
  labels: PaletteDetailLabels;
}

export function PaletteDetail({
  palette,
  activeColorHex,
  activeAlpha,
  onBack,
  onUseColor,
  onAddCurrentColor,
  onRemoveColor,
  onDeletePalette,
  isSubmitting,
  labels,
}: PaletteDetailProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-caption text-muted hover:text-ink"
        >
          <ArrowLeft size={12} /> {labels.back}
        </button>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          aria-label={labels.deletePalette}
          className="text-muted hover:text-red-400"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <p className="text-caption text-ink truncate">{palette.name}</p>

      {confirmingDelete && (
        <div className="flex items-center justify-between gap-2 bg-canvas border border-line px-2 py-1">
          <span className="text-caption text-ink">{labels.deletePaletteConfirm}</span>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="text-caption text-muted hover:text-ink"
            >
              {labels.cancel}
            </button>
            <button
              type="button"
              onClick={onDeletePalette}
              disabled={isSubmitting}
              className="text-caption text-red-400 hover:underline disabled:opacity-50"
            >
              {labels.deletePalette}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {palette.colors.length === 0 ? (
          <p className="text-caption text-muted">{labels.empty}</p>
        ) : (
          palette.colors.map((color) => (
            <ColorSwatch
              key={color.id}
              color={color}
              onUse={() => onUseColor(color.hex, color.alpha)}
              onDelete={() => onRemoveColor(color.id)}
              useAriaLabel={labels.useColorAriaLabel(color.hex)}
              deleteAriaLabel={labels.deleteColorAriaLabel(color.hex)}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onAddCurrentColor}
        disabled={isSubmitting}
        className="flex items-center gap-2 text-caption text-accent hover:underline disabled:opacity-50 mt-1"
      >
        <span
          className="w-4 h-4 border-2 border-accent shrink-0"
          style={{ backgroundColor: hexWithAlpha(activeColorHex, activeAlpha) }}
        />
        <span className="flex items-center gap-0.5">
          {labels.addCurrentColor}
        </span>
      </button>
    </div>
  );
}
