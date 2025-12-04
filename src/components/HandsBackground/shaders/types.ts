// === HALFTONE SHADER ===
export type HalftonePattern = "dot" | "square";
export type HalftoneColorMode = "cmyk" | "rgb" | "mono";

export interface HalftoneSettings {
  dotSize: number; // 0.1 - 1.0 (dot radius within cell)
  pattern: HalftonePattern; // "dot" | "square"
  gridSpacing: number; // 10 - 150 (cells per unit - higher = more dots)
  gridAngle: number; // -180 to 180 (rotation of entire grid in degrees)
  smoothness: number; // 0.0 - 1.0 (edge softness)
  colorMode: HalftoneColorMode;
  monoColor: [number, number, number]; // RGB 0-1 for mono dot color
  monoBackgroundColor: [number, number, number]; // RGB 0-1 for mono background
  showOriginal: number; // 0.0 - 1.0 blend with original
}

// === ADJUSTMENTS SHADER ===
export interface AdjustmentsSettings {
  blur: number; // 0 - 100 (blur radius in pixels)
  gamma: number; // 0.2 - 3.0 (1.0 = no change)
  contrast: number; // 0.0 - 2.0 (1.0 = no change)
  brightness: number; // -1.0 - 1.0 (0.0 = no change)
  saturation: number; // 0.0 - 2.0 (1.0 = no change)
}

// === LAYER SYSTEM ===
export type ShaderLayerType = "halftone" | "adjustments";

// Each layer has a unique ID and its own settings
export interface ShaderLayer {
  id: string;
  type: ShaderLayerType;
  name: string; // User-editable name
  enabled: boolean;
  settings: HalftoneSettings | AdjustmentsSettings;
}

export interface ShaderSettings {
  layers: ShaderLayer[];
}

// Helper to generate unique IDs
export const generateLayerId = (): string => {
  return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Default settings for new layers
export const defaultHalftoneSettings: HalftoneSettings = {
  dotSize: 0.8,
  pattern: "dot",
  gridSpacing: 60,
  gridAngle: 0,
  smoothness: 0.5,
  colorMode: "cmyk",
  monoColor: [0.1, 0.1, 0.1],
  monoBackgroundColor: [1.0, 1.0, 1.0],
  showOriginal: 0,
};

export const defaultAdjustmentsSettings: AdjustmentsSettings = {
  blur: 0,
  gamma: 1.0,
  contrast: 1.0,
  brightness: 0.0,
  saturation: 1.0,
};

// Create a new layer with defaults
export const createHalftoneLayer = (name?: string): ShaderLayer => ({
  id: generateLayerId(),
  type: "halftone",
  name: name || "Halftone",
  enabled: true,
  settings: { ...defaultHalftoneSettings },
});

export const createAdjustmentsLayer = (name?: string): ShaderLayer => ({
  id: generateLayerId(),
  type: "adjustments",
  name: name || "Adjustments",
  enabled: true,
  settings: { ...defaultAdjustmentsSettings },
});

// Default shader settings with initial layers
export const defaultShaderSettings: ShaderSettings = {
  layers: [
    {
      id: "default_halftone",
      type: "halftone",
      name: "Halftone",
      enabled: false,
      settings: {
        dotSize: 0.8,
        pattern: "dot",
        gridSpacing: 60,
        gridAngle: 0,
        smoothness: 0.5,
        colorMode: "cmyk",
        monoColor: [0.1, 0.1, 0.1],
        monoBackgroundColor: [1, 1, 1],
        showOriginal: 0,
      },
    },
    {
      id: "layer_1764616325636_7dfy51d5w",
      type: "halftone",
      name: "Halftone 2",
      enabled: true,
      settings: {
        dotSize: 0.8,
        pattern: "dot",
        gridSpacing: 60,
        gridAngle: 0,
        smoothness: 0.5,
        colorMode: "cmyk",
        monoColor: [1, 0.9215686274509803, 0.9215686274509803],
        monoBackgroundColor: [1, 0.3411764705882353, 0.34509803921568627],
        showOriginal: 0,
      },
    },
    {
      id: "default_adjustments",
      type: "adjustments",
      name: "Adjustments",
      enabled: true,
      settings: {
        blur: 33,
        gamma: 0.28,
        contrast: 1.02,
        brightness: -0.01,
        saturation: 0.87,
      },
    },
  ],
};
