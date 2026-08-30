import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { useTranslation } from "../../i18n/useTranslation";
import { translateError } from "../../i18n/errors";
import type { ProjectManifest } from "../../types/project";
import {
  readProjectIcon,
  removeProjectIcon,
  setProjectIcon,
  updateProjectDescription,
} from "../../services/projectService";

interface EditProjectDialogProps {
  project: ProjectManifest;
  onClose: () => void;
  onUpdated: (project: ProjectManifest) => void;
}

/** Edicao de descricao + icone de um projeto ja existente. */
export function EditProjectDialog({ project, onClose, onUpdated }: EditProjectDialogProps) {
  const t = useTranslation();

  const [description, setDescription] = useState(project.description);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [pendingIconPath, setPendingIconPath] = useState<string | null>(null);
  const [removeIcon, setRemoveIcon] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega o icone atual (se existir) so para o preview.
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    readProjectIcon(project.id).then((bytes) => {
      if (cancelled || !bytes) return;
      const blob = new Blob([new Uint8Array(bytes)], { type: "image/png" });
      objectUrl = URL.createObjectURL(blob);
      setIconUrl(objectUrl);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [project.id]);

  const handleChooseIcon = async () => {
    const path = await open({
      filters: [{ name: t.texture.pngFilterName, extensions: ["png"] }],
      multiple: false,
    });
    if (!path || Array.isArray(path)) return;
    setPendingIconPath(path);
    setRemoveIcon(false);
  };

  const handleRemoveIcon = () => {
    setPendingIconPath(null);
    setRemoveIcon(true);
    setIconUrl(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      let updated = project;
      if (description !== project.description) {
        updated = await updateProjectDescription(project.id, description);
      }
      if (pendingIconPath) {
        await setProjectIcon(project.id, pendingIconPath);
      } else if (removeIcon) {
        await removeProjectIcon(project.id);
      }
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(translateError(t, err));
    } finally {
      setIsSaving(false);
    }
  };

  const pendingIconName = pendingIconPath?.split(/[\\/]/).pop();
  const showPreview = Boolean(iconUrl) && !removeIcon;
  const showRemoveButton = (Boolean(iconUrl) || Boolean(pendingIconPath)) && !removeIcon;

  return (
    <Modal title={t.project.editProjectDialogTitle} onClose={onClose}>
      <div className="mb-4">
        <label className="text-caption text-muted block mb-2">{t.project.iconLabel}</label>
        <div className="flex items-center gap-3">
          <div className="size-16 border border-line rounded-none bg-canvas flex items-center justify-center overflow-hidden shrink-0">
            {showPreview && <img src={iconUrl!} alt="" className="size-full object-cover" />}
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={handleChooseIcon} disabled={isSaving}>
              {t.project.chooseIconButton}
            </Button>
            {showRemoveButton && (
              <Button variant="ghost" onClick={handleRemoveIcon} disabled={isSaving}>
                {t.project.removeIconButton}
              </Button>
            )}
            {pendingIconName && (
              <span className="text-caption text-muted truncate max-w-40">{pendingIconName}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-2">
        <label className="text-caption text-muted block mb-2">{t.project.descriptionLabel}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.project.descriptionPlaceholder}
          disabled={isSaving}
          rows={3}
          className="w-full px-3 py-2 rounded-sm bg-canvas border border-line text-ink text-body outline-none focus:border-accent disabled:opacity-60 resize-none"
        />
      </div>

      {error && <p className="text-caption text-red-400 mt-2">{error}</p>}

      <div className="flex justify-end gap-button-gap mt-4">
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          {t.common.cancel}
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? t.common.saving : t.common.save}
        </Button>
      </div>
    </Modal>
  );
}
