import { useState } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { useTranslation } from "../../i18n/useTranslation";
import { translateError } from "../../i18n/errors";
import type { ProjectManifest } from "../../types/project";
import type { McVersionBucketId } from "../../types/export";
import { exportProjectAsResourcePack } from "../../services/projectService";

interface ExportProjectDialogProps {
  project: ProjectManifest;
  onClose: () => void;
}

const VERSION_OPTIONS: McVersionBucketId[] = ["1.20.2-1.21.1", "1.21.2-1.21.8", "1.21.9+"];

/** Exporta o projeto inteiro como um resource pack (.zip) pronto para o Minecraft. */
export function ExportProjectDialog({ project, onClose }: ExportProjectDialogProps) {
  const t = useTranslation();
  const [bucketId, setBucketId] = useState<McVersionBucketId>("1.21.9+");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    const destination = await save({
      defaultPath: `${project.name}.zip`,
      filters: [{ name: t.export.zipFilterName, extensions: ["zip"] }],
    });
    if (!destination) return;

    setIsExporting(true);
    setError(null);
    try {
      await exportProjectAsResourcePack(project.id, bucketId, destination);
      onClose();
    } catch (err) {
      setError(translateError(t, err));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal title={t.export.dialogTitle} onClose={onClose}>
      <div className="mb-4">
        <label className="text-caption text-muted block mb-2">{t.export.versionLabel}</label>
        <select
          value={bucketId}
          onChange={(e) => setBucketId(e.target.value as McVersionBucketId)}
          disabled={isExporting}
          className="w-full h-[34px] px-3 rounded-sm bg-canvas border border-line text-ink text-body outline-none focus:border-accent disabled:opacity-60"
        >
          {VERSION_OPTIONS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      <p className="text-caption text-muted mb-4">{t.export.miscExcludedNote}</p>

      {error && <p className="text-caption text-red-400 mb-2">{error}</p>}

      <div className="flex justify-end gap-button-gap">
        <Button variant="secondary" onClick={onClose} disabled={isExporting}>
          {t.common.cancel}
        </Button>
        <Button variant="primary" onClick={handleExport} disabled={isExporting}>
          {isExporting ? t.export.exporting : t.export.exportButton}
        </Button>
      </div>
    </Modal>
  );
}
