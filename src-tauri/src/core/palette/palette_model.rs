use serde::{Deserialize, Serialize};

/// Uma cor dentro de uma paleta. `alpha` fica separado do hex, mesma
/// convencao da cor ativa do editor (nao usa hex de 8 digitos).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaletteColor {
    pub id: String,
    pub hex: String,
    pub alpha: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Palette {
    pub id: String,
    pub name: String,
    pub colors: Vec<PaletteColor>,
}

/// Formato de `palettes.json` na raiz do projeto.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PaletteManifest {
    pub palettes: Vec<Palette>,
}
