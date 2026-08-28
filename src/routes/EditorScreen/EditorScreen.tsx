import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useUIStore } from "../../store/useUIStore";
import { useProjectStore } from "../../store/useProjectStore";
import { useEditorStore, computeDefaultZoom } from "../../store/useEditorStore";
import { IconButton } from "../../components/common/IconButton";
import { Button } from "../../components/common/Button";
import { Toolbar } from "../../components/editor/Toolbar";
import { PixelCanvas } from "../../components/editor/PixelCanvas";
import { ZoomControl } from "../../components/editor/ZoomControl";
import { LayerPanel } from "../../components/editor/LayerPanel";
import { ColorPalette } from "../../components/editor/ColorPalette";
import { TemplatePicker } from "../../components/editor/TemplatePicker";
import { ColorPickerDialog } from "../../components/editor/ColorPickerDialog";
import { ResizeTextureDialog } from "../../components/editor/ResizeTextureDialog";
import { SaveAsTextureDialog } from "../../components/editor/SaveAsTextureDialog";
import { PropertiesPanel } from "../../components/editor/PropertiesPanel";
import { PixelEditorEngine } from "../../editor/PixelEditorEngine";
import {
  loadTextureLayers,
  resizeTexture,
  saveTextureLayers,
  saveTextureLayersAs,
  type TextureLayersPayload,
} from "../../services/textureService";
import type { CategoryId } from "../../types/texture";
import { AutosaveService } from "../../services/autosaveService";
import { hexToRgba, rgbaToHex } from "../../utils/color";
import { useTranslation } from "../../i18n/useTranslation";
import { translateError } from "../../i18n/errors";

const AUTOSAVE_DELAY_MS = 1500;

