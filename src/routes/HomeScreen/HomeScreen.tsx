import { useEffect, useState } from "react";
import { Settings, Plus, FolderOpen, Trash2, Loader2, Pencil } from "lucide-react";
import { useUIStore } from "../../store/useUIStore";
import { useProjectStore } from "../../store/useProjectStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTranslation } from "../../i18n/useTranslation";
import { translateError } from "../../i18n/errors";
import { IconButton } from "../../components/common/IconButton";
import { Button } from "../../components/common/Button";
import { ProjectList } from "../../components/project/ProjectList";
import { NewProjectDialog } from "../../components/project/NewProjectDialog";
import { EditProjectDialog } from "../../components/project/EditProjectDialog";
import type { ProjectManifest, ProjectSummary } from "../../types/project";
import homeBg from "../../assets/homescreen-bg.webp";
import {
  createProject,
  deleteProject,
  listProjects,
  openProject,
} from "../../services/projectService";

const APP_VERSION = "v0.2.0";

export function HomeScreen() {
  const t = useTranslation();
  const goTo = useUIStore((s) => s.goTo);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const openSettings = useSettingsStore((s) => s.openSettings);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Projeto sendo editado (manifest completo, buscado sob demanda - a
  // lista so guarda ProjectSummary, sem description). `iconRefreshKey`
  // forca o ProjectList a remontar os itens e buscar o icone de novo
  // depois de uma edicao (o icone pode ter mudado no dialogo).
  const [editingProject, setEditingProject] = useState<ProjectManifest | null>(null);
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [isLoadingEditTarget, setIsLoadingEditTarget] = useState(false);
  const [iconRefreshKey, setIconRefreshKey] = useState(0);

  // Ao abrir o programa: carregar os projetos existentes automaticamente.
  useEffect(() => {
    let cancelled = false;

    listProjects()
      .then((result) => {
        if (!cancelled) setProjects(result);
      })
      .catch((err) => {
        if (!cancelled) setListError(translateError(t, err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateProject = async (name: string) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await createProject(name);
      setProjects((prev) => [created, ...prev]);
      setShowNewProjectDialog(false);
    } catch (err) {
      setCreateError(translateError(t, err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedId) return;
    setActionError(null);
    try {
      await deleteProject(selectedId);
      setProjects((prev) => prev.filter((p) => p.id !== selectedId));
      setSelectedId(null);
    } catch (err) {
      setActionError(translateError(t, err));
    }
  };

  const handleOpenProject = async (id: string) => {
    setActionError(null);
    try {
      const manifest = await openProject(id);
      setActiveProject(manifest);
      goTo("main");
    } catch (err) {
      setActionError(translateError(t, err));
    }
  };

  // So busca o manifest completo (tem description, que a lista nao
  // guarda) - nao navega para a MainScreen nem mexe no activeProject.
  const handleEditProject = async () => {
    if (!selectedId) return;
    setActionError(null);
    setIsLoadingEditTarget(true);
    try {
      const manifest = await openProject(selectedId);
      setEditingProject(manifest);
      setShowEditProjectDialog(true);
    } catch (err) {
      setActionError(translateError(t, err));
    } finally {
      setIsLoadingEditTarget(false);
    }
  };

  const handleProjectUpdated = (updated: ProjectManifest) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, updatedAt: updated.updatedAt } : p)),
    );
    setIconRefreshKey((key) => key + 1);
  };

  return (
    <div
      className="h-screen flex flex-col bg-canvas"
      style={{
        backgroundImage: `linear-gradient(rgba(30,30,30,0.8), rgba(30,30,30,0.8)), url(${homeBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Topo */}
      <header className="flex items-center justify-between px-panel h-14 border-b border-line shrink-0 bg-canvas">
        <span className="text-caption text-muted tracking-wide">Pixel Crafting MC</span>
        <IconButton icon={<Settings size={18} />} label={t.settings.buttonLabel} onClick={openSettings} />
      </header>

      {/* Centro */}
      <main className="flex-1 flex flex-col items-center px-panel py-8 min-h-0 max-w-3xl w-full mx-auto overflow-y-auto">
        {/* Hero: marca + acao principal, inspirado no concept enviado */}
        <div className="flex flex-col items-center text-center shrink-0 mb-10">
          <div className="flex gap-1 mb-4" aria-hidden>
            <span className="size-3 bg-accent" />
            <span className="size-3 bg-[#4ADE80]" />
            <span className="size-3 bg-[#EF4444]" />
          </div>
          <h1 className="font-display text-ink text-2xl leading-relaxed">
            Pixel Crafting <span className="text-[#4ADE80]">MC</span>
          </h1>
          <p className="text-body text-muted mt-2 mb-8">{t.home.subtitle}</p>
          <Button
            variant="outline"
            className="h-auto py-4 px-8"
            onClick={() => {
              setCreateError(null);
              setShowNewProjectDialog(true);
            }}
          >
            <Plus size={18} />
            {t.home.newProjectButton}
          </Button>
        </div>

        {/* Lista de projetos existentes - painel transparente, ainda escuro,
            para deixar o fundo aparecer por baixo. */}
        <div className="w-full flex flex-col flex-1 min-h-0">
          <h2 className="text-caption text-muted tracking-wide mb-2">{t.home.projectsHeading}</h2>

          <div className="flex-1 flex flex-col border border-line rounded-none overflow-hidden min-h-0 bg-panel/50 backdrop-blur-sm">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center gap-2 text-muted text-body">
                <Loader2 size={16} className="animate-spin" />
                {t.home.loadingProjects}
              </div>
            ) : listError ? (
              <div className="flex-1 flex items-center justify-center text-red-400 text-body text-center px-4">
                {listError}
              </div>
            ) : (
              <ProjectList
                projects={projects}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onOpen={handleOpenProject}
                newProjectButtonLabel={t.home.newProjectButton}
                iconRefreshKey={iconRefreshKey}
              />
            )}
          </div>

          {actionError && (
            <p className="text-caption text-red-400 text-center mt-2">{actionError}</p>
          )}

          <div className="flex justify-center gap-button-gap mt-4">
            <Button
              variant="ghost"
              onClick={() => selectedId && handleOpenProject(selectedId)}
              disabled={!selectedId}
            >
              <FolderOpen size={16} />
              {t.home.openProjectButton}
            </Button>
            <Button variant="ghost" onClick={handleEditProject} disabled={!selectedId || isLoadingEditTarget}>
              <Pencil size={16} />
              {t.project.editProjectButton}
            </Button>
            <Button variant="ghost" onClick={handleDeleteProject} disabled={!selectedId}>
              <Trash2 size={16} />
              {t.home.deleteProjectButton}
            </Button>
          </div>
        </div>
      </main>

      {/* Rodape */}
      <footer className="px-panel py-2 border-t border-line shrink-0 bg-canvas">
        <span className="text-caption text-muted">Pixel Crafting MC — {APP_VERSION}</span>
      </footer>

      {showNewProjectDialog && (
        <NewProjectDialog
          onConfirm={handleCreateProject}
          onCancel={() => setShowNewProjectDialog(false)}
          isSubmitting={isCreating}
          error={createError}
        />
      )}
      {showEditProjectDialog && editingProject && (
        <EditProjectDialog
          project={editingProject}
          onClose={() => setShowEditProjectDialog(false)}
          onUpdated={handleProjectUpdated}
        />
      )}
    </div>
  );
}
