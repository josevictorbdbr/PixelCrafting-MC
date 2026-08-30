use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::{AppHandle, Manager};

use super::super::error::AppError;
use super::project_model::{ProjectManifest, DEFAULT_CATEGORIES};

const APP_FOLDER_NAME: &str = "Pixel Crafting MC";
const PROJECTS_FOLDER_NAME: &str = "Projects";
const MANIFEST_FILE_NAME: &str = "project.json";
/// Convencao igual ao pack.png do Minecraft: icone do projeto na raiz.
const ICON_FILE_NAME: &str = "project.png";

/// Resolve `Documentos/Pixel Crafting MC/Projects`, criando a pasta caso
/// ainda nao exista (primeira execucao do programa).
pub fn projects_root(app: &AppHandle) -> Result<PathBuf, AppError> {
    let documents = app
        .path()
        .document_dir()
        .map_err(|_| AppError::DocumentsDirNotFound)?;

    let root = documents.join(APP_FOLDER_NAME).join(PROJECTS_FOLDER_NAME);
    fs::create_dir_all(&root)?;
    Ok(root)
}

/// Caminho da pasta de um projeto especifico dentro da raiz de projetos.
pub fn project_dir(root: &Path, project_name: &str) -> PathBuf {
    root.join(project_name)
}

/// Caminho do project.json dentro da pasta de um projeto.
pub fn manifest_path(project_dir: &Path) -> PathBuf {
    project_dir.join(MANIFEST_FILE_NAME)
}

/// Caminho do icone do projeto (pode nao existir ainda).
pub fn icon_path(project_dir: &Path) -> PathBuf {
    project_dir.join(ICON_FILE_NAME)
}

/// Cria a pasta do projeto e todas as subpastas padrao de texturas.
pub fn create_project_structure(project_dir: &Path) -> Result<(), AppError> {
    fs::create_dir_all(project_dir)?;
    for category in DEFAULT_CATEGORIES {
        fs::create_dir_all(project_dir.join("textures").join(category))?;
    }
    Ok(())
}

/// Garante que a estrutura de pastas de um projeto existente esta completa,
/// criando o que estiver faltando (projeto criado em versao anterior, pasta
/// apagada manualmente pelo usuario, etc).
pub fn ensure_project_structure(project_dir: &Path) -> Result<(), AppError> {
    create_project_structure(project_dir)
}

/// Grava um valor serializavel em disco de forma atomica: escreve num
/// arquivo temporario e so entao renomeia por cima do destino final,
/// evitando corrupcao caso o processo seja interrompido no meio da escrita.
pub fn write_json_atomic<T: Serialize>(path: &Path, value: &T) -> Result<(), AppError> {
    let json = serde_json::to_string_pretty(value)?;
    let tmp_path = path.with_extension("tmp");
    fs::write(&tmp_path, json)?;
    fs::rename(&tmp_path, path)?;
    Ok(())
}

/// Grava bytes crus em disco de forma atomica (mesmo padrao acima, usado
/// pelo icone do projeto, que e binario e nao passa por serde_json).
pub fn write_bytes_atomic(path: &Path, bytes: &[u8]) -> Result<(), AppError> {
    let tmp_path = path.with_extension("tmp");
    fs::write(&tmp_path, bytes)?;
    fs::rename(&tmp_path, path)?;
    Ok(())
}

/// Le e desserializa o project.json de uma pasta de projeto.
pub fn read_manifest(project_dir: &Path) -> Result<ProjectManifest, AppError> {
    let path = manifest_path(project_dir);
    let content = fs::read_to_string(&path)
        .map_err(|_| AppError::ProjectJsonMissing)?;
    serde_json::from_str(&content)
        .map_err(|_| AppError::ProjectJsonCorrupted)
}

/// Le os bytes do icone do projeto. `None` se o projeto ainda nao tem icone.
pub fn read_icon(project_dir: &Path) -> Result<Option<Vec<u8>>, AppError> {
    let path = icon_path(project_dir);
    if !path.exists() {
        return Ok(None);
    }
    Ok(Some(fs::read(&path)?))
}

/// Remove o icone do projeto. Idempotente: nao e erro remover um icone
/// que ja nao existe.
pub fn delete_icon(project_dir: &Path) -> Result<(), AppError> {
    let path = icon_path(project_dir);
    if path.exists() {
        fs::remove_file(&path)?;
    }
    Ok(())
}

/// Lista as subpastas diretas de `root` (cada uma e um possivel projeto).
pub fn list_project_dirs(root: &Path) -> Result<Vec<PathBuf>, AppError> {
    let mut dirs = Vec::new();
    for entry in fs::read_dir(root)? {
        let entry = entry?;
        if entry.file_type()?.is_dir() {
            dirs.push(entry.path());
        }
    }
    Ok(dirs)
}

/// Remove a pasta de um projeto e todo o seu conteudo.
pub fn delete_project_dir(project_dir: &Path) -> Result<(), AppError> {
    fs::remove_dir_all(project_dir)?;
    Ok(())
}
