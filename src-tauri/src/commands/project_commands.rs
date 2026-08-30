use std::path::Path;

use tauri::AppHandle;

use crate::core::error::AppError;
use crate::core::project::{projects_root, ProjectManager, ProjectManifest, ProjectSummary};

/// Lista todos os projetos existentes em disco.
#[tauri::command]
pub fn list_projects(app: AppHandle) -> Result<Vec<ProjectSummary>, AppError> {
    let root = projects_root(&app)?;
    ProjectManager::list(&root)
}

/// Cria um projeto novo com o nome informado.
#[tauri::command]
pub fn create_project(app: AppHandle, name: String) -> Result<ProjectSummary, AppError> {
    let root = projects_root(&app)?;
    ProjectManager::create(&root, &name)
}

/// Remove definitivamente um projeto (identificado pelo UUID interno).
#[tauri::command]
pub fn delete_project(app: AppHandle, id: String) -> Result<(), AppError> {
    let root = projects_root(&app)?;
    ProjectManager::delete(&root, &id)
}

/// Abre um projeto (identificado pelo UUID interno), validando/reparando
/// sua estrutura de pastas antes de devolver o manifest ao frontend.
#[tauri::command]
pub fn open_project(app: AppHandle, id: String) -> Result<ProjectManifest, AppError> {
    let root = projects_root(&app)?;
    ProjectManager::open(&root, &id)
}

/// Atualiza a descricao de um projeto existente.
#[tauri::command]
pub fn update_project_description(
    app: AppHandle,
    id: String,
    description: String,
) -> Result<ProjectManifest, AppError> {
    let root = projects_root(&app)?;
    ProjectManager::update_description(&root, &id, &description)
}

/// Define (ou substitui) o icone do projeto a partir de um arquivo de imagem
/// escolhido pelo usuario (`source_path`, vindo do dialogo nativo).
#[tauri::command]
pub fn set_project_icon(app: AppHandle, id: String, source_path: String) -> Result<(), AppError> {
    let root = projects_root(&app)?;
    ProjectManager::set_icon(&root, &id, Path::new(&source_path))
}

/// Remove o icone do projeto, se existir.
#[tauri::command]
pub fn remove_project_icon(app: AppHandle, id: String) -> Result<(), AppError> {
    let root = projects_root(&app)?;
    ProjectManager::remove_icon(&root, &id)
}

/// Le os bytes do icone do projeto para exibicao no frontend.
/// Retorna `None` se o projeto ainda nao tiver icone definido.
#[tauri::command]
pub fn read_project_icon(app: AppHandle, id: String) -> Result<Option<Vec<u8>>, AppError> {
    let root = projects_root(&app)?;
    ProjectManager::read_icon(&root, &id)
}
