"use client";

import React, { useState } from "react";
import {
  ShaderSettings,
  HalftoneColorMode,
  HalftonePattern,
  ShaderLayerType,
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
  const [activeTab, setActiveTab] = useState<
    "adjustments" | "halftone" | "layers"
  >("adjustments");

  const h = settings.halftone;
  const a = settings.adjustments;

  const updateHalftone = <K extends keyof typeof h>(
    key: K,
    value: (typeof h)[K]
  ) => {
    onSettingsChange({
      ...settings,
      halftone: { ...h, [key]: value },
    });
  };

  const updateAdjustments = <K extends keyof typeof a>(
    key: K,
    value: (typeof a)[K]
  ) => {
    onSettingsChange({
      ...settings,
      adjustments: { ...a, [key]: value },
    });
  };

  const moveLayer = (layer: ShaderLayerType, direction: "up" | "down") => {
    const currentOrder = [...settings.layerOrder];
    const index = currentOrder.indexOf(layer);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentOrder.length) return;

    // Swap
    [currentOrder[index], currentOrder[newIndex]] = [
      currentOrder[newIndex],
      currentOrder[index],
    ];

    onSettingsChange({
      ...settings,
      layerOrder: currentOrder,
    });
  };

  return (
    <div
      className={`fixed top-5 right-5 w-[300px] bg-black/90 p-4 rounded-xl shadow-lg border border-[#ff5757]/30 z-50 transition-all duration-300 ${
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
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-4">
          {(["adjustments", "halftone", "layers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
                activeTab === tab
                  ? "bg-[#ff5757] text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {tab === "adjustments"
                ? "ADJUST"
                : tab === "halftone"
                  ? "HALFTONE"
                  : "LAYERS"}
            </button>
          ))}
        </div>

        {/* ADJUSTMENTS TAB */}
        {activeTab === "adjustments" && (
          <div className="space-y-3">
            {/* Enable Toggle */}
            <label className="flex items-center gap-2 text-xs font-bold text-white/80 mb-2">
              <input
                type="checkbox"
                checked={a.enabled}
                onChange={(e) => updateAdjustments("enabled", e.target.checked)}
                className="accent-[#ff5757]"
              />
              Enable Adjustments
            </label>

            <SliderControl
              label="Blur"
              value={a.blur}
              min={0}
              max={100}
              step={1}
              onChange={(v) => updateAdjustments("blur", v)}
            />

            <SliderControl
              label="Brightness"
              value={a.brightness}
              min={-1}
              max={1}
              step={0.01}
              onChange={(v) => updateAdjustments("brightness", v)}
            />

            <SliderControl
              label="Contrast"
              value={a.contrast}
              min={0}
              max={2}
              step={0.01}
              onChange={(v) => updateAdjustments("contrast", v)}
            />

            <SliderControl
              label="Gamma"
              value={a.gamma}
              min={0.2}
              max={3}
              step={0.01}
              onChange={(v) => updateAdjustments("gamma", v)}
            />

            <SliderControl
              label="Saturation"
              value={a.saturation}
              min={0}
              max={2}
              step={0.01}
              onChange={(v) => updateAdjustments("saturation", v)}
            />

            {/* Reset Adjustments Button */}
            <button
              onClick={() => {
                onSettingsChange({
                  ...settings,
                  adjustments: {
                    ...a,
                    blur: 0,
                    brightness: 0,
                    contrast: 1,
                    gamma: 1,
                    saturation: 1,
                  },
                });
              }}
              className="w-full mt-2 bg-white/10 text-white/60 text-xs font-bold py-1.5 px-4 rounded hover:bg-white/20 transition-colors"
            >
              RESET TO DEFAULTS
            </button>
          </div>
        )}

        {/* HALFTONE TAB */}
        {activeTab === "halftone" && (
          <div className="space-y-3">
            {/* Enable Toggle */}
            <label className="flex items-center gap-2 text-xs font-bold text-white/80 mb-2">
              <input
                type="checkbox"
                checked={h.enabled}
                onChange={(e) => updateHalftone("enabled", e.target.checked)}
                className="accent-[#ff5757]"
              />
              Enable Halftone
            </label>

            {/* Color Mode */}
            <div className="mb-3">
              <label className="block text-xs font-bold mb-2 text-[#ff5757]/80 uppercase">
                Color Mode
              </label>
              <div className="flex gap-2">
                {(["cmyk", "rgb", "mono"] as HalftoneColorMode[]).map(
                  (mode) => (
                    <button
                      key={mode}
                      onClick={() => updateHalftone("colorMode", mode)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
                        h.colorMode === mode
                          ? "bg-[#ff5757] text-white"
                          : "bg-white/10 text-white/60 hover:bg-white/20"
                      }`}
                    >
                      {mode.toUpperCase()}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Pattern */}
            <div className="mb-3">
              <label className="block text-xs font-bold mb-2 text-[#ff5757]/80 uppercase">
                Pattern
              </label>
              <div className="flex gap-2">
                {(["dot", "square"] as HalftonePattern[]).map((pattern) => (
                  <button
                    key={pattern}
                    onClick={() => updateHalftone("pattern", pattern)}
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
              onChange={(v) => updateHalftone("dotSize", v)}
            />

            <SliderControl
              label="Grid Spacing"
              value={h.gridSpacing}
              min={10}
              max={150}
              step={1}
              onChange={(v) => updateHalftone("gridSpacing", v)}
            />

            <SliderControl
              label="Grid Angle"
              value={h.gridAngle}
              min={-180}
              max={180}
              step={1}
              onChange={(v) => updateHalftone("gridAngle", v)}
            />

            <SliderControl
              label="Smoothness"
              value={h.smoothness}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => updateHalftone("smoothness", v)}
            />

            <SliderControl
              label="Show Original"
              value={h.showOriginal}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => updateHalftone("showOriginal", v)}
            />

            {/* Mono Color */}
            {h.colorMode === "mono" && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <label className="block text-xs font-bold mb-2 text-[#ff5757]/80 uppercase">
                  Mono Color
                </label>
                <input
                  type="color"
                  value={rgbToHex(h.monoColor)}
                  onChange={(e) =>
                    updateHalftone("monoColor", hexToRgb(e.target.value))
                  }
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* LAYERS TAB */}
        {activeTab === "layers" && (
          <div className="space-y-2">
            <p className="text-xs text-white/50 mb-3">
              Drag layers to reorder. Top = rendered last (on top).
            </p>

            {/* Reversed order for display (top layer at top of list) */}
            {[...settings.layerOrder].reverse().map((layer, displayIndex) => {
              const realIndex = settings.layerOrder.length - 1 - displayIndex;
              const isEnabled = layer === "halftone" ? h.enabled : a.enabled;

              return (
                <div
                  key={layer}
                  className={`flex items-center gap-2 p-2 rounded border ${
                    isEnabled
                      ? "bg-white/10 border-[#ff5757]/30"
                      : "bg-white/5 border-white/10 opacity-50"
                  }`}
                >
                  {/* Layer icon/indicator */}
                  <div
                    className={`w-2 h-2 rounded-full ${
                      layer === "halftone" ? "bg-[#ff5757]" : "bg-[#57a0ff]"
                    }`}
                  />

                  {/* Layer name */}
                  <span className="flex-1 text-xs font-bold text-white/80 uppercase">
                    {layer}
                  </span>

                  {/* Enable toggle */}
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => {
                      if (layer === "halftone") {
                        updateHalftone("enabled", e.target.checked);
                      } else {
                        updateAdjustments("enabled", e.target.checked);
                      }
                    }}
                    className="accent-[#ff5757]"
                  />

                  {/* Move buttons */}
                  <button
                    onClick={() => moveLayer(layer, "down")} // down in array = up visually
                    disabled={realIndex === settings.layerOrder.length - 1}
                    className="text-white/40 hover:text-white disabled:opacity-20 text-sm px-1"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveLayer(layer, "up")} // up in array = down visually
                    disabled={realIndex === 0}
                    className="text-white/40 hover:text-white disabled:opacity-20 text-sm px-1"
                  >
                    ▼
                  </button>
                </div>
              );
            })}

            <p className="text-xs text-white/30 mt-3 pt-3 border-t border-white/10">
              Layer order: First in list renders on top.
            </p>
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

// Reusable slider control component
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

// Color conversion helpers
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
