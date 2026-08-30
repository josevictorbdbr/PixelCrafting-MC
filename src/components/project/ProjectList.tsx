import type { ProjectSummary } from "../../types/project";
import { useTranslation } from "../../i18n/useTranslation";
import { ProjectListItem } from "./ProjectListItem";

interface ProjectListProps {
  projects: ProjectSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  newProjectButtonLabel: string;
  /** Muda depois de uma edicao (descricao/icone) para forcar os itens a
   * buscar o icone de novo - ver comentario em ProjectListItem. */
  iconRefreshKey: number;
}

export function ProjectList({
  projects,
  selectedId,
  onSelect,
  onOpen,
  newProjectButtonLabel,
  iconRefreshKey,
}: ProjectListProps) {
  const t = useTranslation();

  if (projects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted text-body">
        {t.project.emptyList(newProjectButtonLabel)}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-line">
      {projects.map((project) => (
        <ProjectListItem
          // O icone e buscado uma vez no mount do item (ver ProjectListItem);
          // incluir iconRefreshKey na key forca remontar (e rebuscar) todos
          // os itens quando um icone e editado em outro projeto da lista -
          // custo desprezivel para o numero tipico de projetos.
          key={`${project.id}:${iconRefreshKey}`}
          project={project}
          selected={project.id === selectedId}
          onSelect={() => onSelect(project.id)}
          onOpen={() => onOpen(project.id)}
        />
      ))}
    </div>
  );
}
