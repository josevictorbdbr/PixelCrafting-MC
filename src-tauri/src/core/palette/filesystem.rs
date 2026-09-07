use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;

use super::super::error::AppError;
use super::palette_model::PaletteManifest;

const PALETTES_FILE_NAME: &str = "palettes.json";

/// Caminho do palettes.json na raiz do projeto (irmao do project.json).
pub fn palettes_path(project_dir: &Path) -> PathBuf {
    project_dir.join(PALETTES_FILE_NAME)
}

/// Le o manifesto de paletas do projeto. Se o arquivo ainda nao existe
/// (projeto sem nenhuma paleta criada ate agora), devolve um manifesto
/// vazio - e o estado inicial normal, nao um erro.
pub fn read_manifest(project_dir: &Path) -> Result<PaletteManifest, AppError> {
    let path = palettes_path(project_dir);
    if !path.exists() {
        return Ok(PaletteManifest::default());
    }
    let content = fs::read_to_string(&path)?;
    Ok(serde_json::from_str(&content)?)
}

/// Grava o manifesto de paletas de forma atomica (arquivo.tmp -> rename),
/// mesmo padrao usado em project/filesystem.rs e texture/filesystem.rs.
pub fn write_manifest(project_dir: &Path, manifest: &PaletteManifest) -> Result<(), AppError> {
    write_json_atomic(&palettes_path(project_dir), manifest)
}

fn write_json_atomic<T: Serialize>(path: &Path, value: &T) -> Result<(), AppError> {
    let json = serde_json::to_string_pretty(value)?;
    let tmp_path = path.with_extension("tmp");
    fs::write(&tmp_path, json)?;
    fs::rename(&tmp_path, path)?;
    Ok(())
}
