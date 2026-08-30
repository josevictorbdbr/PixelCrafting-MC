/**
 * Dados de um projeto como o backend os expoe ao frontend.
 * Espelha a struct ProjectSummary do Rust - id nunca e exibido ao usuario,
 * mas viaja junto para ser usado como identificador nas chamadas de backend.
 */
export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
}

/** Retorno de open_project: o manifest completo do projeto (project.json). */
export interface ProjectManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  pixelCraftVersion: string;
}
