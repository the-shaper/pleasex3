# Shader Engine - Multi-Layer Effects

## Overview

A reusable WebGL post-processing pipeline for the HandsBackground component that supports multiple stackable shader layers. Each layer can be enabled/disabled and reordered.

## Architecture

```
HandsBackground
├── HandsCanvas (2D canvas - renders hands animation)
│   └── Outputs to hidden canvas (used as texture source)
├── ShaderPipeline (WebGL - multi-pass post-processing)
│   ├── Framebuffer ping-pong for chaining effects
│   ├── Layer 1: Adjustments (blur, gamma, contrast, etc.)
│   └── Layer 2: Halftone (dot pattern effect)
├── Controls (existing hands settings UI)
└── ShaderControls (tabbed UI for all shader parameters)
```

## File Structure

```
src/components/HandsBackground/
├── index.tsx              # Main wrapper
├── HandsCanvas.tsx        # 2D animation (exposes canvas ref)
├── Controls.tsx           # Existing hands controls
├── config.ts              # Existing defaults
├── types.ts               # Existing types
└── shaders/
    ├── types.ts           # All shader type definitions + layer order
    ├── halftone.ts        # GLSL halftone shaders
    ├── adjustments.ts     # GLSL adjustments shaders (NEW)
    ├── ShaderPipeline.tsx # Multi-pass WebGL renderer
    └── ShaderControls.tsx # Tabbed UI controls
```

## Layer System

Shader layers are processed in order (configurable). The pipeline uses **framebuffer ping-pong** to chain multiple shader passes efficiently.

| Layer         | Description                                   | Default Order |
| ------------- | --------------------------------------------- | ------------- |
| `adjustments` | Blur, brightness, contrast, gamma, saturation | 1 (bottom)    |
| `halftone`    | Dot/square pattern halftone effect            | 2 (top)       |

### Layer Ordering

- Layers are processed in `layerOrder` array order
- First layer receives the original canvas texture
- Each subsequent layer receives output from previous layer
- Last layer outputs to screen

## Adjustments Shader Parameters

| Parameter    | Type    | Range      | Description              |
| ------------ | ------- | ---------- | ------------------------ |
| `enabled`    | boolean | on/off     | Toggle adjustments layer |
| `blur`       | number  | 0 - 100    | Blur radius (pixels)     |
| `brightness` | number  | -1.0 - 1.0 | Brightness offset        |
| `contrast`   | number  | 0 - 2.0    | Contrast multiplier      |
| `gamma`      | number  | 0.2 - 3.0  | Gamma correction         |
| `saturation` | number  | 0 - 2.0    | Color saturation         |

## Halftone Shader Parameters

| Parameter      | Type      | Range                   | Description                           |
| -------------- | --------- | ----------------------- | ------------------------------------- |
| `enabled`      | boolean   | on/off                  | Toggle halftone effect                |
| `dotSize`      | number    | 0.1 - 1.0               | Dot radius within cell (independent)  |
| `pattern`      | enum      | "dot" / "square"        | Shape of halftone elements            |
| `gridSpacing`  | number    | 10 - 150                | Cells per unit (more = smaller dots)  |
| `gridAngle`    | number    | -180 - 180              | Global rotation of dot grid (degrees) |
| `smoothness`   | number    | 0 - 1                   | Edge softness (anti-aliasing)         |
| `colorMode`    | enum      | "cmyk" / "rgb" / "mono" | Color separation mode                 |
| `monoColor`    | RGB tuple | [0-1, 0-1, 0-1]         | Dot color for mono mode               |
| `showOriginal` | number    | 0 - 1                   | Blend factor with original            |

## How It Works

### Multi-Pass Rendering (Framebuffer Ping-Pong)

1. **Pass 0**: Upload source canvas to texture
2. **Pass 1**: Run first shader (e.g., adjustments) → output to framebuffer A
3. **Pass 2**: Run second shader (e.g., halftone), input from framebuffer A → output to screen
4. For more layers, alternate between framebuffers A and B

### Adjustments Algorithm

```
brightness → contrast → gamma → saturation
```

1. **Brightness**: Add/subtract from RGB values
2. **Contrast**: Scale around mid-gray (0.5)
3. **Gamma**: Power function for non-linear adjustment
4. **Saturation**: Interpolate between grayscale and original

### Halftone Algorithm (CMYK Mode)

Based on traditional print halftone screens:

1. Convert RGB → CMYK (Cyan, Magenta, Yellow, Key/Black)
2. For each channel, create a rotated dot grid:
   - K (Black): 45° rotation
   - C (Cyan): 15° rotation
   - M (Magenta): 75° rotation
   - Y (Yellow): 0° rotation
3. Dot size = √(channel intensity) × dotSize
4. Apply smoothstep for anti-aliasing
5. Composite CMYK back to RGB (subtractive mixing)

## Usage

```tsx
// Basic usage with shader controls visible
<HandsBackground
  showShaderControls={true}
/>

// Production usage (no controls)
<HandsBackground />

// Full debug mode
<HandsBackground
  showControls={true}
  showShaderControls={true}
/>
```

## Adding New Shader Layers

1. Create new shader file in `shaders/` (e.g., `bloom.ts`)
2. Add settings interface to `shaders/types.ts`
3. Add layer type to `ShaderLayerType` union
4. Create program in `ShaderPipeline.tsx`
5. Add uniforms and render case in render loop
6. Add tab/controls in `ShaderControls.tsx`

Example future shaders:

- Bloom/Glow
- Chromatic Aberration
- Noise/Film Grain
- Pixelation
- Color Grading
- Vignette

## References

- [glsl-halftone](https://github.com/glslify/glsl-halftone/blob/master/index.glsl)
- [Halftone Shader Tutorial](https://agatedragon.blog/2024/03/31/halftone-shader/)

## Implementation Status

- [x] Documentation
- [x] Type definitions (`shaders/types.ts`)
- [x] GLSL halftone shaders (`shaders/halftone.ts`)
- [x] GLSL adjustments shaders (`shaders/adjustments.ts`)
- [x] Multi-pass WebGL pipeline (`shaders/ShaderPipeline.tsx`)
- [x] Tabbed UI controls (`shaders/ShaderControls.tsx`)
- [x] Layer ordering system
- [x] Framebuffer ping-pong for effect chaining

### Completed Features

- [x] add adjustment slider for angle/rotation of the dot/square grid
- [x] grid spacing independent from dot size
- [x] enable/disable toggle for each layer
- [x] adjustments layer (blur, gamma, contrast, brightness, saturation)
- [x] layer reordering UI
