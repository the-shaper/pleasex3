"use client";

import React, { useState } from "react";
import {
  ShaderSettings,
  ShaderLayer,
  HalftoneSettings,
  AdjustmentsSettings,
  HalftoneColorMode,
  HalftonePattern,
  createHalftoneLayer,
  createAdjustmentsLayer,
} from "./types";

interface ShaderControlsProps {
  settings: ShaderSettings;
  onSettingsChange: (settings: ShaderSettings) => void;
}

export const ShaderControls: React.FC<ShaderControlsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    settings.layers[0]?.id || null
  );

  const selectedLayer = settings.layers.find((l) => l.id === selectedLayerId);

  // Layer operations
  const updateLayer = (layerId: string, updates: Partial<ShaderLayer>) => {
    onSettingsChange({
      ...settings,
      layers: settings.layers.map((layer) =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      ),
    });
  };

  const updateLayerSettings = (
    layerId: string,
    settingsUpdates: Partial<HalftoneSettings | AdjustmentsSettings>
  ) => {
    onSettingsChange({
      ...settings,
      layers: settings.layers.map((layer) =>
        layer.id === layerId
          ? { ...layer, settings: { ...layer.settings, ...settingsUpdates } }
          : layer
      ),
    });
  };

  const addLayer = (type: "halftone" | "adjustments") => {
    const newLayer =
      type === "halftone"
        ? createHalftoneLayer(
            `Halftone ${settings.layers.filter((l) => l.type === "halftone").length + 1}`
          )
        : createAdjustmentsLayer(
            `Adjustments ${settings.layers.filter((l) => l.type === "adjustments").length + 1}`
          );

    onSettingsChange({
      ...settings,
      layers: [...settings.layers, newLayer],
    });
    setSelectedLayerId(newLayer.id);
  };

  const removeLayer = (layerId: string) => {
    const newLayers = settings.layers.filter((l) => l.id !== layerId);
    onSettingsChange({
      ...settings,
      layers: newLayers,
    });
    // Select another layer if current was deleted
    if (selectedLayerId === layerId) {
      setSelectedLayerId(newLayers[0]?.id || null);
    }
  };

  const moveLayer = (layerId: string, direction: "up" | "down") => {
    const index = settings.layers.findIndex((l) => l.id === layerId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index + 1 : index - 1;
    if (newIndex < 0 || newIndex >= settings.layers.length) return;

    const newLayers = [...settings.layers];
    [newLayers[index], newLayers[newIndex]] = [
      newLayers[newIndex],
      newLayers[index],
    ];

    onSettingsChange({
      ...settings,
      layers: newLayers,
    });
  };

  const duplicateLayer = (layerId: string) => {
    const layer = settings.layers.find((l) => l.id === layerId);
    if (!layer) return;

    const newLayer: ShaderLayer = {
      ...layer,
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${layer.name} Copy`,
      settings: { ...layer.settings },
    };

    const index = settings.layers.findIndex((l) => l.id === layerId);
    const newLayers = [...settings.layers];
    newLayers.splice(index + 1, 0, newLayer);

    onSettingsChange({
      ...settings,
      layers: newLayers,
    });
    setSelectedLayerId(newLayer.id);
  };

  return (
    <div
      className={`fixed top-5 right-5 w-[320px] bg-black/90 p-4 rounded-xl shadow-lg border border-[#ff5757]/30 z-50 transition-all duration-300 ${
        isCollapsed
          ? "max-h-[50px] overflow-hidden pb-0"
          : "max-h-[90vh] overflow-y-auto"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#ff5757]/50 pb-2 mb-3">
        <h3 className="m-0 text-sm text-white font-bold tracking-wide">
          SHADER FX
        </h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-none border-none text-xl cursor-pointer text-white/70 hover:text-[#ff5757] px-1"
        >
          {isCollapsed ? "+" : "–"}
        </button>
      </div>

      <div
        className={`transition-opacity duration-200 ${
          isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* LAYERS PANEL */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-[#ff5757]/80 uppercase">
              Layers
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => addLayer("adjustments")}
                className="px-2 py-1 text-xs bg-[#57a0ff]/20 text-[#57a0ff] rounded hover:bg-[#57a0ff]/30 transition-colors"
                title="Add Adjustments Layer"
              >
                + Adjust
              </button>
              <button
                onClick={() => addLayer("halftone")}
                className="px-2 py-1 text-xs bg-[#ff5757]/20 text-[#ff5757] rounded hover:bg-[#ff5757]/30 transition-colors"
                title="Add Halftone Layer"
              >
                + Halftone
              </button>
            </div>
          </div>

          {/* Layer List (reversed for display - top = last/top of stack) */}
          <div className="space-y-1 max-h-[150px] overflow-y-auto">
            {[...settings.layers].reverse().map((layer) => {
              const isSelected = layer.id === selectedLayerId;
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-white/20 border border-white/30"
                      : "bg-white/5 border border-transparent hover:bg-white/10"
                  } ${!layer.enabled ? "opacity-40" : ""}`}
                >
                  {/* Layer color indicator */}
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      layer.type === "halftone"
                        ? "bg-[#ff5757]"
                        : "bg-[#57a0ff]"
                    }`}
                  />

                  {/* Layer name */}
                  <span className="flex-1 text-xs text-white/80 truncate">
                    {layer.name}
                  </span>

                  {/* Enable toggle */}
                  <input
                    type="checkbox"
                    checked={layer.enabled}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateLayer(layer.id, { enabled: e.target.checked });
                    }}
                    className="accent-[#ff5757] flex-shrink-0"
                  />

                  {/* Move buttons */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, "up");
                    }}
                    className="text-white/30 hover:text-white text-xs px-0.5"
                    title="Move Up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, "down");
                    }}
                    className="text-white/30 hover:text-white text-xs px-0.5"
                    title="Move Down"
                  >
                    ▼
                  </button>
                </div>
              );
            })}
          </div>

          {settings.layers.length === 0 && (
            <p className="text-xs text-white/30 text-center py-4">
              No layers. Add one above.
            </p>
          )}
        </div>

        {/* SELECTED LAYER SETTINGS */}
        {selectedLayer && (
          <div className="border-t border-white/10 pt-4">
            {/* Layer header with name edit and actions */}
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={selectedLayer.name}
                onChange={(e) =>
                  updateLayer(selectedLayer.id, { name: e.target.value })
                }
                className="flex-1 bg-white/10 text-white text-xs px-2 py-1 rounded border border-white/20 focus:border-[#ff5757]/50 outline-none"
              />
              <button
                onClick={() => duplicateLayer(selectedLayer.id)}
                className="px-2 py-1 text-xs bg-white/10 text-white/60 rounded hover:bg-white/20 transition-colors"
                title="Duplicate Layer"
              >
                ⧉
              </button>
              <button
                onClick={() => removeLayer(selectedLayer.id)}
                className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                title="Delete Layer"
              >
                ✕
              </button>
            </div>

            {/* Layer type indicator */}
            <div
              className={`text-xs font-bold uppercase mb-3 ${
                selectedLayer.type === "halftone"
                  ? "text-[#ff5757]/80"
                  : "text-[#57a0ff]/80"
              }`}
            >
              {selectedLayer.type} Settings
            </div>

            {/* HALFTONE SETTINGS */}
            {selectedLayer.type === "halftone" && (
              <HalftoneControls
                settings={selectedLayer.settings as HalftoneSettings}
                onChange={(updates) =>
                  updateLayerSettings(selectedLayer.id, updates)
                }
              />
            )}

            {/* ADJUSTMENTS SETTINGS */}
            {selectedLayer.type === "adjustments" && (
              <AdjustmentsControls
                settings={selectedLayer.settings as AdjustmentsSettings}
                onChange={(updates) =>
                  updateLayerSettings(selectedLayer.id, updates)
                }
              />
            )}
          </div>
        )}

        {/* Copy Config Button */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
              alert("Shader config copied to clipboard!");
            }}
            className="w-full bg-[#ff5757] text-white text-xs font-bold py-2 px-4 rounded hover:bg-[#e54a4a] transition-colors"
          >
            COPY SHADER CONFIG
          </button>
        </div>
      </div>
    </div>
  );
};

// === HALFTONE CONTROLS ===
const HalftoneControls: React.FC<{
  settings: HalftoneSettings;
  onChange: (updates: Partial<HalftoneSettings>) => void;
}> = ({ settings: h, onChange }) => (
  <div className="space-y-3">
    {/* Color Mode */}
    <div>
      <label className="block text-xs font-bold mb-2 text-white/60">
        Color Mode
      </label>
      <div className="flex gap-1">
        {(["cmyk", "rgb", "mono"] as HalftoneColorMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => onChange({ colorMode: mode })}
            className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
              h.colorMode === mode
                ? "bg-[#ff5757] text-white"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>
    </div>

    {/* Pattern */}
    <div>
      <label className="block text-xs font-bold mb-2 text-white/60">
        Pattern
      </label>
      <div className="flex gap-1">
        {(["dot", "square"] as HalftonePattern[]).map((pattern) => (
          <button
            key={pattern}
            onClick={() => onChange({ pattern })}
            className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
              h.pattern === pattern
                ? "bg-[#ff5757] text-white"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            {pattern === "dot" ? "● Dot" : "■ Square"}
          </button>
        ))}
      </div>
    </div>

    <SliderControl
      label="Dot Size"
      value={h.dotSize}
      min={0.1}
      max={1.0}
      step={0.05}
      onChange={(v) => onChange({ dotSize: v })}
    />

    <SliderControl
      label="Grid Spacing"
      value={h.gridSpacing}
      min={10}
      max={150}
      step={1}
      onChange={(v) => onChange({ gridSpacing: v })}
    />

    <SliderControl
      label="Grid Angle"
      value={h.gridAngle}
      min={-180}
      max={180}
      step={1}
      onChange={(v) => onChange({ gridAngle: v })}
    />

    <SliderControl
      label="Smoothness"
      value={h.smoothness}
      min={0}
      max={1}
      step={0.05}
      onChange={(v) => onChange({ smoothness: v })}
    />

    <SliderControl
      label="Show Original"
      value={h.showOriginal}
      min={0}
      max={1}
      step={0.05}
      onChange={(v) => onChange({ showOriginal: v })}
    />

    {/* Mono Colors (only shown in mono mode) */}
    {h.colorMode === "mono" && (
      <div className="pt-3 border-t border-white/10 space-y-3">
        <div>
          <label className="block text-xs font-bold mb-2 text-white/60">
            Dot Color (Foreground)
          </label>
          <input
            type="color"
            value={rgbToHex(h.monoColor)}
            onChange={(e) => onChange({ monoColor: hexToRgb(e.target.value) })}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-2 text-white/60">
            Background Color
          </label>
          <input
            type="color"
            value={rgbToHex(h.monoBackgroundColor)}
            onChange={(e) =>
              onChange({ monoBackgroundColor: hexToRgb(e.target.value) })
            }
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
      </div>
    )}
  </div>
);

// === ADJUSTMENTS CONTROLS ===
const AdjustmentsControls: React.FC<{
  settings: AdjustmentsSettings;
  onChange: (updates: Partial<AdjustmentsSettings>) => void;
}> = ({ settings: a, onChange }) => (
  <div className="space-y-3">
    <SliderControl
      label="Blur"
      value={a.blur}
      min={0}
      max={100}
      step={1}
      onChange={(v) => onChange({ blur: v })}
    />

    <SliderControl
      label="Brightness"
      value={a.brightness}
      min={-1}
      max={1}
      step={0.01}
      onChange={(v) => onChange({ brightness: v })}
    />

    <SliderControl
      label="Contrast"
      value={a.contrast}
      min={0}
      max={2}
      step={0.01}
      onChange={(v) => onChange({ contrast: v })}
    />

    <SliderControl
      label="Gamma"
      value={a.gamma}
      min={0.2}
      max={3}
      step={0.01}
      onChange={(v) => onChange({ gamma: v })}
    />

    <SliderControl
      label="Saturation"
      value={a.saturation}
      min={0}
      max={2}
      step={0.01}
      onChange={(v) => onChange({ saturation: v })}
    />

    {/* Reset Button */}
    <button
      onClick={() =>
        onChange({
          blur: 0,
          brightness: 0,
          contrast: 1,
          gamma: 1,
          saturation: 1,
        })
      }
      className="w-full mt-2 bg-white/10 text-white/60 text-xs font-bold py-1.5 px-4 rounded hover:bg-white/20 transition-colors"
    >
      RESET TO DEFAULTS
    </button>
  </div>
);

// === SLIDER COMPONENT ===
const SliderControl: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
  <div>
    <div className="flex justify-between text-xs text-white/60 mb-1">
      <span>{label}</span>
      <span className="text-[#ff5757]">{value.toFixed(2)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 accent-[#ff5757] cursor-pointer"
    />
  </div>
);

// === COLOR HELPERS ===
const rgbToHex = (rgb: [number, number, number]): string => {
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
};
