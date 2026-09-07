export interface PaletteColor {
  id: string;
  hex: string;
  alpha: number;
}

export interface Palette {
  id: string;
  name: string;
  colors: PaletteColor[];
}
