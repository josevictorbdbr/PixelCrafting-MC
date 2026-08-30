import { useEffect, useState } from "react";
import type { ProjectSummary } from "../../types/project";
import { formatDate } from "../../utils/formatDate";
import { useTranslation } from "../../i18n/useTranslation";
import { readProjectIcon } from "../../services/projectService";

interface ProjectListItemProps {
  project: ProjectSummary;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

export function ProjectListItem({
  project,
  selected,
  onSelect,
  onOpen,
}: ProjectListItemProps) {
  const t = useTranslation();
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  // Busca o icone do projeto (se existir) so para exibir a miniatura na lista.
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

  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpen}
      className={`w-full flex items-center justify-between px-4 py-3 text-left border-l-2 transition-colors cursor-pointer ${
        selected
          ? "border-accent bg-panel"
          : "border-transparent hover:bg-panel/50"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-8 border border-line bg-canvas shrink-0 overflow-hidden flex items-center justify-center">
          {iconUrl && <img src={iconUrl} alt="" className="size-full object-cover" />}
        </div>
        <span className="text-body text-ink truncate">{project.name}</span>
      </div>
      <span className="text-caption text-muted shrink-0">
        {t.project.modifiedOn(formatDate(project.updatedAt))}
      </span>
    </button>
  );
}
