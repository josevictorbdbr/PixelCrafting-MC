import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type { Palette } from "../../../types/palette";
import {
  addPaletteColor,
  createPalette,
  deletePalette,
  listPalettes,
  removePaletteColor,
} from "../../../services/paletteService";
import { useTranslation } from "../../../i18n/useTranslation";
import { translateError } from "../../../i18n/errors";
import { PaletteList } from "./PaletteList";
import { PaletteDetail } from "./PaletteDetail";

interface PalettesPanelProps {
  projectId: string;
  activeColorHex: string;
  activeAlpha: number;
  /** Aplica uma cor da paleta como cor ativa do pincel. */
  onUseColor: (hex: string, alpha: number) => void;
}

export function PalettesPanel({ projectId, activeColorHex, activeAlpha, onUseColor }: PalettesPanelProps) {
  const t = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [palettes, setPalettes] = useState<Palette[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePaletteId, setActivePaletteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recarrega ao trocar de projeto (nao deveria acontecer dentro do
  // Editor, mas mantem o painel correto se o componente for reaproveitado).
  useEffect(() => {
    let cancelled = false;
    setPalettes(null);
    setError(null);
    setActivePaletteId(null);
    listPalettes(projectId)
      .then((result) => {
        if (!cancelled) setPalettes(result);
      })
      .catch((err) => {
        if (!cancelled) setError(translateError(t, err));
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const activePalette = palettes?.find((p) => p.id === activePaletteId) ?? null;

  /** Proximo nome default disponivel ("Palette 1", "Palette 2"...). */
  const nextDefaultName = () => {
    const used = new Set((palettes ?? []).map((p) => p.name.toLowerCase()));
    let n = 1;
    while (used.has(t.editor.paletteDefaultName(n).toLowerCase())) n++;
    return t.editor.paletteDefaultName(n);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createPalette(projectId, nextDefaultName());
      setPalettes((prev) => [...(prev ?? []), created]);
      setActivePaletteId(created.id);
    } catch (err) {
      setError(translateError(t, err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!activePalette) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await deletePalette(projectId, activePalette.id);
      setPalettes((prev) => (prev ?? []).filter((p) => p.id !== activePalette.id));
      setActivePaletteId(null);
    } catch (err) {
      setError(translateError(t, err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCurrentColor = async () => {
    if (!activePalette) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await addPaletteColor(projectId, activePalette.id, activeColorHex, activeAlpha);
      setPalettes((prev) => (prev ?? []).map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      setError(translateError(t, err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveColor = async (colorId: string) => {
    if (!activePalette) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await removePaletteColor(projectId, activePalette.id, colorId);
      setPalettes((prev) => (prev ?? []).map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      setError(translateError(t, err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t border-line pt-3">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-between w-full text-caption text-muted uppercase tracking-wide"
      >
        <span>{t.editor.palettesHeading}</span>
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
      </button>

      {!collapsed && (
        <div className="mt-2">
          {error && <p className="text-caption text-red-400 mb-2">{error}</p>}

          {!palettes ? (
            <div className="flex items-center gap-2 text-muted text-caption">
              <Loader2 size={14} className="animate-spin" />
              {t.common.loading}
            </div>
          ) : activePalette ? (
            <PaletteDetail
              palette={activePalette}
              activeColorHex={activeColorHex}
              activeAlpha={activeAlpha}
              onBack={() => setActivePaletteId(null)}
              onUseColor={onUseColor}
              onAddCurrentColor={handleAddCurrentColor}
              onRemoveColor={handleRemoveColor}
              onDeletePalette={handleDelete}
              isSubmitting={isSubmitting}
              labels={{
                back: t.editor.backToPalettes,
                addCurrentColor: t.editor.addCurrentColorButton,
                deletePalette: t.editor.deletePaletteButton,
                deletePaletteConfirm: t.editor.deletePaletteConfirm,
                cancel: t.common.cancel,
                empty: t.editor.paletteEmpty,
                useColorAriaLabel: t.editor.useColorAriaLabel,
                deleteColorAriaLabel: t.editor.deleteColorAriaLabel,
              }}
            />
          ) : (
            <PaletteList
              palettes={palettes}
              onSelect={setActivePaletteId}
              onCreate={handleCreate}
              isCreating={isSubmitting}
              emptyLabel={t.editor.palettesEmpty}
              newPaletteLabel={t.editor.newPaletteButton}
            />
          )}
        </div>
      )}
    </div>
  );
}
