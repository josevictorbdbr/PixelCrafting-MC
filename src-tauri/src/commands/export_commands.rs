use std::path::Path;

use tauri::AppHandle;

use crate::core::error::AppError;
use crate::core::export::{ExportManager, McVersionBucket};
use crate::core::project::projects_root;

/// Exporta o projeto como resource pack (.zip) pronto para o Minecraft, na
/// faixa de versao escolhida pelo usuario. `destination_path` vem do
/// dialogo nativo "Salvar como" no frontend.
#[tauri::command]
pub fn export_project_as_resource_pack(
    app: AppHandle,
    project_id: String,
    mc_version_bucket_id: String,
    destination_path: String,
) -> Result<(), AppError> {
    let root = projects_root(&app)?;
    let bucket = McVersionBucket::from_id(&mc_version_bucket_id)?;
    ExportManager::export(&root, &project_id, bucket, Path::new(&destination_path))
}
