use std::io::Cursor;
use std::path::{Path, PathBuf};

use crate::core::validation;

use super::super::error::{AppError, EntityKind};
use super::filesystem;
use super::project_model::{ProjectManifest, ProjectSummary};
use super::uuid_gen;

/// Ponto unico de acesso ao gerenciamento de projetos em disco.
/// Nenhum outro modulo deve manipular arquivos de projeto diretamente.
///
/// Recebe sempre a pasta raiz (`root`) ja resolvida pelo chamador - isso
/// mantem o ProjectManager livre de qualquer dependencia do Tauri, entao
/// ele pode ser testado com um diretorio temporario comum.
pub struct ProjectManager;

impl ProjectManager {
    /// Lista todos os projetos existentes, mais recentemente modificados primeiro.
    /// Pastas sem um project.json valido sao ignoradas (nao derrubam a lista toda).
    pub fn list(root: &Path) -> Result<Vec<ProjectSummary>, AppError> {
        let mut summaries: Vec<ProjectSummary> = filesystem::list_project_dirs(root)?
            .iter()
            .filter_map(|dir| match filesystem::read_manifest(dir) {
                Ok(manifest) => Some(ProjectSummary::from(&manifest)),
                Err(err) => {
                    log::warn!("Ignorando pasta de projeto invalida ({dir:?}): {err}");
                    None
                }
            })
            .collect();

        summaries.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        Ok(summaries)
    }

    /// Cria um projeto novo: valida o nome, gera a estrutura de pastas e o
    /// project.json inicial (com um UUID permanente).
    pub fn create(root: &Path, name: &str) -> Result<ProjectSummary, AppError> {
        let existing_names = Self::existing_names(root)?;
        validation::validate_name(name, &existing_names, EntityKind::Project)?;

        let project_dir = filesystem::project_dir(root, name);
        if project_dir.exists() {
            return Err(AppError::AlreadyExists {
                entity: EntityKind::Project,
                name: name.to_string(),
            });
        }

        filesystem::create_project_structure(&project_dir)?;

        let manifest = ProjectManifest::new(name.to_string());
        filesystem::write_json_atomic(&filesystem::manifest_path(&project_dir), &manifest)?;

        Ok(ProjectSummary::from(&manifest))
    }

    /// Remove um projeto (pasta inteira) a partir do seu UUID interno.
    pub fn delete(root: &Path, id: &str) -> Result<(), AppError> {
        if !uuid_gen::is_valid(id) {
            return Err(AppError::InvalidUuid);
        }

        let (project_dir, _manifest) = Self::find_by_id(root, id)?;
        filesystem::delete_project_dir(&project_dir)
    }

    /// Abre um projeto: localiza pelo UUID, garante que a estrutura de pastas
    /// esteja completa (autocura pastas faltando) e devolve o manifest.
    pub fn open(root: &Path, id: &str) -> Result<ProjectManifest, AppError> {
        if !uuid_gen::is_valid(id) {
            return Err(AppError::InvalidUuid);
        }

        let (project_dir, manifest) = Self::find_by_id(root, id)?;
        filesystem::ensure_project_structure(&project_dir)?;
        Ok(manifest)
    }

    /// Atualiza a descricao de um projeto existente e devolve o manifest
    /// atualizado (usado pela tela de edicao do projeto).
    pub fn update_description(
        root: &Path,
        id: &str,
        description: &str,
    ) -> Result<ProjectManifest, AppError> {
        let (project_dir, mut manifest) = Self::find_by_id(root, id)?;
        manifest.description = description.to_string();
        manifest.updated_at = chrono::Utc::now().to_rfc3339();
        filesystem::write_json_atomic(&filesystem::manifest_path(&project_dir), &manifest)?;
        Ok(manifest)
    }

    /// Define (ou substitui) o icone do projeto. A imagem de origem e
    /// decodificada e regravada como PNG - garante o formato certo
    /// independente da extensao do arquivo escolhido pelo usuario.
    pub fn set_icon(root: &Path, id: &str, source_path: &Path) -> Result<(), AppError> {
        let project_dir = Self::dir_by_id(root, id)?;

        let image = image::open(source_path)?;
        let mut buffer = Cursor::new(Vec::new());
        image.write_to(&mut buffer, image::ImageFormat::Png)?;

        filesystem::write_bytes_atomic(&filesystem::icon_path(&project_dir), buffer.get_ref())
    }

    /// Remove o icone do projeto, se existir.
    pub fn remove_icon(root: &Path, id: &str) -> Result<(), AppError> {
        let project_dir = Self::dir_by_id(root, id)?;
        filesystem::delete_icon(&project_dir)
    }

    /// Le os bytes do icone do projeto. `None` se o projeto nao tiver icone.
    pub fn read_icon(root: &Path, id: &str) -> Result<Option<Vec<u8>>, AppError> {
        let project_dir = Self::dir_by_id(root, id)?;
        filesystem::read_icon(&project_dir)
    }

    /// Resolve a pasta de um projeto a partir do seu UUID. Usado tambem pelo
    /// modulo de texturas, que precisa do mesmo lookup (sem duplicar a busca).
    pub fn dir_by_id(root: &Path, id: &str) -> Result<PathBuf, AppError> {
        if !uuid_gen::is_valid(id) {
            return Err(AppError::InvalidUuid);
        }
        Self::find_by_id(root, id).map(|(dir, _manifest)| dir)
    }

    /// Nomes (em minusculas) de todos os projetos existentes, para checagem
    /// de duplicados. Projetos corrompidos sao ignorados silenciosamente.
    fn existing_names(root: &Path) -> Result<Vec<String>, AppError> {
        let names: Vec<String> = filesystem::list_project_dirs(root)?
            .iter()
            .filter_map(|dir| filesystem::read_manifest(dir).ok())
            .map(|manifest| manifest.name.to_lowercase())
            .collect();
        Ok(names)
    }

    /// Percorre as pastas de projeto procurando aquela cujo manifest tem o
    /// UUID informado. E a unica forma de "indexar por id" sem banco de dados.
    fn find_by_id(root: &Path, id: &str) -> Result<(PathBuf, ProjectManifest), AppError> {
        for dir in filesystem::list_project_dirs(root)? {
            if let Ok(manifest) = filesystem::read_manifest(&dir) {
                if manifest.id == id {
                    return Ok((dir, manifest));
                }
            }
        }
        Err(AppError::ProjectNotFound)
    }
}
