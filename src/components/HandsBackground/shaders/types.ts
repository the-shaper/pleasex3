// === HALFTONE SHADER ===
export type HalftonePattern = "dot" | "square";
export type HalftoneColorMode = "cmyk" | "rgb" | "mono";

export interface HalftoneSettings {
  enabled: boolean;
  dotSize: number; // 0.1 - 1.0 (dot radius within cell)
  pattern: HalftonePattern; // "dot" | "square"
  gridSpacing: number; // 10 - 150 (cells per unit - higher = more dots)
  gridAngle: number; // -180 to 180 (rotation of entire grid in degrees)
  smoothness: number; // 0.0 - 1.0 (edge softness)
  colorMode: HalftoneColorMode;
  monoColor: [number, number, number]; // RGB 0-1 for mono mode
  showOriginal: number; // 0.0 - 1.0 blend with original
}

// === ADJUSTMENTS SHADER ===
export interface AdjustmentsSettings {
  enabled: boolean;
  blur: number; // 0 - 100 (blur radius in pixels)
  gamma: number; // 0.2 - 3.0 (1.0 = no change)
  contrast: number; // 0.0 - 2.0 (1.0 = no change)
  brightness: number; // -1.0 - 1.0 (0.0 = no change)
  saturation: number; // 0.0 - 2.0 (1.0 = no change)
}

// === LAYER SYSTEM ===
// Shader layers are processed in order (first = bottom, last = top)
export type ShaderLayerType = "adjustments" | "halftone";

export interface ShaderSettings {
  halftone: HalftoneSettings;
  adjustments: AdjustmentsSettings;
  layerOrder: ShaderLayerType[]; // Order of shader passes (first runs first)
}

export const defaultShaderSettings: ShaderSettings = {
  // Adjustments layer (blur, gamma, contrast, etc.)
  adjustments: {
    enabled: true,
    blur: 0,
    gamma: 1.0,
    contrast: 1.0,
    brightness: 0.0,
    saturation: 1.0,
  },
  // Halftone layer
  halftone: {
    enabled: true,
    dotSize: 0.8,
    pattern: "dot",
    gridSpacing: 60,
    gridAngle: 0,
    smoothness: 0.5,
    colorMode: "cmyk",
    monoColor: [0.1, 0.1, 0.1],
    showOriginal: 0.0,
  },
  // Default order: adjustments first (bottom), then halftone on top
  layerOrder: ["adjustments", "halftone"],
};