export function EditorScreen() {
  const t = useTranslation();
  const goTo = useUIStore((s) => s.goTo);
  const activeProject = useProjectStore((s) => s.activeProject);

  const activeTexture = useEditorStore((s) => s.activeTexture);
  const activeTool = useEditorStore((s) => s.activeTool);
  const activeColor = useEditorStore((s) => s.activeColor);
  const activeAlpha = useEditorStore((s) => s.activeAlpha);
  const setActiveAlpha = useEditorStore((s) => s.setActiveAlpha);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const showGrid = useEditorStore((s) => s.showGrid);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const setActiveColor = useEditorStore((s) => s.setActiveColor);
  const zoomIn = useEditorStore((s) => s.zoomIn);
  const zoomOut = useEditorStore((s) => s.zoomOut);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const clearActiveTexture = useEditorStore((s) => s.clearActiveTexture);
  const setActiveTexture = useEditorStore((s) => s.setActiveTexture);

  const [engine, setEngine] = useState<PixelEditorEngine | null>(null);
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showResizeDialog, setShowResizeDialog] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeError, setResizeError] = useState<string | null>(null);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [isSavingAs, setIsSavingAs] = useState(false);
  const [saveAsError, setSaveAsError] = useState<string | null>(null);

  const engineRef = useRef<PixelEditorEngine | null>(null);
  const autosaveRef = useRef(new AutosaveService(AUTOSAVE_DELAY_MS));

  // Sem textura ativa (ex.: usuario chegou aqui sem passar pela MainScreen).
  useEffect(() => {
    if (!activeTexture) goTo("main");
  }, [activeTexture, goTo]);

  const handleBack = useCallback(() => {
    clearActiveTexture();
    goTo("main");
  }, [clearActiveTexture, goTo]);

  /** Grava o estado completo das camadas no disco. Lanca erro para quem chamar decidir como tratar. */
  const flushSave = useCallback(
    async (eng: PixelEditorEngine, projectId: string, category: string, name: string) => {
      const payload = eng.toSavePayload();
      await saveTextureLayers(projectId, category, name, payload.width, payload.height, payload.activeLayerId, payload.layers);
      eng.markSaved();
      bump();
    },
    [bump],
  );

  /** flushSave + confirmacao visual "Salvo" (usado pelo botao/atalho e pelo autosave). */
  const performSave = useCallback(
    async (eng: PixelEditorEngine, projectId: string, category: string, name: string) => {
      await flushSave(eng, projectId, category, name);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    },
    [flushSave],
  );

  /**
   * Monta um PixelEditorEngine novo a partir das camadas carregadas do
   * backend, com os callbacks (conta-gotas, autosave) ja conectados.
   * Reaproveitado tanto no carregamento inicial quanto depois de um
   * redimensionamento (o arquivo muda de tamanho, entao o engine precisa
   * ser reconstruido).
   */
  const buildEngineFromLayers = useCallback(
    (payload: TextureLayersPayload, projectId: string, category: string, name: string) => {
      const newEngine = new PixelEditorEngine(payload.width, payload.height, payload.layers, payload.activeLayerId);
      newEngine.onColorPicked = (color) => {
        setActiveColor(rgbaToHex(color));
        setActiveAlpha(color[3]);
      };
      newEngine.onChange = () => {
        bump();
        if (newEngine.isDirty) {
          autosaveRef.current.schedule(() => {
            performSave(newEngine, projectId, category, name).catch((err) => {
              console.error("Autosave falhou:", err);
            });
          });
        }
      };
      return newEngine;
    },
    [setActiveColor, setActiveAlpha, bump, performSave],
  );

  // Carrega as camadas reais da textura.
  // O cleanup salva imediatamente o que estava sendo editado antes de
  // trocar de textura ou sair do Editor, se houver algo nao salvo
  useEffect(() => {
    if (!activeProject || !activeTexture) return;
    const projectId = activeProject.id;
    const category = activeTexture.category;
    const name = activeTexture.name;
    let cancelled = false;

    setEngine(null);
    engineRef.current = null;
    setLoadError(null);

    loadTextureLayers(projectId, category, name)
      .then((payload) => {
        if (cancelled) return;
        const newEngine = buildEngineFromLayers(payload, projectId, category, name);
        engineRef.current = newEngine;
        setEngine(newEngine);
        setZoom(computeDefaultZoom(payload.width, payload.height));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(translateError(t, err));
      });

    return () => {
      cancelled = true;
      autosaveRef.current.cancel();
      const prevEngine = engineRef.current;
      if (prevEngine?.isDirty) {
        flushSave(prevEngine, projectId, category, name).catch((err) => {
          console.error("Autosave (ao trocar de textura) falhou:", err);
        });
      }
    };
  }, [activeProject, activeTexture]);

  // Mantem ferramenta/cor ativas do engine sincronizadas com o store.
  useEffect(() => {
    engine?.setActiveTool(activeTool);
  }, [engine, activeTool]);

  useEffect(() => {
    if (engine) engine.setActiveColor(hexToRgba(activeColor, activeAlpha));
  }, [engine, activeColor, activeAlpha]);

  const handleSave = useCallback(async () => {
    if (!engine || !activeProject || !activeTexture) return;
    autosaveRef.current.cancel();
    setIsSaving(true);
    setSaveError(null);
    try {
      await performSave(engine, activeProject.id, activeTexture.category, activeTexture.name);
    } catch (err) {
      setSaveError(translateError(t, err));
    } finally {
      setIsSaving(false);
    }
  }, [engine, activeProject, activeTexture, performSave]);

  // Redimensiona a tela da textura: salva o que estiver pendente primeiro
  // (o resize opera sobre o arquivo em disco, entao precisa estar
  // atualizado), chama o backend, e recarrega o engine com o novo tamanho.
  const handleResizeConfirm = useCallback(
    async (width: number, height: number) => {
      if (!engine || !activeProject || !activeTexture) return;
      const projectId = activeProject.id;
      const { category, name } = activeTexture;

      setIsResizing(true);
      setResizeError(null);
      try {
        autosaveRef.current.cancel();
        if (engine.isDirty) {
          await flushSave(engine, projectId, category, name);
        }
        await resizeTexture(projectId, category, name, width, height);

        const payload = await loadTextureLayers(projectId, category, name);
        const newEngine = buildEngineFromLayers(payload, projectId, category, name);
        engineRef.current = newEngine;
        setEngine(newEngine);
        setZoom(computeDefaultZoom(payload.width, payload.height));
        setShowResizeDialog(false);
      } catch (err) {
        setResizeError(translateError(t, err));
      } finally {
        setIsResizing(false);
      }
    },
    [engine, activeProject, activeTexture, flushSave, buildEngineFromLayers, setZoom],
  );

  // "Salvar como": grava as camadas atuais numa textura NOVA (nome/categoria
  // escolhidos no dialog) e passa a editar esse arquivo novo - marca o
  // engine atual como salvo ANTES de trocar a textura ativa, para o efeito
  // de troca de textura (useEffect acima) nao tentar re-salvar por cima do
  // arquivo original.
  const handleSaveAsConfirm = useCallback(
    async (name: string, category: CategoryId) => {
      if (!engine || !activeProject) return;

      setIsSavingAs(true);
      setSaveAsError(null);
      try {
        autosaveRef.current.cancel();
        const payload = engine.toSavePayload();
        const created = await saveTextureLayersAs(
          activeProject.id,
          category,
          name,
          payload.width,
          payload.height,
          payload.activeLayerId,
          payload.layers,
        );
        engine.markSaved();
        setActiveTexture(created);
        setShowSaveAsDialog(false);
      } catch (err) {
        setSaveAsError(translateError(t, err));
      } finally {
        setIsSavingAs(false);
      }
    },
    [engine, activeProject, t, setActiveTexture],
  );

  // Esc volta; Ctrl+Z desfaz; Ctrl+Shift+Z / Ctrl+Y refaz; Ctrl+S salva;
  // Delete/Backspace apaga o conteudo da selecao ativa (se houver).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleBack();
        return;
      }
      if (!engine) return;
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (ctrlOrCmd && key === "z") {
        e.preventDefault();
        if (e.shiftKey) engine.redo();
        else engine.undo();
        bump();
      } else if (ctrlOrCmd && key === "y") {
        e.preventDefault();
        engine.redo();
        bump();
      } else if (ctrlOrCmd && key === "s") {
        e.preventDefault();
        handleSave();
      } else if ((e.key === "Delete" || e.key === "Backspace") && engine.selection) {
        e.preventDefault();
        engine.clearSelectionRect();
        bump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [engine, handleBack, handleSave, bump]);

  if (!activeTexture) return null;

  return (
    <div className="h-screen flex flex-col bg-canvas">
      {/* Topo */}
      <header className="flex items-center justify-between gap-4 px-panel h-14 border-b border-line shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <IconButton icon={<ArrowLeft size={18} />} label={t.editor.backToTextures} onClick={handleBack} />
          <h1 className="text-section-title text-ink truncate">
            {activeTexture.name}.png{engine?.isDirty ? " •" : ""}
          </h1>
        </div>
        <div className="flex items-center gap-button-gap shrink-0">
          <Button variant="outline" onClick={handleSave} disabled={isSaving || !engine}>
            {isSaving ? t.common.saving : justSaved ? t.common.saved : t.common.save}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSaveAsError(null);
              setShowSaveAsDialog(true);
            }}
            disabled={!engine}
          >
            {t.editor.saveAsButton}
          </Button>
        </div>
      </header>
      {saveError && (
        <p className="text-caption text-red-400 text-center py-1 border-b border-line">{saveError}</p>
      )}

      {/* Corpo: ferramentas + canvas + paineis */}
      <div className="flex-1 flex min-h-0">
        <div className="w-48 shrink-0 border-r border-line flex flex-col min-h-0">
          <Toolbar
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            onUndo={() => {
              engine?.undo();
              bump();
            }}
            onRedo={() => {
              engine?.redo();
              bump();
            }}
            canUndo={!!engine?.history.canUndo}
            canRedo={!!engine?.history.canRedo}
            onResize={() => {
              setResizeError(null);
              setShowResizeDialog(true);
            }}
            bucketFillMode={engine?.bucketFillMode ?? "contiguous"}
            onBucketFillModeChange={(mode) => engine?.setBucketFillMode(mode)}
          />
          <div className="p-2 border-t border-line shrink-0 flex flex-col gap-2">
            {engine && <TemplatePicker engine={engine} />}
            <ColorPalette
              activeColor={activeColor}
              activeAlpha={activeAlpha}
              onOpenPicker={() => setShowColorPicker(true)}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 bg-panel">
          <div className="flex-1 flex items-center justify-center overflow-auto p-8">
            {loadError ? (
              <p className="text-body text-red-400">{loadError}</p>
            ) : !engine ? (
              <div className="flex items-center gap-2 text-muted text-body">
                <Loader2 size={16} className="animate-spin" />
                {t.editor.loadingTexture}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <PixelCanvas engine={engine} zoom={zoom} showGrid={showGrid} />
                {engine.selection && (
                  <p className="text-caption text-muted">
                    {t.editor.activeSelectionHint}
                  </p>
                )}
              </div>
            )}
          </div>
          <ZoomControl
            zoom={zoom}
            showGrid={showGrid}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onToggleGrid={toggleGrid}
          />
        </div>

        <aside className="w-56 shrink-0 border-l border-line p-panel flex flex-col gap-6 overflow-y-auto">
          {engine && <LayerPanel engine={engine} />}
          <PropertiesPanel
            name={activeTexture.name}
            category={activeTexture.category}
            dimensions={engine ? { width: engine.width, height: engine.height } : null}
          />
        </aside>
      </div>

      {showColorPicker && (
        <ColorPickerDialog
          initialHex={activeColor}
          initialAlpha={activeAlpha}
          onCancel={() => setShowColorPicker(false)}
          onConfirm={(hex, alpha) => {
            setActiveColor(hex);
            setActiveAlpha(alpha);
            setShowColorPicker(false);
          }}
        />
      )}

      {showResizeDialog && engine && (
        <ResizeTextureDialog
          initialWidth={engine.width}
          initialHeight={engine.height}
          onCancel={() => {
            setShowResizeDialog(false);
            setResizeError(null);
          }}
          onConfirm={handleResizeConfirm}
          isSubmitting={isResizing}
          error={resizeError}
        />
      )}

      {showSaveAsDialog && engine && (
        <SaveAsTextureDialog
          defaultCategory={activeTexture.category}
          currentWidth={engine.width}
          currentHeight={engine.height}
          onCancel={() => {
            setShowSaveAsDialog(false);
            setSaveAsError(null);
          }}
          onConfirm={handleSaveAsConfirm}
          isSubmitting={isSavingAs}
          error={saveAsError}
        />
      )}
    </div>
  );
}
