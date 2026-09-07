use std::path::Path;

use uuid::Uuid;

use crate::core::validation;

use super::super::error::{AppError, EntityKind};
use super::filesystem;
use super::palette_model::{Palette, PaletteColor, PaletteManifest};

/// Ponto unico de acesso a paletas em disco. Recebe sempre a pasta do
/// projeto ja resolvida - livre do Tauri, testavel isoladamente.
pub struct PaletteManager;

impl PaletteManager {
    pub fn list(project_dir: &Path) -> Result<Vec<Palette>, AppError> {
        Ok(filesystem::read_manifest(project_dir)?.palettes)
    }

    /// Cria uma paleta nova, vazia. Valida o nome (vazio/espacos/
    /// caracteres invalidos/duplicado), igual projeto e textura.
    pub fn create(project_dir: &Path, name: &str) -> Result<Palette, AppError> {
        let mut manifest = filesystem::read_manifest(project_dir)?;

        let existing: Vec<String> = manifest.palettes.iter().map(|p| p.name.to_lowercase()).collect();
        validation::validate_name(name, &existing, EntityKind::Palette)?;

        let palette = Palette {
            id: Uuid::new_v4().to_string(),
            name: name.to_string(),
            colors: Vec::new(),
        };
        manifest.palettes.push(palette.clone());
        filesystem::write_manifest(project_dir, &manifest)?;
        Ok(palette)
    }

    pub fn delete(project_dir: &Path, palette_id: &str) -> Result<(), AppError> {
        let mut manifest = filesystem::read_manifest(project_dir)?;
        let before = manifest.palettes.len();
        manifest.palettes.retain(|p| p.id != palette_id);
        if manifest.palettes.len() == before {
            return Err(AppError::PaletteNotFound { id: palette_id.to_string() });
        }
        filesystem::write_manifest(project_dir, &manifest)
    }

    /// Adiciona uma cor ao final da paleta e devolve a paleta atualizada,
    /// pro frontend atualizar a UI sem recarregar a lista inteira.
    pub fn add_color(project_dir: &Path, palette_id: &str, hex: &str, alpha: u8) -> Result<Palette, AppError> {
        let mut manifest = filesystem::read_manifest(project_dir)?;
        let palette = Self::find_mut(&mut manifest, palette_id)?;
        palette.colors.push(PaletteColor {
            id: Uuid::new_v4().to_string(),
            hex: hex.to_string(),
            alpha,
        });
        let updated = palette.clone();
        filesystem::write_manifest(project_dir, &manifest)?;
        Ok(updated)
    }

    pub fn remove_color(project_dir: &Path, palette_id: &str, color_id: &str) -> Result<Palette, AppError> {
        let mut manifest = filesystem::read_manifest(project_dir)?;
        let palette = Self::find_mut(&mut manifest, palette_id)?;
        palette.colors.retain(|c| c.id != color_id);
        let updated = palette.clone();
        filesystem::write_manifest(project_dir, &manifest)?;
        Ok(updated)
    }

    fn find_mut<'a>(manifest: &'a mut PaletteManifest, palette_id: &str) -> Result<&'a mut Palette, AppError> {
        manifest
            .palettes
            .iter_mut()
            .find(|p| p.id == palette_id)
            .ok_or_else(|| AppError::PaletteNotFound { id: palette_id.to_string() })
    }
}
