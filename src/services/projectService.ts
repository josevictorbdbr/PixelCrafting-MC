import { invoke } from "@tauri-apps/api/core";
import type { ProjectManifest, ProjectSummary } from "../types/project";
import type { McVersionBucketId } from "../types/export";

/**
 * Unico ponto de contato com os Tauri commands de projeto.
 * Nenhum componente deve chamar invoke() diretamente - tudo passa por aqui.
 * Erros vindos do backend chegam como `{ code, params }` (ver AppError em
 * core/error.rs e AppErrorPayload em types/error.ts)
 * `translateError(t, err)` (i18n/errors.ts) antes de exibir ao usuario.
 */

export function listProjects(): Promise<ProjectSummary[]> {
  return invoke("list_projects");
}

export function createProject(name: string): Promise<ProjectSummary> {
  return invoke("create_project", { name });
}

export function deleteProject(id: string): Promise<void> {
  return invoke("delete_project", { id });
}

export function openProject(id: string): Promise<ProjectManifest> {
  return invoke("open_project", { id });
}

export function updateProjectDescription(id: string, description: string): Promise<ProjectManifest> {
  return invoke("update_project_description", { id, description });
}

/** `sourcePath` vem do dialogo nativo de escolha de arquivo. */
export function setProjectIcon(id: string, sourcePath: string): Promise<void> {
  return invoke("set_project_icon", { id, sourcePath });
}

export function removeProjectIcon(id: string): Promise<void> {
  return invoke("remove_project_icon", { id });
}

/** `null` quando o projeto ainda nao tem icone. */
export function readProjectIcon(id: string): Promise<number[] | null> {
  return invoke("read_project_icon", { id });
}

/** `destinationPath` vem do dialogo nativo "Salvar como" (filtro .zip). */
export function exportProjectAsResourcePack(
  projectId: string,
  mcVersionBucketId: McVersionBucketId,
  destinationPath: string,
): Promise<void> {
  return invoke("export_project_as_resource_pack", { projectId, mcVersionBucketId, destinationPath });
}
