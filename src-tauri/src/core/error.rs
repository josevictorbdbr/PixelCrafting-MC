use std::collections::HashMap;

use serde::Serialize;

/// Qual tipo de entidade um erro de nome/duplicidade se refere a - carregado
/// como parametro ("project"/"texture"/"template") para o frontend decidir
/// a frase certa no idioma ativo, em vez do backend decidir isso em portugues.
#[derive(Debug, Clone, Copy)]
pub enum EntityKind {
    Project,
    Texture,
    Template,
}

impl EntityKind {
    fn as_str(&self) -> &'static str {
        match self {
            EntityKind::Project => "project",
            EntityKind::Texture => "texture",
            EntityKind::Template => "template",
        }
    }
}

/// Erro central do app. Serializa como `{ code, params }` (nunca uma frase
/// pronta) - a traducao da mensagem final e responsabilidade do frontend
/// (dicionario i18n em `src/i18n/errors.ts`), que decide a frase no idioma
/// ativo a partir do `code` e recheia com os `params`.
#[derive(Debug)]
pub enum AppError {
    NameEmpty { entity: EntityKind },
    NameHasSpaces { entity: EntityKind },
    NameInvalidChars { entity: EntityKind, chars: String },
    NameReserved { name: String },
    AlreadyExists { entity: EntityKind, name: String },
    InvalidUuid,
    ProjectNotFound,
    DocumentsDirNotFound,
    ProjectJsonMissing,
    ProjectJsonCorrupted,
    InvalidCategory { category: String },
    InvalidResolution { min: u32, max: u32, width: u32, height: u32 },
    TextureNotFound { name: String, category: String },
    InvalidFileName,
    PixelDataSizeMismatch { expected: usize, received: usize },
    ImageBuildFailed,
    ImageDecodeError { detail: String },
    Io { detail: String },
    Serialization { detail: String },
    /// Editor tentou salvar mais camadas do que o teto permitido (6).
    LayerLimitReached { max: usize },
    /// Editor tentou salvar uma textura sem nenhuma camada (deve sempre
    /// sobrar pelo menos 1 - o Editor bloqueia excluir a ultima camada).
    EmptyLayerList,
    /// `id` de template nao encontrado nem entre os embutidos nem custom.
    TemplateNotFound { id: String },
    /// Pasta de recursos `resources/templates/` nao foi encontrada no
    /// bundle (normalmente falta registrar em `tauri.conf.json`).
    TemplateResourceDirNotFound,
    /// `id` de faixa de versao do Minecraft desconhecido no export
    /// (nao bate com nenhuma opcao do seletor no frontend).
    InvalidMcVersionBucket { id: String },
}

impl AppError {
    fn code(&self) -> &'static str {
        match self {
            AppError::NameEmpty { .. } => "name_empty",
            AppError::NameHasSpaces { .. } => "name_has_spaces",
            AppError::NameInvalidChars { .. } => "name_invalid_chars",
            AppError::NameReserved { .. } => "name_reserved",
            AppError::AlreadyExists { .. } => "already_exists",
            AppError::InvalidUuid => "invalid_uuid",
            AppError::ProjectNotFound => "project_not_found",
            AppError::DocumentsDirNotFound => "documents_dir_not_found",
            AppError::ProjectJsonMissing => "project_json_missing",
            AppError::ProjectJsonCorrupted => "project_json_corrupted",
            AppError::InvalidCategory { .. } => "invalid_category",
            AppError::InvalidResolution { .. } => "invalid_resolution",
            AppError::TextureNotFound { .. } => "texture_not_found",
            AppError::InvalidFileName => "invalid_file_name",
            AppError::PixelDataSizeMismatch { .. } => "pixel_data_size_mismatch",
            AppError::ImageBuildFailed => "image_build_failed",
            AppError::ImageDecodeError { .. } => "image_decode_error",
            AppError::Io { .. } => "io_error",
            AppError::Serialization { .. } => "serialization_error",
            AppError::LayerLimitReached { .. } => "layer_limit_reached",
            AppError::EmptyLayerList => "empty_layer_list",
            AppError::TemplateNotFound { .. } => "template_not_found",
            AppError::TemplateResourceDirNotFound => "template_resource_dir_not_found",
            AppError::InvalidMcVersionBucket { .. } => "invalid_mc_version_bucket",
        }
    }

    fn params(&self) -> HashMap<&'static str, String> {
        let mut map = HashMap::new();
        match self {
            AppError::NameEmpty { entity } | AppError::NameHasSpaces { entity } => {
                map.insert("entity", entity.as_str().to_string());
            }
            AppError::NameInvalidChars { entity, chars } => {
                map.insert("entity", entity.as_str().to_string());
                map.insert("chars", chars.clone());
            }
            AppError::NameReserved { name } => {
                map.insert("name", name.clone());
            }
            AppError::AlreadyExists { entity, name } => {
                map.insert("entity", entity.as_str().to_string());
                map.insert("name", name.clone());
            }
            AppError::InvalidCategory { category } => {
                map.insert("category", category.clone());
            }
            AppError::InvalidResolution { min, max, width, height } => {
                map.insert("min", min.to_string());
                map.insert("max", max.to_string());
                map.insert("width", width.to_string());
                map.insert("height", height.to_string());
            }
            AppError::TextureNotFound { name, category } => {
                map.insert("name", name.clone());
                map.insert("category", category.clone());
            }
            AppError::PixelDataSizeMismatch { expected, received } => {
                map.insert("expected", expected.to_string());
                map.insert("received", received.to_string());
            }
            AppError::ImageDecodeError { detail }
            | AppError::Io { detail }
            | AppError::Serialization { detail } => {
                map.insert("detail", detail.clone());
            }
            AppError::LayerLimitReached { max } => {
                map.insert("max", max.to_string());
            }
            AppError::TemplateNotFound { id } => {
                map.insert("id", id.clone());
            }
            AppError::InvalidMcVersionBucket { id } => {
                map.insert("id", id.clone());
            }
            _ => {}
        }
        map
    }
}

/// Formato exato que o frontend recebe do invoke() em caso de erro.
#[derive(Serialize)]
struct AppErrorPayload {
    code: &'static str,
    params: HashMap<&'static str, String>,
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        AppErrorPayload {
            code: self.code(),
            params: self.params(),
        }
        .serialize(serializer)
    }
}

/// So para logs internos (`log::warn!` etc) - nunca chega ao usuario, entao
/// nao precisa ser bonito nem traduzido.
impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} {:?}", self.code(), self.params())
    }
}

impl std::error::Error for AppError {}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io { detail: err.to_string() }
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Serialization { detail: err.to_string() }
    }
}

impl From<image::ImageError> for AppError {
    fn from(err: image::ImageError) -> Self {
        AppError::ImageDecodeError { detail: err.to_string() }
    }
}

/// Erros do crate `zip` (falha ao escrever entradas do resource pack)
/// viram Io - do ponto de vista do usuario e a mesma categoria de
/// problema (falha ao gravar o arquivo de destino).
impl From<zip::result::ZipError> for AppError {
    fn from(err: zip::result::ZipError) -> Self {
        AppError::Io { detail: err.to_string() }
    }
}
