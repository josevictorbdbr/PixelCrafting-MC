import { X } from "lucide-react";
import type { PaletteColor } from "../../../types/palette";

interface ColorSwatchProps {
  color: PaletteColor;
  onUse: () => void;
  onDelete: () => void;
  useAriaLabel: string;
  deleteAriaLabel: string;
}

/** hex + alpha (0-255) em #RRGGBBAA - suportado pelo WebView2. */
function hexWithAlpha(hex: string, alpha: number): string {
  return `${hex}${Math.round(alpha).toString(16).padStart(2, "0")}`;
}

export function ColorSwatch({ color, onUse, onDelete, useAriaLabel, deleteAriaLabel }: ColorSwatchProps) {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onUse}
        aria-label={useAriaLabel}
        title={color.hex}
        className="w-7 h-7 border border-line rounded-none"
        style={{ backgroundColor: hexWithAlpha(color.hex, color.alpha) }}
      />
      <button
        type="button"
        onClick={onDelete}
        aria-label={deleteAriaLabel}
        className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-4 h-4 bg-panel border border-line text-ink hover:text-red-400"
      >
        <X size={10} />
      </button>
    </div>
  );
}
