use serde::{Deserialize, Serialize};

/// Categorias padrao criadas dentro de textures.
/// Lista fixa nesta etapa; categorias personalizadas ficam para uma etapa futura.
pub const DEFAULT_CATEGORIES: [&str; 7] = [
    "blocks",
    "items",
    "armor",
    "gui",
    "entities",
    "particles",
    "misc",
];

/// Conteudo completo do arquivo project.json de um projeto.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectManifest {
    pub id: String,
    pub name: String,
    /// Descricao livre do projeto, editavel depois da criacao.
    /// `#[serde(default)]` evita quebrar a leitura de project.json
    /// gravados antes deste campo existir.
    #[serde(default)]
    pub description: String,
    pub version: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
    #[serde(rename = "pixelCraftVersion")]
    pub pixel_craft_version: String,
}

impl ProjectManifest {
    /// Cria o manifest de um projeto novo, com timestamps atuais em ISO 8601.
    pub fn new(name: String) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: super::uuid_gen::generate_id(),
            name,
            description: String::new(),
            version: "1.0.0".to_string(),
            created_at: now.clone(),
            updated_at: now,
            pixel_craft_version: env!("CARGO_PKG_VERSION").to_string(),
        }
    }
}

/// Dados minimos exibidos na lista de projetos da HomeScreen.
/// O `id` viaja com o dado mas nunca e mostrado ao usuario (permanece interno).
#[derive(Debug, Clone, Serialize)]
pub struct ProjectSummary {
    pub id: String,
    pub name: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

impl From<&ProjectManifest> for ProjectSummary {
    fn from(manifest: &ProjectManifest) -> Self {
        Self {
            id: manifest.id.clone(),
            name: manifest.name.clone(),
            updated_at: manifest.updated_at.clone(),
        }
    }
}
