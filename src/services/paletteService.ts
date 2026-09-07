import { invoke } from "@tauri-apps/api/core";
import type { Palette } from "../types/palette";

/**
 * Unico ponto de contato com os Tauri commands de paleta. Chaves camelCase
 * de proposito - o Tauri converte automaticamente pros parametros
 * snake_case do lado Rust (project_id, palette_id, color_id).
 */

export function listPalettes(projectId: string): Promise<Palette[]> {
  return invoke("list_palettes", { projectId });
}

export function createPalette(projectId: string, name: string): Promise<Palette> {
  return invoke("create_palette", { projectId, name });
}

export function deletePalette(projectId: string, paletteId: string): Promise<void> {
  return invoke("delete_palette", { projectId, paletteId });
}

export function addPaletteColor(
  projectId: string,
  paletteId: string,
  hex: string,
  alpha: number,
): Promise<Palette> {
  return invoke("add_palette_color", { projectId, paletteId, hex, alpha });
}

export function removePaletteColor(
  projectId: string,
  paletteId: string,
  colorId: string,
): Promise<Palette> {
  return invoke("remove_palette_color", { projectId, paletteId, colorId });
}
