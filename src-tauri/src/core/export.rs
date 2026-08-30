use std::fs;
use std::io::Write;
use std::path::Path;

use zip::write::SimpleFileOptions;
use zip::{CompressionMethod, ZipWriter};

use super::error::AppError;
use super::project::{ProjectManager, ProjectManifest};
use super::texture::{TextureManager, TextureSummary};

/// Faixas de versao do Minecraft suportadas na exportacao. Cada uma cobre
/// versoes com o MESMO layout de assets (pasta de armadura, formato do
/// pack.mcmeta) - nao e uma versao especifica, e um "layout".
///
/// IMPORTANTE: os numeros de pack_format em `build_pack_mcmeta` vem da
/// tabela oficial do Minecraft Wiki (Pack Format) e ela muda a cada
/// atualizacao do jogo. Conferir/atualizar antes de cada build de
/// distribuicao - e por isso que essa tabela fica isolada aqui, longe do
/// resto do sistema de projetos/texturas.
#[derive(Debug, Clone, Copy)]
pub enum McVersionBucket {
    /// 1.20.2 a 1.21.1 - armadura em textures/models/armor, GUI ja no
    /// formato pos-split de sprites (1.20.2+).
    Legacy,
    /// 1.21.2 a 1.21.8 - armadura movida para textures/entity/equipment.
    Modern,
    /// 1.21.9 em diante - pack.mcmeta usa min_format/max_format em vez de
    /// um pack_format unico.
    Current,
}

impl McVersionBucket {
    /// Ids estaveis usados pelo frontend (seletor de versao no dialogo de
    /// export). Mudar aqui exige atualizar o seletor no frontend junto.
    pub fn from_id(id: &str) -> Result<Self, AppError> {
        match id {
            "1.20.2-1.21.1" => Ok(Self::Legacy),
            "1.21.2-1.21.8" => Ok(Self::Modern),
            "1.21.9+" => Ok(Self::Current),
            _ => Err(AppError::InvalidMcVersionBucket { id: id.to_string() }),
        }
    }
}

/// Caminho (relativo a assets/minecraft/textures/) de uma textura de
/// armadura, para a faixa de versao escolhida.
///
/// O nome da textura no app precisa seguir a convencao <material>_layer_1
/// (capacete/peitoral/botas) ou <material>_layer_2 (calca) - e assim que o
/// proprio Minecraft distingue as duas camadas de uma armadura. Textura de
/// armadura que nao segue essa convencao e ignorada no export (nao da pra
/// saber em qual camada ela entra).
///
/// - 1.20.2-1.21.1: pasta unica `models/armor`, sufixo mantido no nome do
///   arquivo (formato antigo, ex: `diamond_layer_1.png`).
/// - 1.21.2+: sistema novo de equipment - a camada agora e definida pela
///   SUBPASTA (`humanoid` / `humanoid_leggings`), e o sufixo NAO entra mais
///   no nome do arquivo (ex: `entity/equipment/humanoid/diamond.png`).
fn armor_entry_path(name: &str, bucket: McVersionBucket) -> Option<String> {
    let (material, is_leggings) = if let Some(material) = name.strip_suffix("_layer_2") {
        (material, true)
    } else if let Some(material) = name.strip_suffix("_layer_1") {
        (material, false)
    } else {
        return None;
    };

    Some(match bucket {
        McVersionBucket::Legacy => {
            let suffix = if is_leggings { "layer_2" } else { "layer_1" };
            format!("models/armor/{material}_{suffix}.png")
        }
        McVersionBucket::Modern | McVersionBucket::Current => {
            let folder = if is_leggings { "humanoid_leggings" } else { "humanoid" };
            format!("entity/equipment/{folder}/{material}.png")
        }
    })
}

/// Categoria interna do app -> caminho real (com nome de arquivo incluido)
/// dentro de assets/minecraft/textures, para a faixa de versao escolhida.
/// `misc` nao tem pasta oficial no Minecraft e por isso e sempre excluida
/// do export (retorna None).
fn mc_texture_entry_path(name: &str, category: &str, bucket: McVersionBucket) -> Option<String> {
    match category {
        "blocks" => Some(format!("block/{name}.png")),
        "items" => Some(format!("item/{name}.png")),
        "gui" => Some(format!("gui/{name}.png")),
        "entities" => Some(format!("entity/{name}.png")),
        "particles" => Some(format!("particle/{name}.png")),
        "armor" => armor_entry_path(name, bucket),
        _ => None,
    }
}

/// Monta o conteudo do pack.mcmeta para a faixa de versao escolhida.
/// Ver aviso sobre os numeros em `McVersionBucket`.
fn build_pack_mcmeta(description: &str, bucket: McVersionBucket) -> serde_json::Value {
    let mut pack = serde_json::json!({ "description": description });
    match bucket {
        // pack_format = versao mais recente da faixa; supported_formats
        // cobre o restante da faixa sem aviso de "pacote incompativel".
        McVersionBucket::Legacy => {
            pack["pack_format"] = serde_json::json!(34);
            pack["supported_formats"] = serde_json::json!({ "min_inclusive": 18, "max_inclusive": 34 });
        }
        McVersionBucket::Modern => {
            pack["pack_format"] = serde_json::json!(64);
            pack["supported_formats"] = serde_json::json!({ "min_inclusive": 42, "max_inclusive": 64 });
        }
        McVersionBucket::Current => {
            pack["min_format"] = serde_json::json!(69);
            pack["max_format"] = serde_json::json!(69);
        }
    }
    serde_json::json!({ "pack": pack })
}

pub struct ExportManager;

impl ExportManager {
    /// Gera o .zip do resource pack de um projeto: composite.png de cada
    /// textura exportavel + pack.mcmeta + pack.png (se o projeto tiver
    /// icone). Nao modifica nada do projeto, so le e empacota.
    pub fn export(
        root: &Path,
        project_id: &str,
        bucket: McVersionBucket,
        destination: &Path,
    ) -> Result<(), AppError> {
        let manifest = ProjectManager::open(root, project_id)?;
        let project_dir = ProjectManager::dir_by_id(root, project_id)?;
        let textures = TextureManager::list(&project_dir)?;
        let icon = ProjectManager::read_icon(root, project_id)?;

        write_zip(&manifest, &textures, icon, bucket, destination)
    }
}

fn write_zip(
    manifest: &ProjectManifest,
    textures: &[TextureSummary],
    icon: Option<Vec<u8>>,
    bucket: McVersionBucket,
    destination: &Path,
) -> Result<(), AppError> {
    let file = fs::File::create(destination)?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Deflated);

    let mcmeta = build_pack_mcmeta(&manifest.description, bucket);
    zip.start_file("pack.mcmeta", options)?;
    zip.write_all(serde_json::to_string_pretty(&mcmeta)?.as_bytes())?;

    if let Some(bytes) = icon {
        zip.start_file("pack.png", options)?;
        zip.write_all(&bytes)?;
    }

    for texture in textures {
        let Some(relative_path) = mc_texture_entry_path(&texture.name, &texture.category, bucket) else {
            continue;
        };
        let entry_name = format!("assets/minecraft/textures/{relative_path}");
        zip.start_file(entry_name, options)?;
        zip.write_all(&fs::read(&texture.path)?)?;
    }

    zip.finish()?;
    Ok(())
}
