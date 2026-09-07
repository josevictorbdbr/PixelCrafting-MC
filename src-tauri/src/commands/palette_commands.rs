use tauri::AppHandle;

use crate::core::error::AppError;
use crate::core::palette::{Palette, PaletteManager};
use crate::core::project::{projects_root, ProjectManager};

/// Lista todas as paletas do projeto (identificado pelo UUID interno).
#[tauri::command]
pub fn list_palettes(app: AppHandle, project_id: String) -> Result<Vec<Palette>, AppError> {
    let root = projects_root(&app)?;
    let project_dir = ProjectManager::dir_by_id(&root, &project_id)?;
    PaletteManager::list(&project_dir)
}

/// Cria uma paleta nova, vazia.
#[tauri::command]
pub fn create_palette(app: AppHandle, project_id: String, name: String) -> Result<Palette, AppError> {
    let root = projects_root(&app)?;
    let project_dir = ProjectManager::dir_by_id(&root, &project_id)?;
    PaletteManager::create(&project_dir, &name)
}

/// Remove uma paleta inteira (identificada pelo UUID interno da paleta).
#[tauri::command]
pub fn delete_palette(app: AppHandle, project_id: String, palette_id: String) -> Result<(), AppError> {
    let root = projects_root(&app)?;
    let project_dir = ProjectManager::dir_by_id(&root, &project_id)?;
    PaletteManager::delete(&project_dir, &palette_id)
}

/// Adiciona uma cor ao final de uma paleta e devolve a paleta atualizada.
#[tauri::command]
pub fn add_palette_color(
    app: AppHandle,
    project_id: String,
    palette_id: String,
    hex: String,
    alpha: u8,
) -> Result<Palette, AppError> {
    let root = projects_root(&app)?;
    let project_dir = ProjectManager::dir_by_id(&root, &project_id)?;
    PaletteManager::add_color(&project_dir, &palette_id, &hex, alpha)
}

/// Remove uma cor de uma paleta e devolve a paleta atualizada.
#[tauri::command]
pub fn remove_palette_color(
    app: AppHandle,
    project_id: String,
    palette_id: String,
    color_id: String,
) -> Result<Palette, AppError> {
    let root = projects_root(&app)?;
    let project_dir = ProjectManager::dir_by_id(&root, &project_id)?;
    PaletteManager::remove_color(&project_dir, &palette_id, &color_id)
}
